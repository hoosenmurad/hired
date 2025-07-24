"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader, CheckCircle } from "lucide-react";
import { getProfileByUserId } from "@/lib/actions/profile.action";
import { getJobTargetsByUserId } from "@/lib/actions/job-target.action";

const interviewSetupSchema = z.object({
  profileId: z.string().min(1, "Please select a profile"),
  jobTargetId: z.string().min(1, "Please select a job target"),
  tone: z.enum(["professional", "casual", "challenging"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.number().min(3).max(20),
});

type InterviewSetupFormData = z.infer<typeof interviewSetupSchema>;

const InterviewSetupPage = () => {
  const [loading, setLoading] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobTargets, setJobTargets] = useState<JobTarget[]>([]);
  const router = useRouter();
  const { user } = useUser();

  const form = useForm<InterviewSetupFormData>({
    resolver: zodResolver(interviewSetupSchema),
    defaultValues: {
      profileId: "",
      jobTargetId: "",
      tone: "professional",
      difficulty: "medium",
      questionCount: 5,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        const [userProfile, userJobTargets] = await Promise.all([
          getProfileByUserId(user.id),
          getJobTargetsByUserId(user.id),
        ]);

        if (userProfile) {
          setProfiles([userProfile]);
          form.setValue("profileId", userProfile.id);
        }

        if (userJobTargets && userJobTargets.length > 0) {
          setJobTargets(userJobTargets);
          form.setValue("jobTargetId", userJobTargets[0].id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load profile and job targets");
      }
    };

    loadData();
  }, [user?.id, form]);

  const handleSubmit = async (data: InterviewSetupFormData) => {
    if (!user) {
      toast.error("You must be signed in to create an interview.");
      return;
    }

    setLoading(true);
    try {
      // Get the selected profile and job target
      const selectedProfile = profiles.find((p) => p.id === data.profileId);
      const selectedJobTarget = jobTargets.find(
        (j) => j.id === data.jobTargetId
      );

      if (!selectedProfile || !selectedJobTarget) {
        toast.error("Please select a valid profile and job target");
        return;
      }

      // Create unified payload for the main API endpoint
      const payload = {
        profileId: data.profileId,
        jobTargetId: data.jobTargetId,
        type: "personalized",
        role: `${selectedJobTarget.title} at ${selectedJobTarget.company}`,
        level: data.difficulty,
        specialtySkills: selectedJobTarget.requiredSkills.join(", "),
        amount: data.questionCount,
        tone: data.tone,
        difficulty: data.difficulty,
        userid: user.id,
      };

      // Create interview with personalized content using unified endpoint
      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create interview");

      toast.success("Interview created successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview");
    } finally {
      setLoading(false);
    }
  };

  // Remove the old generateInterviewPrompt function since it's now handled in the API
  // const generateInterviewPrompt = (
  //   profile: Profile,
  //   jobTarget: JobTarget,
  //   settings: InterviewSetupFormData
  // ) => {
  //   return `Create interview questions for a candidate with the following profile:
  //   // ... rest of the prompt
  // };

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
              <div className="w-16 h-1 bg-primary-200"></div>
              <div className="w-8 h-8 bg-primary-200 text-dark-100 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Setup Your Interview
          </h1>
          <p className="text-light-100 mt-2">
            Choose your interview parameters
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-[#191b1f] rounded-2xl shadow-lg p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Profile Selection */}
              <FormField
                control={form.control}
                name="profileId"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="profile"
                      className="text-light-100 font-normal"
                    >
                      Your Profile
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="bg-dark-200 rounded-full min-h-12 px-5 border-none text-white">
                        <SelectValue placeholder="Select your profile" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-light-600">
                        {profiles.map((profile) => (
                          <SelectItem
                            key={profile.id}
                            value={profile.id}
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-success-100" />
                              <span>{profile.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              {/* Job Target Selection */}
              <FormField
                control={form.control}
                name="jobTargetId"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="jobTarget"
                      className="text-light-100 font-normal"
                    >
                      Target Role
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="bg-dark-200 rounded-full min-h-12 px-5 border-none text-white">
                        <SelectValue placeholder="Select target role" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-light-600">
                        {jobTargets.map((jobTarget) => (
                          <SelectItem
                            key={jobTarget.id}
                            value={jobTarget.id}
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            <div>
                              <div className="font-medium">
                                {jobTarget.title}
                              </div>
                              <div className="text-sm text-light-100">
                                {jobTarget.company}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              {/* Interview Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="tone"
                        className="text-light-100 font-normal"
                      >
                        Interview Tone
                      </Label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="bg-dark-200 rounded-full min-h-12 px-5 border-none text-white">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#191b1f] text-white border-light-600">
                          <SelectItem
                            value="professional"
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            Professional
                          </SelectItem>
                          <SelectItem
                            value="casual"
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            Casual
                          </SelectItem>
                          <SelectItem
                            value="challenging"
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            Challenging
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="difficulty"
                        className="text-light-100 font-normal"
                      >
                        Difficulty Level
                      </Label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="bg-dark-200 rounded-full min-h-12 px-5 border-none text-white">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#191b1f] text-white border-light-600">
                          <SelectItem
                            value="easy"
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            Easy
                          </SelectItem>
                          <SelectItem
                            value="medium"
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            Medium
                          </SelectItem>
                          <SelectItem
                            value="hard"
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            Hard
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="questionCount"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="questionCount"
                      className="text-light-100 font-normal"
                    >
                      Number of Questions
                    </Label>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={String(field.value)}
                      defaultValue={String(field.value)}
                    >
                      <SelectTrigger className="bg-dark-200 rounded-full min-h-12 px-5 border-none text-white">
                        <SelectValue placeholder="Select number of questions" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-light-600">
                        {[3, 5, 10, 15, 20].map((num) => (
                          <SelectItem
                            key={num}
                            value={String(num)}
                            className="focus:bg-dark-200 focus:text-white"
                          >
                            {num} questions
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full min-h-12 font-bold px-5 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Creating Interview...
                  </>
                ) : (
                  "Create Personalized Interview"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetupPage;
