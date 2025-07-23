"use server";

import { db } from "@/firebase/admin";

export async function createJobTarget(
  params: CreateJobTargetParams
): Promise<{ success: boolean; jobTargetId?: string; error?: string }> {
  try {
    const {
      userId,
      title,
      company,
      responsibilities,
      requiredSkills,
      description,
    } = params;

    const jobTarget = {
      userId,
      title,
      company,
      responsibilities,
      requiredSkills,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const jobTargetRef = await db.collection("job_targets").add(jobTarget);

    return {
      success: true,
      jobTargetId: jobTargetRef.id,
    };
  } catch (error) {
    console.error("Error creating job target:", error);
    return {
      success: false,
      error: "Failed to create job target",
    };
  }
}

export async function updateJobTarget(
  jobTargetId: string,
  params: Partial<CreateJobTargetParams>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData = {
      ...params,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("job_targets").doc(jobTargetId).update(updateData);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating job target:", error);
    return {
      success: false,
      error: "Failed to update job target",
    };
  }
}

export async function getJobTargetsByUserId(
  userId: string
): Promise<JobTarget[]> {
  try {
    const querySnapshot = await db
      .collection("job_targets")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as JobTarget[];
  } catch (error) {
    console.error("Error getting job targets:", error);
    return [];
  }
}

export async function getJobTargetById(
  jobTargetId: string
): Promise<JobTarget | null> {
  try {
    const jobTargetDoc = await db
      .collection("job_targets")
      .doc(jobTargetId)
      .get();

    if (!jobTargetDoc.exists) return null;

    return { id: jobTargetDoc.id, ...jobTargetDoc.data() } as JobTarget;
  } catch (error) {
    console.error("Error getting job target by ID:", error);
    return null;
  }
}

export async function deleteJobTarget(
  jobTargetId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the job target belongs to the user
    const jobTarget = await getJobTargetById(jobTargetId);
    if (!jobTarget || jobTarget.userId !== userId) {
      return {
        success: false,
        error: "Job target not found or unauthorized",
      };
    }

    await db.collection("job_targets").doc(jobTargetId).delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting job target:", error);
    return {
      success: false,
      error: "Failed to delete job target",
    };
  }
}
