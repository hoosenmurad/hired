"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import JobTargetForm from "@/components/JobTargetForm";
import { createJobTarget } from "@/lib/actions/job-target.action";

const JobTargetCreationPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (data: CreateJobTargetParams) => {
    if (!user) {
      toast.error("You must be signed in to create a job target.");
      return;
    }

    setLoading(true);
    try {
      const result = await createJobTarget({
        ...data,
        userId: user.id,
      });

      if (result.success) {
        toast.success("Job target created successfully!");
        router.push("/onboarding/setup-interview");
      } else {
        toast.error(result.error || "Failed to create job target");
      }
    } catch (error) {
      console.error("Error creating job target:", error);
      toast.error("Failed to create job target");
    } finally {
      setLoading(false);
    }
  };

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
              <div className="w-8 h-8 bg-primary-200 text-dark-100 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="w-16 h-1 bg-primary-200"></div>
              <div className="w-8 h-8 bg-light-600 text-light-100 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Add Your Job Target</h1>
          <p className="text-light-100 mt-2">
            Tell us about the role you&apos;re targeting
          </p>
        </div>

        <JobTargetForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default JobTargetCreationPage;
