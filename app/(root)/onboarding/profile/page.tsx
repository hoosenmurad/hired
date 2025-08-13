"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import ProfileForm from "@/components/ProfileForm";
import { createProfile } from "@/lib/actions/profile.action";

const ProfileCreationPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (data: CreateProfileParams) => {
    if (!user) {
      toast.error("You must be signed in to create a profile.");
      return;
    }

    setLoading(true);
    try {
      const result = await createProfile({
        ...data,
        userId: user.id,
      });

      if (result.success) {
        toast.success("Profile created successfully!");
        router.push("/onboarding/job-target");
      } else {
        toast.error(result.error || "Failed to create profile");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8 text-center">
          {/* Mobile-optimized progress indicator */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-200 text-dark-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                1
              </div>
              <div className="w-8 sm:w-16 h-1 bg-primary-200"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-light-600 text-light-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                2
              </div>
              <div className="w-8 sm:w-16 h-1 bg-light-600"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-light-600 text-light-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                3
              </div>
              <div className="w-8 sm:w-16 h-1 bg-light-600"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-light-600 text-light-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                4
              </div>
            </div>
          </div>

          {/* Mobile-optimized heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Welcome to HiredAI
          </h1>
          <p className="text-light-100 mt-2 text-sm sm:text-base px-4 sm:px-0">
            Let&apos;s start by creating your profile
          </p>
        </div>

        <ProfileForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default ProfileCreationPage;
