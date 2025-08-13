"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Loader, X, Sparkles, Upload } from "lucide-react";
import { getProfileByUserId } from "@/lib/actions/profile.action";
import { getJobTargetsByUserId } from "@/lib/actions/job-target.action";

const formSchema = z
  .object({
    profileId: z.string().optional(),
    jobTargetId: z.string().optional(),
    type: z.string().min(1, { message: "This field is required." }),
    role: z.string().optional(),
    level: z.string().optional(),
    specialtySkills: z.array(z.string().min(1)).optional(),
    amount: z.union([
      z.literal(3),
      z.literal(5),
      z.literal(10),
      z.literal(15),
      z.literal(20),
    ]),
    tone: z
      .enum(["professional", "casual", "challenging"])
      .default("professional"),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  })
  .refine(
    (data) => {
      // If personalization is enabled, validation passes
      if (data.profileId && data.jobTargetId) {
        return true;
      }

      // If personalization is not enabled, require manual entry fields
      return (
        data.role &&
        data.level &&
        data.specialtySkills &&
        data.specialtySkills.length > 0
      );
    },
    {
      message:
        "When not using personalization, role, experience level, and skills are required",
      path: ["role"],
    }
  );

const InterviewSetupPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobTargetIdFromUrl = searchParams.get("jobTargetId");

  const [skillInput, setSkillInput] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [usePersonalization, setUsePersonalization] = useState(true); // Default to true for onboarding
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobTargets, setJobTargets] = useState<JobTarget[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileId: "",
      jobTargetId: "",
      type: "mixed",
      role: "",
      level: "",
      specialtySkills: [],
      amount: 5,
      tone: "professional",
      difficulty: "medium",
    },
  });

  // Load user's profiles and job targets
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const [userProfile, userJobTargets] = await Promise.all([
          getProfileByUserId(user.id),
          getJobTargetsByUserId(user.id),
        ]);

        if (userProfile) {
          setProfiles([userProfile]);
          form.setValue("profileId", userProfile.id);
        }

        if (userJobTargets) {
          setJobTargets(userJobTargets);

          // If jobTargetId is provided in URL, pre-select it
          if (jobTargetIdFromUrl) {
            const targetExists = userJobTargets.find(
              (jt) => jt.id === jobTargetIdFromUrl
            );
            if (targetExists) {
              form.setValue("jobTargetId", jobTargetIdFromUrl);
            }
          } else if (userJobTargets.length > 0) {
            // Default to first job target if no URL parameter
            form.setValue("jobTargetId", userJobTargets[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadUserData();
    }
  }, [user?.id, jobTargetIdFromUrl, form]);

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    const currentSkills = form.getValues("specialtySkills") || [];
    if (skill && !currentSkills.includes(skill)) {
      form.setValue("specialtySkills", [...currentSkills, skill]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const currentSkills = form.getValues("specialtySkills") || [];
    form.setValue(
      "specialtySkills",
      currentSkills.filter((s) => s !== skill)
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast.error("You must be signed in to create an interview.");
      router.push("/sign-in");
      return;
    }
    setLoading(true);
    try {
      interface PayloadType {
        userid: string;
        type: string;
        role?: string;
        level?: string;
        specialtySkills?: string;
        amount: number;
        tone: string;
        difficulty: string;
        profileId?: string;
        jobTargetId?: string;
      }

      const payload: PayloadType = {
        type: values.type,
        amount: values.amount,
        tone: values.tone,
        difficulty: values.difficulty,
        userid: user.id,
        specialtySkills: "",
      };

      if (usePersonalization && values.profileId && values.jobTargetId) {
        // For personalized interviews, include profile and job target IDs
        payload.profileId = values.profileId;
        payload.jobTargetId = values.jobTargetId;

        // Get the selected job target for role information
        const selectedJobTarget = jobTargets.find(
          (jt) => jt.id === values.jobTargetId
        );
        if (selectedJobTarget) {
          payload.role = `${selectedJobTarget.title} at ${selectedJobTarget.company}`;
          payload.specialtySkills = selectedJobTarget.requiredSkills.join(", ");
        }

        // Use difficulty as level for personalized interviews
        payload.level = values.difficulty;
      } else {
        // For standard interviews, use the form values
        payload.role = values.role || "";
        payload.level = values.level || "";
        payload.specialtySkills = values.specialtySkills
          ? values.specialtySkills.join(", ")
          : "";
      }

      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Submission failed");

      form.reset();
      toast.success("Interview created successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create interview");
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
          <h1 className="text-3xl font-bold text-white">
            Create Your First Interview
          </h1>
          <p className="text-light-100 mt-2">
            Customize your mock interview to match your goals
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-[#191b1f] rounded-2xl shadow-lg p-8 space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personalization Section */}
              <div className="bg-[#27282f] rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary-200" />
                  <h3 className="text-lg font-semibold text-white">
                    Personalize Your Interview (Recommended)
                  </h3>
                </div>
                <p className="text-light-100 text-sm">
                  Use your profile and job targets for questions tailored to
                  your experience and goals.
                </p>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="use-personalization"
                      checked={usePersonalization}
                      onChange={(e) => setUsePersonalization(e.target.checked)}
                      className="sr-only"
                    />
                    <label
                      htmlFor="use-personalization"
                      className={`flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer transition-all ${
                        usePersonalization
                          ? "bg-primary-200 border-primary-200"
                          : "bg-transparent border-light-600 hover:border-light-400"
                      }`}
                    >
                      {usePersonalization && (
                        <svg
                          className="w-3 h-3 text-dark-100"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </label>
                  </div>
                  <Label
                    htmlFor="use-personalization"
                    className="text-white cursor-pointer"
                  >
                    Use personalized interview questions
                  </Label>
                </div>

                {/* Profile and Job Target Selection - shown when personalization is enabled */}
                {usePersonalization && (
                  <div className="space-y-4 mt-4 p-4 bg-dark-200/30 rounded-lg border border-light-600/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Profile Selection */}
                      <FormField
                        control={form.control}
                        name="profileId"
                        render={({ field }) => (
                          <div className="space-y-2">
                            <Label
                              htmlFor="profile-select"
                              className="text-light-100"
                            >
                              Select Profile
                            </Label>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <SelectTrigger
                                id="profile-select"
                                className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white"
                              >
                                <SelectValue placeholder="Choose a profile" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#191b1f] text-white border-light-600">
                                {profiles.map((profile) => (
                                  <SelectItem
                                    key={profile.id}
                                    value={profile.id}
                                    className="focus:bg-dark-200 focus:text-white"
                                  >
                                    {profile.name}
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
                              htmlFor="job-target-select"
                              className="text-light-100"
                            >
                              Select Job Target
                            </Label>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <SelectTrigger
                                id="job-target-select"
                                className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white"
                              >
                                <SelectValue placeholder="Choose a job target" />
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
                    </div>

                    {profiles.length === 0 && jobTargets.length === 0 && (
                      <p className="text-light-100 text-sm text-center py-4">
                        No profiles or job targets found. Please create them
                        first in your dashboard.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Interview Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="interview-type" className="text-light-100">
                      What type of interview would you like to practice?
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        id="interview-type"
                        className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-light-600">
                        <SelectItem
                          value="technical"
                          className="focus:bg-dark-200 focus:text-white"
                        >
                          Technical
                        </SelectItem>
                        <SelectItem
                          value="behavioral"
                          className="focus:bg-dark-200 focus:text-white"
                        >
                          Behavioral
                        </SelectItem>
                        <SelectItem
                          value="mixed"
                          className="focus:bg-dark-200 focus:text-white"
                        >
                          Mixed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              {/* Show these fields only when personalization is NOT enabled */}
              {!usePersonalization && (
                <div className="space-y-6">
                  {/* Role */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-light-100">
                          What role are you focusing on?
                        </Label>
                        <Input
                          id="role"
                          placeholder="e.g. Frontend Engineer, Analyst, Product Manager"
                          {...field}
                          className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white placeholder:text-light-400"
                        />
                      </div>
                    )}
                  />

                  {/* Experience Level */}
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="level" className="text-light-100">
                          Experience Level
                        </Label>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            id="level"
                            className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white"
                          >
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#191b1f] text-white border-light-600">
                            <SelectItem
                              value="entry"
                              className="focus:bg-dark-200 focus:text-white"
                            >
                              Entry-Level
                            </SelectItem>
                            <SelectItem
                              value="mid"
                              className="focus:bg-dark-200 focus:text-white"
                            >
                              Mid-Level
                            </SelectItem>
                            <SelectItem
                              value="senior"
                              className="focus:bg-dark-200 focus:text-white"
                            >
                              Senior-Level
                            </SelectItem>
                            <SelectItem
                              value="staff"
                              className="focus:bg-dark-200 focus:text-white"
                            >
                              Staff / Principal
                            </SelectItem>
                            <SelectItem
                              value="manager"
                              className="focus:bg-dark-200 focus:text-white"
                            >
                              Manager
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />

                  {/* Specialty Skills */}
                  <FormField
                    control={form.control}
                    name="specialtySkills"
                    render={() => (
                      <div className="space-y-2">
                        <Label htmlFor="tech-stack" className="text-light-100">
                          What role related skills or experience do you have?
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                            placeholder="Type skill and press Enter"
                            className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white placeholder:text-light-400"
                          />
                          <Button
                            type="button"
                            onClick={handleAddSkill}
                            disabled={!skillInput.trim()}
                            className="h-12 bg-primary-200 text-dark-100 font-bold rounded-full hover:bg-primary-200/80"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(form.watch("specialtySkills") || []).map(
                            (skill, i) => (
                              <div
                                key={i}
                                className="flex items-center px-3 py-1 rounded-full bg-dark-200/50 text-white"
                              >
                                <span>{skill}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="ml-2 text-primary-200 hover:text-red-400"
                                  aria-label={`Remove ${skill}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Show personalization summary when enabled */}
              {usePersonalization &&
                profiles.length > 0 &&
                jobTargets.length > 0 && (
                  <div className="bg-dark-200/30 rounded-lg p-4 space-y-3 border border-light-600/10">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-primary-200" />
                      <h4 className="font-semibold text-white">
                        Interview Settings
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-light-400">Role:</span>
                        <span className="text-white ml-2">
                          {jobTargets.find(
                            (jt) => jt.id === form.watch("jobTargetId")
                          )?.title || "Not selected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-light-400">Company:</span>
                        <span className="text-white ml-2">
                          {jobTargets.find(
                            (jt) => jt.id === form.watch("jobTargetId")
                          )?.company || "Not selected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-light-400">Your Profile:</span>
                        <span className="text-white ml-2">
                          {profiles.find(
                            (p) => p.id === form.watch("profileId")
                          )?.name || "Not selected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-light-400">
                          Experience Level:
                        </span>
                        <span className="text-white ml-2">
                          {form.watch("difficulty") === "easy"
                            ? "Entry-Level"
                            : form.watch("difficulty") === "medium"
                            ? "Mid-Level"
                            : "Senior-Level"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-primary-200">
                      ✨ Review your settings
                    </p>
                  </div>
                )}

              {/* Interview Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Number of Questions */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-light-100">
                        How many questions? (2 mins each)
                      </Label>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={String(field.value)}
                        defaultValue={String(field.value)}
                      >
                        <SelectTrigger
                          id="duration"
                          className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white"
                        >
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#191b1f] text-white border-light-600">
                          {[3, 5, 10, 15, 20].map((opt) => (
                            <SelectItem
                              key={opt}
                              value={String(opt)}
                              className="focus:bg-dark-200 focus:text-white"
                            >
                              {opt} questions
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />

                {/* Tone */}
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="tone" className="text-light-100">
                        Interview Tone
                      </Label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger
                          id="tone"
                          className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white"
                        >
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
              </div>

              {/* Difficulty */}
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-light-100">
                      Interview Difficulty
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        id="difficulty"
                        className="bg-dark-200 border-none rounded-full min-h-12 px-5 text-white"
                      >
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

              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label htmlFor="profile-picture" className="text-light-100">
                  Profile picture
                </Label>
                <Label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full h-12 px-4 bg-dark-200 border-none rounded-full cursor-pointer hover:bg-dark-200/80"
                >
                  <Upload className="h-5 w-5 mr-2 text-light-400" />
                  <span className="text-light-400">
                    Upload an image (optional)
                  </span>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfilePic(e.target.files[0]);
                    }
                  }}
                />
                {profilePic && (
                  <div className="text-xs text-light-400 mt-1">
                    {profilePic.name}
                  </div>
                )}
              </div>

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
