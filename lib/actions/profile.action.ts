"use server";

import { db } from "@/firebase/admin";

export async function createProfile(
  params: CreateProfileParams
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  try {
    const { userId, name, summary, skills, education, experience, goals } =
      params;

    // Check if user already has a profile
    const existingProfile = await db
      .collection("profiles")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!existingProfile.empty) {
      return {
        success: false,
        error: "User already has a profile. Use update instead.",
      };
    }

    const profile = {
      userId,
      name,
      summary,
      skills,
      education,
      experience,
      goals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const profileRef = await db.collection("profiles").add(profile);

    return {
      success: true,
      profileId: profileRef.id,
    };
  } catch (error) {
    console.error("Error creating profile:", error);
    return {
      success: false,
      error: "Failed to create profile",
    };
  }
}

export async function updateProfile(
  profileId: string,
  params: Partial<CreateProfileParams>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData = {
      ...params,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("profiles").doc(profileId).update(updateData);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  try {
    const querySnapshot = await db
      .collection("profiles")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const profileDoc = querySnapshot.docs[0];
    return { id: profileDoc.id, ...profileDoc.data() } as Profile;
  } catch (error) {
    console.error("Error getting profile:", error);
    return null;
  }
}

export async function getProfileById(
  profileId: string
): Promise<Profile | null> {
  try {
    const profileDoc = await db.collection("profiles").doc(profileId).get();

    if (!profileDoc.exists) return null;

    return { id: profileDoc.id, ...profileDoc.data() } as Profile;
  } catch (error) {
    console.error("Error getting profile by ID:", error);
    return null;
  }
}

export async function deleteProfile(
  profileId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the profile belongs to the user
    const profile = await getProfileById(profileId);
    if (!profile || profile.userId !== userId) {
      return {
        success: false,
        error: "Profile not found or unauthorized",
      };
    }

    await db.collection("profiles").doc(profileId).delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting profile:", error);
    return {
      success: false,
      error: "Failed to delete profile",
    };
  }
}
