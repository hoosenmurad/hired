// Data security and privacy controls
import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";

interface FeedbackData {
  totalScore?: number;
  createdAt?: string;
  categoryScores?: Array<{
    name: string;
    score: number;
  }>;
  userId?: string;
}

interface QueryFilter {
  field: string;
  operator: FirebaseFirestore.WhereFilterOp;
  value: unknown;
}

// Prevent cross-user data access
export async function ensureUserOwnership(
  collectionName: string,
  documentId: string,
  requiredUserId?: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { allowed: false, error: "User not authenticated" };
    }

    const targetUserId = requiredUserId || userId;
    const docRef = db.collection(collectionName).doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { allowed: false, error: "Document not found" };
    }

    const data = doc.data();
    if (data?.userId !== targetUserId && data?.author !== targetUserId) {
      return {
        allowed: false,
        error: "Access denied: document belongs to another user",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking user ownership:", error);
    return { allowed: false, error: "Security check failed" };
  }
}

// Progress data cleanup (keep only last 50 sessions per user)
export async function cleanupUserProgress(userId: string): Promise<void> {
  try {
    const feedbackQuery = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (feedbackQuery.size > 50) {
      const docsToDelete = feedbackQuery.docs.slice(50);
      const batch = db.batch();

      for (const doc of docsToDelete) {
        batch.delete(doc.ref);
      }

      await batch.commit();
      console.log(
        `Cleaned up ${docsToDelete.length} old feedback records for user ${userId}`
      );
    }
  } catch (error) {
    console.error("Error cleaning up user progress:", error);
  }
}

// Session data cleanup (remove sessions older than 30 days)
export async function cleanupSessionData(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionsQuery = await db
      .collection("vapi_sessions")
      .where("startTime", "<", thirtyDaysAgo)
      .get();

    if (!sessionsQuery.empty) {
      const batch = db.batch();

      for (const doc of sessionsQuery.docs) {
        batch.delete(doc.ref);
      }

      await batch.commit();
      console.log(`Cleaned up ${sessionsQuery.size} old session records`);
    }
  } catch (error) {
    console.error("Error cleaning up session data:", error);
  }
}

// Corrupted data detection and handling
export async function validateAndFixCorruptedProgress(userId: string): Promise<{
  fixed: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  let fixed = false;

  try {
    // Check for feedback with invalid scores
    const feedbackQuery = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();

    for (const doc of feedbackQuery.docs) {
      const data = doc.data() as FeedbackData;
      let needsUpdate = false;
      const updates: Partial<FeedbackData> = {};

      // Fix invalid total scores
      if (!data.totalScore || data.totalScore < 0 || data.totalScore > 100) {
        issues.push(`Invalid total score: ${data.totalScore}`);
        updates.totalScore = Math.max(0, Math.min(100, data.totalScore || 0));
        needsUpdate = true;
      }

      // Fix missing creation dates
      if (!data.createdAt) {
        issues.push("Missing creation date");
        updates.createdAt = new Date().toISOString();
        needsUpdate = true;
      }

      // Fix invalid category scores
      if (data.categoryScores && Array.isArray(data.categoryScores)) {
        const fixedCategories = data.categoryScores.map((cat) => {
          if (!cat.score || cat.score < 0 || cat.score > 100) {
            issues.push(`Invalid category score: ${cat.name} - ${cat.score}`);
            return {
              ...cat,
              score: Math.max(0, Math.min(100, cat.score || 0)),
            };
          }
          return cat;
        });
        updates.categoryScores = fixedCategories;
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(doc.ref, updates);
        fixed = true;
      }
    }

    if (fixed) {
      await batch.commit();
    }

    return { fixed, issues };
  } catch (error) {
    console.error("Error validating progress data:", error);
    return { fixed: false, issues: ["Failed to validate progress data"] };
  }
}

// Secure user data query helper
export async function secureUserQuery(
  collectionName: string,
  additionalFilters?: QueryFilter[]
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  let query = db.collection(collectionName).where("userId", "==", userId);

  if (additionalFilters) {
    for (const filter of additionalFilters) {
      query = query.where(filter.field, filter.operator, filter.value);
    }
  }

  return query;
}

const dataSecurityUtils = {
  ensureUserOwnership,
  cleanupUserProgress,
  cleanupSessionData,
  validateAndFixCorruptedProgress,
  secureUserQuery,
};

export default dataSecurityUtils;
