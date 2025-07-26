// VAPI session management with timeout and cost controls
import { db } from "@/firebase/admin";
import { getSessionTimeoutMinutes, incrementUsage } from "@/lib/billing";

interface VapiSession {
  userId: string;
  interviewId: string;
  sessionId: string;
  startTime: Date;
  maxDurationMinutes: number;
  questionsCount: number;
  status: "active" | "completed" | "timeout" | "error";
  estimatedCost: number;
  actualDurationMinutes?: number;
  actualCost?: number;
}

const VAPI_COST_PER_MINUTE = 0.25; // Estimated cost in USD

export async function createVapiSession(
  userId: string,
  interviewId: string,
  questionsCount: number
): Promise<{
  sessionId: string;
  maxDurationMinutes: number;
  success: boolean;
  error?: string;
}> {
  try {
    // Get user's timeout limit based on plan and usage
    const maxDurationMinutes = await getSessionTimeoutMinutes(
      userId,
      questionsCount
    );

    if (maxDurationMinutes <= 0) {
      return {
        sessionId: "",
        maxDurationMinutes: 0,
        success: false,
        error: "Session time limit exceeded for this billing period",
      };
    }

    const sessionId = `session_${Date.now()}_${userId.slice(-6)}`;
    const session: VapiSession = {
      userId,
      interviewId,
      sessionId,
      startTime: new Date(),
      maxDurationMinutes,
      questionsCount,
      status: "active",
      estimatedCost: maxDurationMinutes * VAPI_COST_PER_MINUTE,
    };

    // Store session in Firebase
    await db.collection("vapi_sessions").doc(sessionId).set(session);

    // Set up automatic timeout (cleanup function)
    setTimeout(async () => {
      await timeoutSession(sessionId);
    }, maxDurationMinutes * 60 * 1000);

    return {
      sessionId,
      maxDurationMinutes,
      success: true,
    };
  } catch (error) {
    console.error("Error creating VAPI session:", error);
    return {
      sessionId: "",
      maxDurationMinutes: 0,
      success: false,
      error: "Failed to create session",
    };
  }
}

export async function timeoutSession(sessionId: string): Promise<void> {
  try {
    const sessionDoc = await db
      .collection("vapi_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) return;

    const session = sessionDoc.data() as VapiSession;

    if (session.status === "active") {
      const now = new Date();
      const durationMinutes = Math.ceil(
        (now.getTime() - session.startTime.getTime()) / (1000 * 60)
      );

      await db
        .collection("vapi_sessions")
        .doc(sessionId)
        .update({
          status: "timeout",
          actualDurationMinutes: durationMinutes,
          actualCost: durationMinutes * VAPI_COST_PER_MINUTE,
          endTime: now,
        });

      // Update user's session minutes usage
      await incrementUsage(session.userId, "sessionMinutes", durationMinutes);

      console.log(
        `Session ${sessionId} timed out after ${durationMinutes} minutes`
      );
    }
  } catch (error) {
    console.error("Error timing out session:", error);
  }
}

export async function completeSession(
  sessionId: string,
  actualDurationMinutes: number
): Promise<{ success: boolean; cost: number }> {
  try {
    const sessionDoc = await db
      .collection("vapi_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return { success: false, cost: 0 };
    }

    const session = sessionDoc.data() as VapiSession;
    const actualCost = actualDurationMinutes * VAPI_COST_PER_MINUTE;

    await db.collection("vapi_sessions").doc(sessionId).update({
      status: "completed",
      actualDurationMinutes,
      actualCost,
      endTime: new Date(),
    });

    // Update user's session minutes usage
    await incrementUsage(
      session.userId,
      "sessionMinutes",
      actualDurationMinutes
    );

    return { success: true, cost: actualCost };
  } catch (error) {
    console.error("Error completing session:", error);
    return { success: false, cost: 0 };
  }
}

export async function getSessionStatus(
  sessionId: string
): Promise<VapiSession | null> {
  try {
    const sessionDoc = await db
      .collection("vapi_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) return null;

    return sessionDoc.data() as VapiSession;
  } catch (error) {
    console.error("Error getting session status:", error);
    return null;
  }
}

export async function checkSessionHealth(sessionId: string): Promise<{
  isActive: boolean;
  remainingMinutes: number;
  warningLevel: "none" | "warning" | "critical";
}> {
  try {
    const session = await getSessionStatus(sessionId);

    if (!session || session.status !== "active") {
      return { isActive: false, remainingMinutes: 0, warningLevel: "critical" };
    }

    const now = new Date();
    const elapsedMinutes =
      (now.getTime() - session.startTime.getTime()) / (1000 * 60);
    const remainingMinutes = Math.max(
      0,
      session.maxDurationMinutes - elapsedMinutes
    );

    let warningLevel: "none" | "warning" | "critical" = "none";
    if (remainingMinutes <= 1) {
      warningLevel = "critical";
    } else if (remainingMinutes <= 3) {
      warningLevel = "warning";
    }

    return {
      isActive: remainingMinutes > 0,
      remainingMinutes,
      warningLevel,
    };
  } catch (error) {
    console.error("Error checking session health:", error);
    return { isActive: false, remainingMinutes: 0, warningLevel: "critical" };
  }
}

interface VapiError {
  code?: string;
  message?: string;
  stack?: string;
}

// Voice service error handling
export class VapiErrorHandler {
  static handleVoiceServiceError(
    error: VapiError,
    sessionId: string
  ): {
    shouldRetry: boolean;
    userMessage: string;
    errorType: string;
  } {
    console.error("VAPI Error:", error, "Session:", sessionId);

    // Classify error types
    if (
      error?.code === "NETWORK_ERROR" ||
      error?.message?.includes("network")
    ) {
      return {
        shouldRetry: true,
        userMessage:
          "Network connection issue. Please check your internet and try again.",
        errorType: "network",
      };
    }

    if (error?.code === "QUOTA_EXCEEDED" || error?.message?.includes("quota")) {
      return {
        shouldRetry: false,
        userMessage:
          "Voice service quota exceeded. Please try again later or upgrade your plan.",
        errorType: "quota",
      };
    }

    if (error?.code === "TIMEOUT" || error?.message?.includes("timeout")) {
      return {
        shouldRetry: true,
        userMessage: "Connection timed out. Please try again.",
        errorType: "timeout",
      };
    }

    if (
      error?.code === "PERMISSION_DENIED" ||
      error?.message?.includes("permission")
    ) {
      return {
        shouldRetry: false,
        userMessage:
          "Microphone permission denied. Please allow microphone access and refresh the page.",
        errorType: "permission",
      };
    }

    // Generic error
    return {
      shouldRetry: true,
      userMessage:
        "Voice service temporarily unavailable. Please try again in a moment.",
      errorType: "unknown",
    };
  }

  static async logError(
    sessionId: string,
    error: VapiError,
    errorType: string
  ): Promise<void> {
    try {
      await db.collection("vapi_errors").add({
        sessionId,
        error: error.message || String(error),
        errorType,
        timestamp: new Date(),
        stack: error.stack || null,
      });
    } catch (logError) {
      console.error("Failed to log VAPI error:", logError);
    }
  }
}

const vapiSessionUtils = {
  createVapiSession,
  timeoutSession,
  completeSession,
  getSessionStatus,
  checkSessionHealth,
  VapiErrorHandler,
};

export default vapiSessionUtils;
