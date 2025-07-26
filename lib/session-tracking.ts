// Session tracking and progress analysis system
import { db } from "@/firebase/admin";

interface SessionData {
  id: string;
  totalScore: number;
  categoryScores?: Array<{
    name: string;
    score: number;
  }>;
  createdAt: string;
}

interface SessionComparison {
  previousScore: number;
  improvement: string;
  consistencyNote: string;
}

interface ProgressTrend {
  direction: "improving" | "declining" | "consistent";
  rate: number; // points per session
  confidence: "high" | "medium" | "low";
}

interface UserProgress {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  recentTrend: ProgressTrend;
  categoryTrends: Record<string, ProgressTrend>;
  recommendations: string[];
}

export async function getSessionComparison(
  userId: string,
  currentScore: number
): Promise<SessionComparison | null> {
  try {
    // Get user's previous feedback sessions (last 5)
    const previousFeedback = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    if (previousFeedback.empty) {
      return null; // First session
    }

    const sessions: SessionData[] = previousFeedback.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SessionData[];

    const previousScore = sessions[0]?.totalScore;
    if (!previousScore) return null;

    const scoreDiff = currentScore - previousScore;
    const percentChange = (scoreDiff / previousScore) * 100;

    // Generate improvement message
    let improvement: string;
    if (Math.abs(scoreDiff) < 2) {
      improvement = "Consistent performance - maintaining your level";
    } else if (scoreDiff > 0) {
      improvement = `Improved by ${scoreDiff.toFixed(
        1
      )} points (${percentChange.toFixed(1)}% better)`;
    } else {
      improvement = `Decreased by ${Math.abs(scoreDiff).toFixed(
        1
      )} points (${Math.abs(percentChange).toFixed(1)}% lower)`;
    }

    // Analyze consistency across sessions
    const recentScores = sessions
      .slice(0, 3)
      .map((s) => s.totalScore)
      .filter(Boolean);
    const consistency = calculateConsistency(recentScores);

    let consistencyNote: string;
    if (consistency > 0.9) {
      consistencyNote = "Very consistent performance across sessions";
    } else if (consistency > 0.8) {
      consistencyNote = "Generally consistent with minor variations";
    } else if (consistency > 0.7) {
      consistencyNote = "Moderate consistency - some score variation";
    } else {
      consistencyNote = "Variable performance - focus on consistency";
    }

    return {
      previousScore,
      improvement,
      consistencyNote,
    };
  } catch (error) {
    console.error("Error getting session comparison:", error);
    return null;
  }
}

export async function getUserProgress(
  userId: string
): Promise<UserProgress | null> {
  try {
    const allFeedback = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .orderBy("createdAt", "asc")
      .get();

    if (allFeedback.empty) return null;

    const sessions: SessionData[] = allFeedback.docs.map((doc) =>
      doc.data()
    ) as SessionData[];
    const scores = sessions.map((s) => s.totalScore).filter(Boolean);

    if (scores.length < 2) return null;

    const totalSessions = scores.length;
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);

    // Calculate overall trend
    const recentTrend = calculateTrend(scores);

    // Calculate category trends
    const categoryTrends: Record<string, ProgressTrend> = {};
    const categories = [
      "Communication Skills",
      "Technical Knowledge",
      "Problem Solving",
      "Cultural Fit",
      "Confidence and Clarity",
    ];

    for (const category of categories) {
      const categoryScores = sessions
        .map((s) => s.categoryScores?.find((c) => c.name === category)?.score)
        .filter(Boolean) as number[];

      if (categoryScores.length >= 2) {
        categoryTrends[category] = calculateTrend(categoryScores);
      }
    }

    // Generate recommendations
    const recommendations = generateProgressRecommendations(
      recentTrend,
      categoryTrends,
      averageScore
    );

    return {
      totalSessions,
      averageScore,
      bestScore,
      recentTrend,
      categoryTrends,
      recommendations,
    };
  } catch (error) {
    console.error("Error getting user progress:", error);
    return null;
  }
}

function calculateConsistency(scores: number[]): number {
  if (scores.length < 2) return 1;

  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
    scores.length;
  const standardDeviation = Math.sqrt(variance);

  // Normalize consistency (lower std dev = higher consistency)
  // Assume max reasonable std dev is 20 points
  return Math.max(0, 1 - standardDeviation / 20);
}

function calculateTrend(scores: number[]): ProgressTrend {
  if (scores.length < 2) {
    return { direction: "consistent", rate: 0, confidence: "low" };
  }

  // Simple linear regression to find trend
  const n = scores.length;
  const xSum = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
  const ySum = scores.reduce((sum, score) => sum + score, 0);
  const xySum = scores.reduce((sum, score, index) => sum + score * index, 0);
  const xSquaredSum = scores.reduce(
    (sum, value, index) => sum + index * index,
    0
  );

  const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);

  // Calculate confidence based on R-squared
  const meanY = ySum / n;
  const ssTotal = scores.reduce(
    (sum, score) => sum + Math.pow(score - meanY, 2),
    0
  );
  const ssResidual = scores.reduce((sum, score, index) => {
    const predicted = meanY + slope * (index - (n - 1) / 2);
    return sum + Math.pow(score - predicted, 2);
  }, 0);

  const rSquared = 1 - ssResidual / ssTotal;

  let confidence: "high" | "medium" | "low";
  if (rSquared > 0.7) confidence = "high";
  else if (rSquared > 0.4) confidence = "medium";
  else confidence = "low";

  let direction: "improving" | "declining" | "consistent";
  if (Math.abs(slope) < 0.5) direction = "consistent";
  else if (slope > 0) direction = "improving";
  else direction = "declining";

  return {
    direction,
    rate: Math.abs(slope),
    confidence,
  };
}

function generateProgressRecommendations(
  overallTrend: ProgressTrend,
  categoryTrends: Record<string, ProgressTrend>,
  averageScore: number
): string[] {
  const recommendations: string[] = [];

  // Overall performance recommendations
  if (
    overallTrend.direction === "improving" &&
    overallTrend.confidence === "high"
  ) {
    recommendations.push(
      "🎉 You're showing strong, consistent improvement! Keep up the current practice routine."
    );
  } else if (overallTrend.direction === "declining") {
    recommendations.push(
      "📈 Focus on returning to fundamentals and consistent practice to reverse the recent trend."
    );
  } else if (overallTrend.direction === "consistent" && averageScore > 75) {
    recommendations.push(
      "🎯 Your performance is stable. Challenge yourself with more advanced scenarios."
    );
  } else if (overallTrend.direction === "consistent" && averageScore < 65) {
    recommendations.push(
      "💪 Focus on building stronger foundations in your weakest areas."
    );
  }

  // Category-specific recommendations
  const decliningCategories = Object.entries(categoryTrends)
    .filter(([, trend]) => trend.direction === "declining")
    .map(([category]) => category);

  const improvingCategories = Object.entries(categoryTrends)
    .filter(
      ([, trend]) =>
        trend.direction === "improving" && trend.confidence === "high"
    )
    .map(([category]) => category);

  if (decliningCategories.length > 0) {
    recommendations.push(
      `🔍 Pay special attention to: ${decliningCategories.join(", ")}`
    );
  }

  if (improvingCategories.length > 0) {
    recommendations.push(
      `✅ Great progress in: ${improvingCategories.join(", ")}`
    );
  }

  // Session frequency recommendations
  if (overallTrend.confidence === "low") {
    recommendations.push(
      "📅 Consider practicing more regularly for more reliable progress tracking."
    );
  }

  return recommendations;
}

export async function updateSessionHistory(
  userId: string,
  currentFeedback: { id: string; totalScore: number }
): Promise<void> {
  try {
    // Get session comparison data
    const sessionComparison = await getSessionComparison(
      userId,
      currentFeedback.totalScore
    );

    if (sessionComparison) {
      // Update the current feedback with session comparison
      await db.collection("feedback").doc(currentFeedback.id).update({
        sessionComparison,
      });
    }

    // Update user's progress summary (could be stored separately for quick access)
    const progress = await getUserProgress(userId);
    if (progress) {
      await db
        .collection("user_progress")
        .doc(userId)
        .set(
          {
            ...progress,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
    }
  } catch (error) {
    console.error("Error updating session history:", error);
  }
}

export default {
  getSessionComparison,
  getUserProgress,
  updateSessionHistory,
};
