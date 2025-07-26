import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { checkQuotaAvailability, incrementUsage } from "@/lib/billing";
import {
  PROMPTS,
  validateContextLimits,
  optimizeProfileData,
  optimizeJobTargetData,
} from "@/lib/prompts";

// Use the global type definitions for consistency
// These match the interfaces defined in types/index.d.ts
interface ProfileData {
  id: string;
  userId: string;
  name: string;
  summary: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  goals: string;
  createdAt: string;
  updatedAt: string;
}

interface JobTargetData {
  id: string;
  userId: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  responsibilities: string[];
  createdAt: string;
  updatedAt: string;
}

interface InterviewData {
  userId: string;
  questions: string[];
  finalized: boolean;
  coverImage: string;
  createdAt: string;
  profileId?: string;
  jobTargetId?: string;
  role?: string;
  type?: string;
  level?: string;
  specialtySkills?: string[];
  techstack?: string[];
  tone?: string;
  difficulty?: string;
  isPersonalized?: boolean;
}

export async function POST(request: Request) {
  const {
    type,
    role,
    level,
    specialtySkills,
    amount,
    userid,
    profileId,
    jobTargetId,
    tone = "professional",
    difficulty = "medium",
  } = await request.json();

  try {
    // Check if user is authenticated and has a subscription
    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check quota before processing
    const quota = await checkQuotaAvailability(userId, "interview");
    if (!quota.allowed) {
      return Response.json(
        {
          success: false,
          error: `Interview limit reached. You have ${quota.remaining} of ${quota.limit} remaining this month.`,
          quota: quota,
        },
        { status: 403 }
      );
    }

    let prompt = "";
    let isPersonalized = false;
    let interviewData: InterviewData = {
      userId: userid,
      questions: [],
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    // Check if we have profile and job target for personalized interview
    if (profileId && jobTargetId) {
      try {
        // Fetch profile and job target data
        const [profileDoc, jobTargetDoc] = await Promise.all([
          db.collection("profiles").doc(profileId).get(),
          db.collection("job_targets").doc(jobTargetId).get(),
        ]);

        if (profileDoc.exists && jobTargetDoc.exists) {
          const rawProfile = {
            id: profileDoc.id,
            ...profileDoc.data(),
          } as ProfileData;
          const rawJobTarget = {
            id: jobTargetDoc.id,
            ...jobTargetDoc.data(),
          } as JobTargetData;

          // Optimize data for token efficiency
          const profile = optimizeProfileData(rawProfile);
          const jobTarget = optimizeJobTargetData(rawJobTarget);

          // Generate optimized personalized prompt
          prompt = PROMPTS.INTERVIEW_PERSONALIZED({
            profile,
            jobTarget,
            type: type || "mixed",
            level: level || difficulty,
            tone,
            difficulty,
            amount,
            specialtySkills,
          });

          // Validate context limits
          const validation = validateContextLimits(
            prompt,
            "",
            "gemini-2.0-flash"
          );
          if (!validation.isValid) {
            console.warn(
              `Context limit exceeded: ${validation.estimatedTokens}/${validation.maxTokens} tokens`
            );
            // Fallback to standard prompt if personalized is too large
            isPersonalized = false;
          } else {
            // Set personalized interview data
            interviewData = {
              ...interviewData,
              profileId: profileId,
              jobTargetId: jobTargetId,
              role: `${jobTarget.title} at ${jobTarget.company}`,
              type: type || "mixed",
              level: level || difficulty,
              specialtySkills: jobTarget.requiredSkills || [],
              techstack: jobTarget.requiredSkills || [],
              tone,
              difficulty,
              isPersonalized: true,
            };

            isPersonalized = true;
          }
        }
      } catch (error) {
        console.error("Error fetching personalization data:", error);
        // Fall back to standard interview if personalization fails
      }
    }

    // Fallback to optimized standard prompt if no personalization or context exceeded
    if (!isPersonalized) {
      prompt = PROMPTS.INTERVIEW_STANDARD({
        role,
        level,
        specialtySkills,
        type,
        tone,
        difficulty,
        amount,
      });

      // Set standard interview data
      interviewData = {
        ...interviewData,
        role: role,
        type: type,
        level: level,
        specialtySkills: specialtySkills ? specialtySkills.split(",") : [],
        techstack: specialtySkills
          ? specialtySkills.split(",").map((skill: string) => skill.trim())
          : [],
        tone,
        difficulty,
        isPersonalized: false,
      };
    }

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: prompt,
    });

    // Enhanced question parsing with multiple fallback strategies
    let parsedQuestions: string[];
    try {
      // Strategy 1: Direct JSON parsing
      const cleanedQuestions = questions
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      parsedQuestions = JSON.parse(cleanedQuestions);

      // Validate it's an array of strings
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Response is not an array");
      }

      // Validate each item is a string
      parsedQuestions = parsedQuestions.filter(
        (q) => typeof q === "string" && q.trim().length > 0
      );

      if (parsedQuestions.length === 0) {
        throw new Error("No valid questions found");
      }
    } catch (parseError) {
      console.warn(
        "Primary JSON parsing failed, trying fallback methods:",
        parseError
      );

      try {
        // Strategy 2: Extract JSON array pattern from text
        const jsonMatch = questions.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          parsedQuestions = JSON.parse(jsonMatch[0]);
          if (!Array.isArray(parsedQuestions)) throw new Error("Not an array");
          parsedQuestions = parsedQuestions.filter(
            (q) => typeof q === "string" && q.trim().length > 0
          );
        } else {
          throw new Error("No JSON array found");
        }
      } catch (secondaryParseError) {
        console.warn(
          "Secondary JSON parsing failed, using text extraction:",
          secondaryParseError
        );

        // Strategy 3: Text-based extraction
        parsedQuestions = questions
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 10)
          .map((line) => {
            // Remove numbering, quotes, and markdown
            return line
              .replace(/^\d+\.\s*/, "")
              .replace(/^[-*]\s*/, "")
              .replace(/^["'`]/, "")
              .replace(/["'`]$/, "")
              .trim();
          })
          .filter((q) => q.length > 10 && q.includes("?"))
          .slice(0, amount);
      }
    }

    // Final validation of questions
    if (!parsedQuestions || parsedQuestions.length === 0) {
      console.error(
        "Failed to extract any valid questions from AI response:",
        questions
      );
      return Response.json(
        {
          success: false,
          error:
            "Failed to generate valid interview questions. Please try again.",
          debug:
            process.env.NODE_ENV === "development"
              ? { originalResponse: questions }
              : undefined,
        },
        { status: 500 }
      );
    }

    // Ensure we have the right number of questions
    if (parsedQuestions.length > amount * 1.5) {
      parsedQuestions = parsedQuestions.slice(0, amount);
    } else if (parsedQuestions.length < Math.max(1, amount * 0.5)) {
      console.warn(
        `Generated ${parsedQuestions.length} questions but expected around ${amount}`
      );
    }

    // Store interview in database
    interviewData.questions = parsedQuestions;
    const docRef = db.collection("interviews").doc();
    await docRef.set(interviewData);

    // Increment usage after successful creation
    await incrementUsage(userId, "interview");

    return Response.json({
      success: true,
      interviewId: docRef.id,
      questions: parsedQuestions,
      isPersonalized,
      questionsGenerated: parsedQuestions.length,
    });
  } catch (error) {
    console.error("Error generating interview:", error);
    return Response.json(
      {
        success: false,
        error: "An error occurred while generating the interview",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
