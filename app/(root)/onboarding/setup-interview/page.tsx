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
  const [dataLoading, setDataLoading] = useState(true);
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
      } finally {
        setDataLoading(false);
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

      // Generate dynamic prompt based on profile + job target + settings
      const dynamicPrompt = generateInterviewPrompt(
        selectedProfile,
        selectedJobTarget,
        data
      );

      // Create interview with personalized content
      const response = await fetch("/api/vapi/generate-personalized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: data.profileId,
          jobTargetId: data.jobTargetId,
          tone: data.tone,
          difficulty: data.difficulty,
          amount: data.questionCount,
          userid: user.id,
          dynamicPrompt,
        }),
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

  const generateInterviewPrompt = (
    profile: Profile,
    jobTarget: JobTarget,
    settings: InterviewSetupFormData
  ) => {
    return `Create interview questions for a candidate with the following profile:

CANDIDATE PROFILE:
- Name: ${profile.name}
- Summary: ${profile.summary}
- Key Skills: ${profile.skills.join(", ")}
- Goals: ${profile.goals}
- Experience: ${profile.experience
      .map((exp) => `${exp.title} at ${exp.company}`)
      .join(", ")}

TARGET ROLE:
- Position: ${jobTarget.title} at ${jobTarget.company}
- Required Skills: ${jobTarget.requiredSkills.join(", ")}
- Key Responsibilities: ${jobTarget.responsibilities.join(", ")}
- Job Description: ${jobTarget.description}

INTERVIEW SETTINGS:
- Tone: ${settings.tone}
- Difficulty: ${settings.difficulty}
- Question Count: ${settings.questionCount}

Please create personalized questions that:
1. Assess the candidate's fit for this specific role
2. Test relevant skills from both their background and job requirements
3. Match the specified tone and difficulty level
4. Include behavioral questions related to their experience
5. Include technical questions relevant to the role requirements`;
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
          <p>Loading your profile and job targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="w-16 h-1 bg-green-600"></div>
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="w-16 h-1 bg-blue-600"></div>
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Setup Your Interview
          </h1>
          <p className="text-gray-600 mt-2">Choose your interview parameters</p>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
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
                    <Label htmlFor="profile">Your Profile</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
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
                    <Label htmlFor="jobTarget">Target Role</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target role" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTargets.map((jobTarget) => (
                          <SelectItem key={jobTarget.id} value={jobTarget.id}>
                            <div>
                              <div className="font-medium">
                                {jobTarget.title}
                              </div>
                              <div className="text-sm text-gray-500">
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
                      <Label htmlFor="tone">Interview Tone</Label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">
                            Professional
                          </SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="challenging">
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
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
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
                    <Label htmlFor="questionCount">Number of Questions</Label>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={String(field.value)}
                      defaultValue={String(field.value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of questions" />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 15, 20].map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num} questions
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
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
