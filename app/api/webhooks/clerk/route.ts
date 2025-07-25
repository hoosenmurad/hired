import { NextRequest } from "next/server";
import { db } from "@/firebase/admin";
import { PLAN_LIMITS } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Handle organization membership events (plan changes)
    if (
      type === "organizationMembership.created" ||
      type === "organizationMembership.updated"
    ) {
      const userId = data.public_user_data?.user_id;
      const planType = data.organization?.slug; // Assuming plan type is stored in org slug

      if (
        userId &&
        planType &&
        PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]
      ) {
        const planMinutes =
          PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS].minutesToAdd;

        // Add plan minutes to user account
        await db.collection("users").doc(userId).set(
          {
            totalMinutes: planMinutes,
            planType: planType,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );

        console.log(
          `Added ${planMinutes} minutes to user ${userId} for ${planType} plan`
        );
      }
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Clerk webhook:", error);
    return Response.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
