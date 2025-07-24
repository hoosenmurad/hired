import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { getUserPlanInfo } from "@/lib/billing";

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
          const profile = {
            id: profileDoc.id,
            ...profileDoc.data(),
          } as ProfileData;
          const jobTarget = {
            id: jobTargetDoc.id,
            ...jobTargetDoc.data(),
          } as JobTargetData;

          // Generate personalized prompt with enhanced content
          prompt = `Create a comprehensive interview for a candidate with the following detailed profile:

CANDIDATE PROFILE:
- Name: ${profile.name}
- Professional Summary: ${profile.summary}
- Core Skills: ${profile.skills.join(", ")}
- Career Goals: ${profile.goals}
- Professional Experience: ${profile.experience
            .map(
              (exp) =>
                `${exp.title} at ${exp.company} (${exp.duration}) - ${exp.description}`
            )
            .join(" | ")}

TARGET ROLE DETAILS:
- Position: ${jobTarget.title}
- Company: ${jobTarget.company}
- Required Skills: ${jobTarget.requiredSkills.join(", ")}
- Key Responsibilities: ${jobTarget.responsibilities.join(", ")}
- Job Description: ${jobTarget.description}

INTERVIEW PARAMETERS:
- Interview Type: ${
            type || "mixed"
          } (focus on behavioral vs technical questions)
- Experience Level: ${level || difficulty}
- Interview Tone: ${tone} (adjust question style accordingly)
- Difficulty Level: ${difficulty}
- Number of Questions: ${amount}
- Additional Skills Context: ${specialtySkills || "Not specified"}

INSTRUCTIONS:
1. Create ${amount} highly personalized interview questions that directly relate to the candidate's experience and the target role
2. Consider the candidate's background when formulating questions
3. Match the interview type, tone, and difficulty level specified
4. Ensure questions test both relevant skills and cultural fit
5. Make questions voice-assistant friendly (no special characters like "/" or "*")
6. Balance technical and behavioral questions based on the interview type
7. Reference specific experiences or skills when relevant

Return the questions formatted like this:
["Question 1", "Question 2", "Question 3"]`;

          // Set personalized interview data
          interviewData = {
            ...interviewData,
            profileId: profileId,
            jobTargetId: jobTargetId,
            role: `${jobTarget.title} at ${jobTarget.company}`,
            type: type || "mixed",
            level: level || difficulty,
            specialtySkills: jobTarget.requiredSkills,
            techstack: jobTarget.requiredSkills,
            tone,
            difficulty,
            isPersonalized: true,
          };

          isPersonalized = true;
        }
      } catch {
        // Fall back to standard interview if personalization fails
      }
    }

    // Fallback to original prompt if no personalization or data not found
    if (!isPersonalized) {
      prompt = `Create interview questions for the following job interview scenario:

JOB DETAILS:
- Role: ${role}
- Experience Level: ${level}
- Required Skills/Tech Stack: ${specialtySkills}
- Interview Focus: ${type} (behavioral vs technical emphasis)

INTERVIEW SETTINGS:
- Tone: ${tone} (adjust question style accordingly)
- Difficulty: ${difficulty}
- Number of Questions: ${amount}

INSTRUCTIONS:
1. Generate ${amount} relevant interview questions
2. Balance the focus based on the interview type specified
3. Match the experience level and difficulty appropriately
4. Ensure questions are voice-assistant friendly (no special characters like "/" or "*")
5. Create practical, realistic questions for this role and level
6. Adjust tone: professional (formal), casual (conversational), or challenging (rigorous)

Return the questions formatted like this:
["Question 1", "Question 2", "Question 3"]`;

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
      let cleanedQuestions = questions.trim();

      // Remove markdown code blocks if present
      cleanedQuestions = cleanedQuestions
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
      cleanedQuestions = cleanedQuestions
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");

      // Remove any leading/trailing whitespace
      cleanedQuestions = cleanedQuestions.trim();

      parsedQuestions = JSON.parse(cleanedQuestions);

      // Validate that it's an array
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Response is not an array");
      }
    } catch {
      // Fallback: try to extract questions from text using multiple patterns
      let fallbackQuestions = [];

      // Try to find JSON array in the text
      const jsonMatch = questions.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          fallbackQuestions = JSON.parse(jsonMatch[0]);
        } catch {
          // If that fails, try text extraction
          fallbackQuestions = questions
            .split(/\d+\.|\n-|\n\*|Here are \d+ |Here are the \d+ /)
            .filter((q) => q.trim().length > 10)
            .map((q) => q.trim().replace(/^["'\s]+|["'\s]+$/g, ""))
            .filter((q) => q.length > 0)
            .slice(0, amount);
        }
      } else {
        // Extract from numbered/bulleted list
        fallbackQuestions = questions
          .split(/\d+\.|\n-|\n\*|Here are \d+ |Here are the \d+ /)
          .filter((q) => q.trim().length > 10)
          .map((q) => q.trim().replace(/^["'\s]+|["'\s]+$/g, ""))
          .filter((q) => q.length > 0)
          .slice(0, amount);
      }

      if (fallbackQuestions.length === 0) {
        return Response.json(
          {
            success: false,
            error: "Failed to generate valid questions",
            details: "AI response could not be parsed",
          },
          { status: 500 }
        );
      }

      parsedQuestions = fallbackQuestions;
    }

    interviewData.questions = parsedQuestions;

    await db.collection("interviews").add(interviewData);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
