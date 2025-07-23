import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

interface ProfileData {
  id: string;
  name: string;
  summary: string;
  skills: string[];
  goals: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
}

interface JobTargetData {
  id: string;
  title: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  description: string;
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
  } = await request.json();

  try {
    let prompt = "";
    let isPersonalized = false;

    // Check if we have profile and job target for personalized interview
    if (profileId && jobTargetId) {
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

        // Generate personalized prompt
        prompt = `Create interview questions for a candidate with the following profile:

CANDIDATE PROFILE:
- Name: ${profile.name}
- Summary: ${profile.summary}
- Key Skills: ${profile.skills.join(", ")}
- Goals: ${profile.goals}
- Experience: ${profile.experience
          .map((exp) => `${exp.title} at ${exp.company}`)
          .join(", ")}

TARGET ROLE:
- Position: ${jobTarget.title} at ${jobTarget.company}
- Required Skills: ${jobTarget.requiredSkills.join(", ")}
- Key Responsibilities: ${jobTarget.responsibilities.join(", ")}
- Job Description: ${jobTarget.description}

INTERVIEW SETTINGS:
- Experience Level: ${level}
- Focus: ${type} (behavioral vs technical)
- Question Count: ${amount}

Please create personalized questions that:
1. Assess the candidate's fit for this specific role
2. Test relevant skills from both their background and job requirements
3. Include behavioral questions related to their experience
4. Include technical questions relevant to the role requirements
5. Match the specified experience level and focus

The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters.
Return the questions formatted like this:
["Question 1", "Question 2", "Question 3"]`;

        isPersonalized = true;
      }
    }

    // Fallback to original prompt if no personalization or data not found
    if (!isPersonalized) {
      prompt = `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack or specialty skills used in the job is: ${specialtySkills}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3`;
    }

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: prompt,
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      specialtySkills: specialtySkills.split(","),
      questions: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
      // Add personalization fields
      ...(profileId && { profileId }),
      ...(jobTargetId && { jobTargetId }),
      isPersonalized,
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
