"use server";

import { auth } from "@clerk/nextjs/server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { PROMPTS, validateContextLimits } from "@/lib/prompts";
import {
  enhancedFeedbackSchema,
  getSystemLimitations,
  generateNextSteps,
  getPercentileForScore,
} from "@/lib/scoring-system";
import { getSessionComparison } from "@/lib/session-tracking";

// Simple transcript validation
function validateTranscript(transcript: { role: string; content: string }[]): {
  isValid: boolean;
  issues: string[];
  completeness: number;
} {
  const issues: string[] = [];
  let totalWords = 0;
  let candidateResponseCount = 0;

  for (const sentence of transcript) {
    if (!sentence.content || sentence.content.trim().length < 5) {
      issues.push("Found very short or empty responses");
    }

    totalWords += sentence.content.split(" ").length;

    if (sentence.role === "user" || sentence.role === "candidate") {
      candidateResponseCount++;
    }
  }

  if (totalWords < 50) {
    issues.push("Transcript is too short (less than 50 words)");
  }

  if (candidateResponseCount < 2) {
    issues.push("Very few candidate responses detected");
  }

  const completeness = Math.min(100, (totalWords / 200) * 100); // Expect ~200 words minimum
  const isValid = issues.length === 0 && completeness >= 40;

  return { isValid, issues, completeness };
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId, actualDurationMinutes } =
    params;

  try {
    // Get the interview to retrieve questions and level
    const interview = await getInterviewById(interviewId);
    if (!interview) {
      throw new Error("Interview not found");
    }

    // Update interview document with completion data
    if (actualDurationMinutes !== undefined) {
      try {
        await db.collection("interviews").doc(interviewId).update({
          completedAt: new Date().toISOString(),
          actualDurationMinutes: actualDurationMinutes,
          status: "completed",
        });
      } catch (error) {
        console.warn("Failed to update interview duration:", error);
      }
    }

    // Validate transcript quality
    const transcriptValidation = validateTranscript(transcript);
    if (!transcriptValidation.isValid) {
      console.warn(
        `Transcript quality issues for interview ${interviewId}:`,
        transcriptValidation.issues
      );
    }

    // Determine experience level from interview data
    const level = interview.level?.toLowerCase() || "mid";
    const validLevels = ["junior", "mid", "senior"];
    const experienceLevel = validLevels.includes(level) ? level : "mid";

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    // Generate enhanced feedback prompt with level calibration
    const prompt = PROMPTS.FEEDBACK_ANALYSIS(
      interview.questions,
      formattedTranscript,
      experienceLevel
    );

    // Validate context limits
    const validation = validateContextLimits(prompt, "", "gemini-2.0-flash");
    if (!validation.isValid) {
      console.warn(
        `Feedback context limit exceeded: ${validation.estimatedTokens}/${validation.maxTokens} tokens`
      );
      // For feedback, we'll proceed but log the warning as it's critical functionality
    }

    let object;
    try {
      const result = await generateObject({
        model: google("gemini-2.0-flash-001", {
          structuredOutputs: false,
        }),
        schema: enhancedFeedbackSchema,
        prompt: prompt,
        system:
          "You are a professional interviewer providing realistic, calibrated assessment. Use the full scoring range and be honest about gaps. Focus on interview communication skills.",
      });

      object = result.object;

      if (!object || !object.totalScore) {
        throw new Error("AI feedback generation returned invalid response");
      }
    } catch (aiError) {
      console.error("AI feedback generation failed:", aiError);

      // Return basic fallback feedback
      return {
        success: false,
        error: "Failed to generate detailed feedback. Please try again.",
        fallback: {
          message: `Interview completed with ${interview.questions.length} questions.`,
          transcriptQuality: transcriptValidation.completeness,
          suggestion:
            "The interview data has been saved. Please try generating feedback again in a moment.",
        },
      };
    }

    // Get session comparison for progress tracking
    const sessionComparison = await getSessionComparison(
      userId,
      object.totalScore
    );

    // Enhance the feedback with additional computed fields
    const enhancedFeedback = {
      ...object,
      // Add system limitations
      limitations:
        object.limitations?.length > 0
          ? object.limitations
          : getSystemLimitations(),

      // Add computed next steps if not provided
      nextSteps:
        object.nextSteps?.length > 0
          ? object.nextSteps
          : generateNextSteps(object.categoryScores, object.totalScore),

      // Add percentile information if missing
      overallPercentile:
        object.overallPercentile ||
        getPercentileForScore(object.totalScore, "overall", experienceLevel),

      // Add session comparison data
      sessionComparison,

      // Add transcript quality info
      transcriptQuality: {
        completeness: transcriptValidation.completeness,
        issues: transcriptValidation.issues,
        isReliable: transcriptValidation.isValid,
      },

      // Add metadata
      metadata: {
        experienceLevel,
        assessmentDate: new Date().toISOString(),
        questionCount: interview.questions.length,
        transcriptLength: formattedTranscript.length,
        actualDurationMinutes: actualDurationMinutes || 0,
        estimatedDurationMinutes: interview.questions.length * 3,
        durationEfficiency: actualDurationMinutes
          ? Math.round(
              (actualDurationMinutes / (interview.questions.length * 3)) * 100
            )
          : 0,
        systemVersion: "enhanced-v1.0",
      },
    };

    const feedback = {
      interviewId: interviewId,
      userId: userId,

      // Enhanced scoring data
      totalScore: enhancedFeedback.totalScore,
      overallPercentile: enhancedFeedback.overallPercentile,
      reliabilityScore: enhancedFeedback.reliabilityScore,

      // Detailed category analysis
      categoryScores: enhancedFeedback.categoryScores,
      questionRatings: enhancedFeedback.questionRatings,

      // Enhanced insights
      strengths: enhancedFeedback.strengths,
      areasForImprovement: enhancedFeedback.areasForImprovement,
      finalAssessment: enhancedFeedback.finalAssessment,

      // Transparency and guidance
      limitations: enhancedFeedback.limitations,
      nextSteps: enhancedFeedback.nextSteps,

      // Session tracking
      sessionComparison: enhancedFeedback.sessionComparison,

      // Quality indicators
      transcriptQuality: enhancedFeedback.transcriptQuality,

      // Metadata
      metadata: enhancedFeedback.metadata,

      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return {
      success: false,
      error: "Failed to process interview feedback",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export const newInterviewPermissions =
  async (): Promise<NewInterviewPermission> => {
    const { userId, has } = await auth();
    if (!userId) throw new Error("User not authenticated");

    // Determine limit based on subscription
    let limit = 0;
    if (await has({ plan: "hired" })) {
      limit = 20;
    } else if (await has({ plan: "prepped" })) {
      limit = 10;
    } else if (await has({ plan: "hustle" })) {
      limit = 5;
    } else {
      return { allowed: false, limit: 0, used: 0 };
    }

    // Count user's current interviews
    const snapshot = await db
      .collection("interviews")
      .where("author", "==", userId)
      .get();
    const used = snapshot.size;

    return {
      allowed: used < limit,
      limit,
      used,
    };
  };
