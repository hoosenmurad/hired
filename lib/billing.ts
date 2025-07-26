import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";

// Plan configurations
export const PLAN_CONFIGS = {
  hustle: {
    interviewsPerMonth: 5,
    jobTargetsPerMonth: 3,
    maxSessionMinutes: 15, // 15 minutes per month
    maxMonthlyCost: 5, // 50% of $10 plan cost for VAPI
  },
  prepped: {
    interviewsPerMonth: 10,
    jobTargetsPerMonth: 8,
    maxSessionMinutes: 30, // 30 minutes per month
    maxMonthlyCost: 12.5, // 50% of $25 plan cost
  },
  hired: {
    interviewsPerMonth: 20,
    jobTargetsPerMonth: 15,
    maxSessionMinutes: 100, // 100 minutes per month
    maxMonthlyCost: 25, // 50% of $50 plan cost
  },
} as const;

interface UserUsage {
  interviewsThisMonth: number;
  jobTargetsThisMonth: number;
  sessionMinutesThisMonth: number;
  monthlyCostThisMonth: number;
  lastResetDate: string;
  currentBillingPeriod: string;
}

export async function getUserPlanInfo() {
  const { userId, has } = await auth();
  if (!userId) throw new Error("User not authenticated");

  let planType: keyof typeof PLAN_CONFIGS | null = null;
  let isSubscribed = false;

  if (await has({ plan: "hired" })) {
    planType = "hired";
    isSubscribed = true;
  } else if (await has({ plan: "prepped" })) {
    planType = "prepped";
    isSubscribed = true;
  } else if (await has({ plan: "hustle" })) {
    planType = "hustle";
    isSubscribed = true;
  }

  return { isSubscribed, planType, userId };
}

export async function getCurrentUsage(userId: string): Promise<UserUsage> {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    const usageDoc = await db.collection("user_usage").doc(userId).get();

    if (!usageDoc.exists) {
      // Initialize usage for new user
      const initialUsage: UserUsage = {
        interviewsThisMonth: 0,
        jobTargetsThisMonth: 0,
        sessionMinutesThisMonth: 0,
        monthlyCostThisMonth: 0,
        lastResetDate: new Date().toISOString(),
        currentBillingPeriod: currentMonth,
      };

      await db.collection("user_usage").doc(userId).set(initialUsage);
      return initialUsage;
    }

    const usage = usageDoc.data() as UserUsage;

    // Check if we need to reset for new billing cycle
    if (usage.currentBillingPeriod !== currentMonth) {
      const resetUsage: UserUsage = {
        interviewsThisMonth: 0,
        jobTargetsThisMonth: 0,
        sessionMinutesThisMonth: 0,
        monthlyCostThisMonth: 0,
        lastResetDate: new Date().toISOString(),
        currentBillingPeriod: currentMonth,
      };

      await db.collection("user_usage").doc(userId).set(resetUsage);
      return resetUsage;
    }

    return usage;
  } catch (error) {
    console.error("Error getting usage:", error);
    throw new Error("Failed to get usage data");
  }
}

export async function checkQuotaAvailability(
  userId: string,
  type: "interview" | "jobTarget" | "sessionMinutes",
  amount: number = 1
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const { planType } = await getUserPlanInfo();

  if (!planType) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const config = PLAN_CONFIGS[planType];
  const usage = await getCurrentUsage(userId);

  let currentUsage: number;
  let limit: number;

  switch (type) {
    case "interview":
      currentUsage = usage.interviewsThisMonth;
      limit = config.interviewsPerMonth;
      break;
    case "jobTarget":
      currentUsage = usage.jobTargetsThisMonth;
      limit = config.jobTargetsPerMonth;
      break;
    case "sessionMinutes":
      currentUsage = usage.sessionMinutesThisMonth;
      limit = config.maxSessionMinutes;
      break;
    default:
      return { allowed: false, remaining: 0, limit: 0 };
  }

  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage + amount <= limit;

  return { allowed, remaining, limit };
}

export async function incrementUsage(
  userId: string,
  type: "interview" | "jobTarget" | "sessionMinutes",
  amount: number = 1
): Promise<void> {
  const usage = await getCurrentUsage(userId);
  const updateField =
    type === "interview"
      ? "interviewsThisMonth"
      : type === "jobTarget"
      ? "jobTargetsThisMonth"
      : "sessionMinutesThisMonth";

  await db
    .collection("user_usage")
    .doc(userId)
    .update({
      [updateField]: usage[updateField] + amount,
    });
}

export async function getSessionTimeoutMinutes(
  userId: string,
  questionCount: number
): Promise<number> {
  const { planType } = await getUserPlanInfo();

  if (!planType) return 0;

  // 3 minutes per question with plan-based maximum
  const calculatedTimeout = questionCount * 3;
  const planMaxMinutes = PLAN_CONFIGS[planType].maxSessionMinutes;

  const usage = await getCurrentUsage(userId);
  const remainingMinutes = planMaxMinutes - usage.sessionMinutesThisMonth;

  return Math.min(calculatedTimeout, remainingMinutes, 60); // Never exceed 60 minutes
}
