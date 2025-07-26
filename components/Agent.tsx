"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import {
  createVapiSessionAction,
  completeVapiSessionAction,
  logVapiErrorAction,
} from "@/lib/actions/vapi-session.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

// Client-side error classification (simplified version)
function classifyVapiError(error: Error): {
  errorType: string;
  userMessage: string;
} {
  const message = error.message.toLowerCase();

  if (message.includes("network") || message.includes("connection")) {
    return {
      errorType: "network_error",
      userMessage:
        "Connection issue. Please check your internet and try again.",
    };
  }

  if (message.includes("quota") || message.includes("limit")) {
    return {
      errorType: "quota_exceeded",
      userMessage:
        "You've reached your session limit. Please upgrade your plan.",
    };
  }

  if (message.includes("timeout")) {
    return {
      errorType: "timeout_error",
      userMessage: "Session timed out. Please try starting a new interview.",
    };
  }

  if (message.includes("permission") || message.includes("unauthorized")) {
    return {
      errorType: "permission_error",
      userMessage: "Permission denied. Please check your subscription.",
    };
  }

  return {
    errorType: "unknown_error",
    userMessage: "An unexpected error occurred. Please try again.",
  };
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      setSessionStartTime(new Date());
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = async (error: Error) => {
      console.log("VAPI Error:", error);

      if (currentSessionId) {
        const errorInfo = classifyVapiError(error);

        // Log error via server action
        try {
          await logVapiErrorAction(
            currentSessionId,
            error,
            errorInfo.errorType
          );
        } catch (logError) {
          console.error("Failed to log error:", logError);
        }

        // Show user-friendly error message
        console.warn("Voice service issue:", errorInfo.userMessage);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [currentSessionId]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      // Calculate actual interview duration
      let actualDurationMinutes = 0;
      if (sessionStartTime) {
        const endTime = new Date();
        actualDurationMinutes = Math.ceil(
          (endTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
        );
      }

      // Complete the VAPI session tracking via server action
      if (currentSessionId && actualDurationMinutes > 0) {
        try {
          await completeVapiSessionAction(
            currentSessionId,
            actualDurationMinutes
          );
          console.log(
            `Interview session completed: ${actualDurationMinutes} minutes`
          );
        } catch (error) {
          console.error("Error completing session:", error);
        }
      }

      const result = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
        actualDurationMinutes, // Pass duration to feedback
      });

      if (result.success && result.feedbackId) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        // Even if feedback generation fails, redirect to feedback page with error state
        console.log("Error saving feedback:", result.error || "Unknown error");
        router.push(
          `/interview/${interviewId}/feedback?error=generation_failed`
        );
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [
    messages,
    callStatus,
    feedbackId,
    interviewId,
    router,
    type,
    userId,
    currentSessionId,
    sessionStartTime,
  ]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    try {
      if (type === "generate") {
        if (!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
          console.error("VAPI_WORKFLOW_ID environment variable is not set");
          setCallStatus(CallStatus.INACTIVE);
          return;
        }

        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID, {
          variableValues: {
            username: userName,
            userid: userId,
            interviewId: interviewId,
          },
        });
      } else {
        // Validate questions before starting interview
        if (!questions || questions.length === 0) {
          console.error("No questions provided for interview");
          setCallStatus(CallStatus.INACTIVE);
          return;
        }

        // Create VAPI session via server action
        const sessionResult = await createVapiSessionAction(
          userId!,
          interviewId!,
          questions.length
        );
        if (!sessionResult.success) {
          console.error("Failed to create session:", sessionResult.error);
          setCallStatus(CallStatus.INACTIVE);
          return;
        }

        // TypeScript: sessionResult is now guaranteed to have sessionId and maxDurationMinutes
        const { sessionId, maxDurationMinutes } = sessionResult as {
          success: true;
          sessionId: string;
          maxDurationMinutes: number;
        };

        setCurrentSessionId(sessionId);

        let formattedQuestions = "";
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");

        console.log("Starting interview with questions:", formattedQuestions);
        console.log(
          `Session created: ${sessionId}, Max duration: ${maxDurationMinutes} minutes`
        );

        await vapi.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
            userid: userId,
            interviewId: interviewId,
          },
          maxDurationSeconds: maxDurationMinutes * 60, // Use session timeout
        });
      }
    } catch (error) {
      console.error("Error starting Vapi call:", error);
      setCallStatus(CallStatus.INACTIVE);

      // Log error if we have a session
      if (currentSessionId) {
        try {
          await logVapiErrorAction(
            currentSessionId,
            error as Error,
            "startup_error"
          );
        } catch (logError) {
          console.error("Failed to log startup error:", logError);
        }
      }
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Start Interview"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
