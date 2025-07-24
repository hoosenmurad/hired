import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

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
  responsibilities: string[];
  requiredSkills: string[];
  description: string;
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

PERSONALIZATION INSTRUCTIONS:
1. Create questions that directly relate the candidate's specific experience to the target role
2. Reference their actual skills and background in behavioral questions
3. Ask technical questions aligned with both their expertise and job requirements
4. Consider their career goals when framing growth/motivation questions
5. Match the specified tone: professional (formal), casual (conversational), or challenging (rigorous)
6. Adjust difficulty: easy (basic concepts), medium (practical application), hard (complex scenarios)

QUESTION GUIDELINES:
- Make questions voice-assistant friendly (no special characters like "/" or "*")
- Create a balanced mix based on the interview type specified
- Ensure questions test job-relevant competencies
- Include follow-up potential in complex scenarios
- Make each question unique and targeted

Return exactly ${amount} personalized questions formatted as:
["Question 1", "Question 2", "Question 3"]`;

          isPersonalized = true;

          // Set personalized interview data
          interviewData = {
            ...interviewData,
            profileId,
            jobTargetId,
            role: `${jobTarget.title} at ${jobTarget.company}`,
            type: type || "personalized",
            level: level || difficulty,
            specialtySkills: specialtySkills
              ? specialtySkills.split(",")
              : jobTarget.requiredSkills,
            techstack: specialtySkills
              ? specialtySkills.split(",").map((skill: string) => skill.trim())
              : jobTarget.requiredSkills,
            tone,
            difficulty,
            isPersonalized: true,
          };
        }
      } catch (personalizationError) {
        console.warn(
          "Failed to fetch personalization data, falling back to standard interview:",
          personalizationError
        );
        // Fall through to standard interview generation
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

    // Parse and store the interview
    interviewData.questions = JSON.parse(questions);

    await db.collection("interviews").add(interviewData);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
