"use server";

import {
  createVapiSession,
  completeSession,
  VapiErrorHandler,
} from "@/lib/vapi-session";

export async function createVapiSessionAction(
  userId: string,
  interviewId: string,
  questionCount: number
) {
  try {
    return await createVapiSession(userId, interviewId, questionCount);
  } catch (error) {
    console.error("Error creating VAPI session:", error);
    return {
      success: false,
      error: "Failed to create session",
    };
  }
}

export async function completeVapiSessionAction(
  sessionId: string,
  actualDurationMinutes: number
) {
  try {
    return await completeSession(sessionId, actualDurationMinutes);
  } catch (error) {
    console.error("Error completing VAPI session:", error);
    return {
      success: false,
      error: "Failed to complete session",
    };
  }
}

export async function logVapiErrorAction(
  sessionId: string,
  error: Error,
  errorType: string
) {
  try {
    return await VapiErrorHandler.logError(sessionId, error, errorType);
  } catch (logError) {
    console.error("Error logging VAPI error:", logError);
    return {
      success: false,
      error: "Failed to log error",
    };
  }
}
