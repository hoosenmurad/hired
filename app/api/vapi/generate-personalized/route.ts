import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const {
    profileId,
    jobTargetId,
    tone,
    difficulty,
    amount,
    userid,
    dynamicPrompt,
  } = await request.json();

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `${dynamicPrompt}

        Additional Guidelines:
        - The interview tone should be ${tone}
        - The difficulty level should be ${difficulty}
        - Generate exactly ${amount} questions
        - Questions should be voice-assistant friendly (no special characters like "/" or "*")
        - Mix behavioral and technical questions appropriately
        - Ensure questions test both the candidate's experience and the target role requirements
        - Make questions specific to the candidate's background and the target position
        
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Make sure the questions are personalized and relevant to both the candidate's profile and the target role.
      `,
    });

    const interview = {
      profileId,
      jobTargetId,
      userId: userid,
      questions: JSON.parse(questions),
      tone,
      difficulty,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
      // Legacy fields for compatibility
      role: "Personalized Interview",
      type: "personalized",
      level: difficulty,
      specialtySkills: [],
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}
