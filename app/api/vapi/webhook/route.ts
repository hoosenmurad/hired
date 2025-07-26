import { NextRequest } from "next/server";
import { db } from "@/firebase/admin";
import { deductMinutesFromUser } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, call } = body;

    console.log("VAPI Webhook received:", { type, callId: call?.id });

    // Only handle call events
    if (!call) {
      return Response.json(
        { message: "No call data provided" },
        { status: 400 }
      );
    }

    const { startedAt, endedAt, metadata } = call;

    // Extract interview ID and user ID from metadata or variable values
    const interviewId =
      metadata?.interviewId || call.variableValues?.interviewId;
    const userId = metadata?.userId || call.variableValues?.userid;

    if (!interviewId || !userId) {
      console.log("Missing interview or user ID in webhook data");
      return Response.json(
        { message: "Missing required metadata" },
        { status: 400 }
      );
    }

    switch (type) {
      case "call-start":
        // Update interview with start time
        await db.collection("interviews").doc(interviewId).update({
          startTime: startedAt,
        });
        console.log(`Interview ${interviewId} started at ${startedAt}`);
        break;

      case "call-end":
        // Calculate duration and update interview
        if (startedAt && endedAt) {
          const startTime = new Date(startedAt);
          const endTime = new Date(endedAt);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Round up to nearest minute

          // Update interview with end time and duration
          await db.collection("interviews").doc(interviewId).update({
            endTime: endedAt,
            duration: durationMinutes,
          });

          // Deduct the actual interview time from user's account
          await deductMinutesFromUser(userId, durationMinutes);

          console.log(
            `Interview ${interviewId} ended. Duration: ${durationMinutes} minutes deducted from user account`
          );
        }
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
        break;
    }

    return Response.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing VAPI webhook:", error);
    return Response.json(
      { message: "Error processing webhook", error: error },
      { status: 500 }
    );
  }
}
