import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";

// Plan configurations - minutes are added to user account when they purchase
export const PLAN_LIMITS = {
  hustle: {
    interviews: 5,
    minutesToAdd: 15, // minutes added to account on purchase
  },
  prepped: {
    interviews: 10,
    minutesToAdd: 60, // minutes added to account on purchase
  },
  hired: {
    interviews: 20,
    minutesToAdd: 100, // minutes added to account on purchase
  },
};

export interface UserPlanInfo {
  plan: string | null;
  interviewLimit: number;
  isSubscribed: boolean;
}

export async function getUserPlanInfo(): Promise<UserPlanInfo> {
  const { has } = await auth();

  // Check plans in order of priority
  if (await has({ plan: "hired" })) {
    return {
      plan: "hired",
      interviewLimit: PLAN_LIMITS.hired.interviews,
      isSubscribed: true,
    };
  } else if (await has({ plan: "prepped" })) {
    return {
      plan: "prepped",
      interviewLimit: PLAN_LIMITS.prepped.interviews,
      isSubscribed: true,
    };
  } else if (await has({ plan: "hustle" })) {
    return {
      plan: "hustle",
      interviewLimit: PLAN_LIMITS.hustle.interviews,
      isSubscribed: true,
    };
  }

  // No subscription
  return {
    plan: null,
    interviewLimit: 0,
    isSubscribed: false,
  };
}

// Get user's available minutes - automatically sync with plan
export async function getUserMinutes(): Promise<number> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const planInfo = await getUserPlanInfo();

  // If user doesn't have a plan, they have 0 minutes
  if (!planInfo.isSubscribed) {
    return 0;
  }

  const userDoc = await db.collection("users").doc(userId).get();
  const planMinutes =
    PLAN_LIMITS[planInfo.plan as keyof typeof PLAN_LIMITS]?.minutesToAdd || 0;

  if (userDoc.exists) {
    const userData = userDoc.data();
    const totalMinutes = userData?.totalMinutes;

    // If no minutes recorded yet, initialize with plan minutes
    if (totalMinutes === undefined || totalMinutes === null) {
      await db.collection("users").doc(userId).update({
        totalMinutes: planMinutes,
        lastUpdated: new Date().toISOString(),
      });
      return planMinutes;
    }

    return totalMinutes;
  } else {
    // Create user record with plan minutes
    await db.collection("users").doc(userId).set({
      totalMinutes: planMinutes,
      lastUpdated: new Date().toISOString(),
    });
    return planMinutes;
  }
}

// Add minutes to user account (called when they purchase a plan)
export async function addMinutesToUser(minutesToAdd: number): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const userDoc = await db.collection("users").doc(userId).get();

  if (userDoc.exists) {
    const currentMinutes = userDoc.data()?.totalMinutes || 0;
    await db
      .collection("users")
      .doc(userId)
      .update({
        totalMinutes: currentMinutes + minutesToAdd,
        lastUpdated: new Date().toISOString(),
      });
  } else {
    // Create user profile with minutes
    await db.collection("users").doc(userId).set({
      totalMinutes: minutesToAdd,
      lastUpdated: new Date().toISOString(),
    });
  }
}

// Deduct minutes from user account (called after interview completion)
export async function deductMinutesFromUser(
  minutesToDeduct: number
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const userDoc = await db.collection("users").doc(userId).get();

  if (userDoc.exists) {
    const currentMinutes = userDoc.data()?.totalMinutes || 0;
    const newMinutes = Math.max(0, currentMinutes - minutesToDeduct);

    await db.collection("users").doc(userId).update({
      totalMinutes: newMinutes,
      lastUpdated: new Date().toISOString(),
    });
  }
}

// Check if user has enough minutes for an interview (2 minutes per question)
export async function canStartInterview(questionCount: number): Promise<{
  allowed: boolean;
  reason?: string;
  availableMinutes: number;
  requiredMinutes: number;
}> {
  const planInfo = await getUserPlanInfo();
  const availableMinutes = await getUserMinutes();
  const requiredMinutes = questionCount * 2; // 2 minutes per question

  if (!planInfo.isSubscribed) {
    return {
      allowed: false,
      reason:
        "No active subscription. Please subscribe to a plan to start interviews.",
      availableMinutes,
      requiredMinutes,
    };
  }

  if (availableMinutes < requiredMinutes) {
    return {
      allowed: false,
      reason: `You need ${requiredMinutes} minutes for this interview but only have ${availableMinutes} minutes remaining.`,
      availableMinutes,
      requiredMinutes,
    };
  }

  return {
    allowed: true,
    availableMinutes,
    requiredMinutes,
  };
}

export async function hasPlan(plan: string): Promise<boolean> {
  const { has } = await auth();
  return await has({ plan });
}

export async function canCreateInterview(): Promise<{
  allowed: boolean;
  reason?: string;
  planInfo: UserPlanInfo;
}> {
  const planInfo = await getUserPlanInfo();

  if (!planInfo.isSubscribed) {
    return {
      allowed: false,
      reason:
        "No active subscription. Please subscribe to a plan to create interviews.",
      planInfo,
    };
  }

  return {
    allowed: true,
    planInfo,
  };
}
