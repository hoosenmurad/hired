"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/firebase/admin";

// Get current user from Clerk and Firestore
export async function getCurrentUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Get user info from Firestore using Clerk user ID
  const userRecord = await db.collection("users").doc(clerkUser.id).get();
  if (!userRecord.exists) {
    // Optionally, create a Firestore profile here if it doesn't exist
    // await db.collection("users").doc(clerkUser.id).set({
    //   name: clerkUser.firstName,
    //   email: clerkUser.emailAddresses[0]?.emailAddress,
    // });
    return {
      id: clerkUser.id,
      name: clerkUser.firstName,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      // Add other Clerk fields as needed
    } as User;
  }

  return {
    ...userRecord.data(),
    id: userRecord.id,
  } as User;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const { userId } = await auth();
  return !!userId;
}
