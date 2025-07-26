"use server";

import { db } from "@/firebase/admin";

export interface InterviewStats {
  totalInterviews: number;
  totalMinutes: number;
  averageDuration: number;
  completionRate: number;
  thisMonthInterviews: number;
  thisMonthMinutes: number;
}

export async function getInterviewStats(
  userId: string
): Promise<InterviewStats> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get all completed interviews
    const interviewsQuery = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .where("status", "==", "completed")
      .get();

    const interviews = interviewsQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      actualDurationMinutes?: number;
      completedAt?: string;
      status?: string;
      userId?: string;
    }>;

    // Calculate stats
    const totalInterviews = interviews.length;
    const completedWithDuration = interviews.filter(
      (i) => (i.actualDurationMinutes || 0) > 0
    );
    const totalMinutes = completedWithDuration.reduce(
      (sum, i) => sum + (i.actualDurationMinutes || 0),
      0
    );
    const averageDuration =
      completedWithDuration.length > 0
        ? Math.round(totalMinutes / completedWithDuration.length)
        : 0;

    // This month stats
    const thisMonthInterviews = interviews.filter(
      (i) => i.completedAt && i.completedAt.startsWith(currentMonth)
    );
    const thisMonthMinutes = thisMonthInterviews.reduce(
      (sum, i) => sum + (i.actualDurationMinutes || 0),
      0
    );

    // All interviews (including incomplete)
    const allInterviewsQuery = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .get();

    const completionRate =
      allInterviewsQuery.size > 0
        ? Math.round((totalInterviews / allInterviewsQuery.size) * 100)
        : 0;

    return {
      totalInterviews,
      totalMinutes,
      averageDuration,
      completionRate,
      thisMonthInterviews: thisMonthInterviews.length,
      thisMonthMinutes,
    };
  } catch (error) {
    console.error("Error getting interview stats:", error);
    return {
      totalInterviews: 0,
      totalMinutes: 0,
      averageDuration: 0,
      completionRate: 0,
      thisMonthInterviews: 0,
      thisMonthMinutes: 0,
    };
  }
}
