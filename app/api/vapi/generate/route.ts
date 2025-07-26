import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { getUserPlanInfo } from "@/lib/billing";
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

    // Get user's plan info
    const planInfo = await getUserPlanInfo();
    if (!planInfo.isSubscribed) {
      return Response.json(
        {
          success: false,
          error: "Subscription required",
          message: "Please subscribe to a plan to create interviews.",
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

    // Parse and store the interview with cleaning and fallback handling
    let parsedQuestions;
    try {
      // Remove any potential markdown formatting
      const cleanedQuestions = questions.replace(/```json\n?|\n?```/g, "");
      parsedQuestions = JSON.parse(cleanedQuestions);

      // Ensure it's an array
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Response is not an array");
      }

      // Limit questions if too many were generated
      if (parsedQuestions.length > amount * 1.5) {
        parsedQuestions = parsedQuestions.slice(0, amount);
      }
    } catch (parseError) {
      console.error("Failed to parse questions JSON:", parseError);
      // Fallback: split by lines and clean
      parsedQuestions = questions
        .split("\n")
        .filter((line) => line.trim().length > 10)
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, amount);
    }

    // Final validation
    if (!parsedQuestions || parsedQuestions.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Failed to generate questions",
        },
        { status: 500 }
      );
    }

    // Store interview in database
    interviewData.questions = parsedQuestions;
    const docRef = db.collection("interviews").doc();
    await docRef.set(interviewData);

    return Response.json({
      success: true,
      interviewId: docRef.id,
      questions: parsedQuestions,
      isPersonalized,
    });
  } catch (error) {
    console.error("Error generating interview:", error);
    return Response.json(
      {
        success: false,
        error: "An error occurred while generating the interview",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
