import { auth } from "@clerk/nextjs/server";

// Plan configurations matching the Clerk billing setup
export const PLAN_LIMITS = {
  hustle: {
    interviews: 5,
    interviewTime: 30, // minutes
  },
  prepped: {
    interviews: 10,
    interviewTime: 60, // minutes
  },
  hired: {
    interviews: 20,
    interviewTime: 100, // minutes
  },
};

export interface UserPlanInfo {
  plan: string | null;
  interviewLimit: number;
  interviewTimeLimit: number;
  isSubscribed: boolean;
}

export async function getUserPlanInfo(): Promise<UserPlanInfo> {
  const { has } = await auth();

  // Check plans in order of priority
  if (await has({ plan: "hired" })) {
    return {
      plan: "hired",
      interviewLimit: PLAN_LIMITS.hired.interviews,
      interviewTimeLimit: PLAN_LIMITS.hired.interviewTime,
      isSubscribed: true,
    };
  } else if (await has({ plan: "prepped" })) {
    return {
      plan: "prepped",
      interviewLimit: PLAN_LIMITS.prepped.interviews,
      interviewTimeLimit: PLAN_LIMITS.prepped.interviewTime,
      isSubscribed: true,
    };
  } else if (await has({ plan: "hustle" })) {
    return {
      plan: "hustle",
      interviewLimit: PLAN_LIMITS.hustle.interviews,
      interviewTimeLimit: PLAN_LIMITS.hustle.interviewTime,
      isSubscribed: true,
    };
  }

  // No subscription
  return {
    plan: null,
    interviewLimit: 0,
    interviewTimeLimit: 0,
    isSubscribed: false,
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
