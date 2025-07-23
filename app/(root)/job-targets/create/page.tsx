"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import JobTargetForm from "@/components/JobTargetForm";
import { createJobTarget } from "@/lib/actions/job-target.action";

const CreateJobTargetPage = () => {
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
        router.push("/job-targets");
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
        <div className="mb-8 text-center"></div>

        <JobTargetForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default CreateJobTargetPage;
