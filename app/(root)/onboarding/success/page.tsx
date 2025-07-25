"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, Loader } from "lucide-react";

const OnboardingSuccess = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Small delay to show the success message, then redirect
      const timer = setTimeout(() => {
        router.push("/onboarding/setup-interview");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-success-100 text-dark-100 rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="w-16 h-1 bg-success-100"></div>
              <div className="w-8 h-8 bg-success-100 text-dark-100 rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="w-16 h-1 bg-success-100"></div>
              <div className="w-8 h-8 bg-success-100 text-dark-100 rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="w-16 h-1 bg-primary-200"></div>
              <div className="w-8 h-8 bg-primary-200 text-dark-100 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-[#191b1f] rounded-2xl shadow-lg p-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-success-100/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success-100" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Payment Successful!
            </h1>

            <p className="text-light-100 mb-8 leading-relaxed">
              Congratulations! Your plan has been activated and interview
              minutes have been added to your account. You&apos;re now ready to
              start your first AI-powered mock interview.
            </p>

            <div className="flex items-center justify-center gap-2 text-light-100">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Redirecting to interview setup...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccess;
