"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, Loader, User, Briefcase, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getProfileByUserId } from "@/lib/actions/profile.action";
import { getJobTargetsByUserId } from "@/lib/actions/job-target.action";
import Link from "next/link";

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

const CreateForm = () => {
  const { user } = useUser();
  const router = useRouter();
  const [skillInput, setSkillInput] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [usePersonalization, setUsePersonalization] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobTargets, setJobTargets] = useState<JobTarget[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileId: "",
      jobTargetId: "",
      type: "",
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

      setDataLoading(true);
      try {
        const [userProfile, userJobTargets] = await Promise.all([
          getProfileByUserId(user.id),
          getJobTargetsByUserId(user.id),
        ]);

        if (userProfile) {
          setProfiles([userProfile]);
        }

        if (userJobTargets) {
          setJobTargets(userJobTargets);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans">
      <div className="w-full bg-[#191b1f] text-white rounded-2xl shadow-lg p-8 space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-center">
            Interview Generator
          </h1>
          <p className="text-[#8e96ac] mt-2 text-center">
            Customize your mock interview to suit your needs.
          </p>
        </header>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personalization Section */}
            <div className="bg-[#27282f] rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary-200" />
                <h3 className="text-lg font-semibold">
                  Personalize Your Interview (Recommended)
                </h3>
              </div>
              <p className="text-[#8e96ac] text-sm">
                Use your profile and job targets for AI-generated questions
                tailored to your experience and goals.
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
                        ? "bg-[#cac5fe] border-[#cac5fe]"
                        : "bg-transparent border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {usePersonalization && (
                      <svg
                        className="w-3 h-3 text-black"
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

              {usePersonalization && (
                <div className="space-y-4 mt-4">
                  {dataLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="animate-spin h-5 w-5 text-primary-200" />
                      <span className="ml-2 text-[#8e96ac]">
                        Loading your data...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Profile Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Select Your Profile</span>
                          </Label>
                          {profiles.length === 0 && (
                            <Link href="/onboarding/profile">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                Create Profile
                              </Button>
                            </Link>
                          )}
                        </div>
                        {profiles.length > 0 ? (
                          <FormField
                            control={form.control}
                            name="profileId"
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="bg-[#191b1f] border-gray-600">
                                  <SelectValue placeholder="Choose your profile" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#191b1f] text-white border-gray-700">
                                  {profiles.map((profile) => (
                                    <SelectItem
                                      key={profile.id}
                                      value={profile.id}
                                      className="focus:bg-[#27282f] focus:text-white"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4" />
                                        <span>{profile.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        ) : (
                          <p className="text-[#8e96ac] text-sm">
                            No profile found. Create one to enable personalized
                            interviews.
                          </p>
                        )}
                      </div>

                      {/* Job Target Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center space-x-2">
                            <Briefcase className="h-4 w-4" />
                            <span>Select Job Target</span>
                          </Label>
                          {jobTargets.length === 0 && (
                            <Link href="/job-targets/create">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                Create Job Target
                              </Button>
                            </Link>
                          )}
                        </div>
                        {jobTargets.length > 0 ? (
                          <FormField
                            control={form.control}
                            name="jobTargetId"
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="bg-[#191b1f] border-gray-600">
                                  <SelectValue placeholder="Choose target role" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#191b1f] text-white border-gray-700">
                                  {jobTargets.map((jobTarget) => (
                                    <SelectItem
                                      key={jobTarget.id}
                                      value={jobTarget.id}
                                      className="focus:bg-[#27282f] focus:text-white"
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {jobTarget.title}
                                        </div>
                                        <div className="text-xs text-[#8e96ac]">
                                          {jobTarget.company}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        ) : (
                          <p className="text-[#8e96ac] text-sm">
                            No job targets found. Create one to enable
                            personalized interviews.
                          </p>
                        )}
                      </div>

                      {profiles.length > 0 && jobTargets.length > 0 && (
                        <div className="bg-[#191b1f] rounded-lg p-3 mt-4">
                          <p className="text-sm text-primary-200">
                            ✨ Your interview will be personalized based on your
                            profile and target role!
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Interview Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="interview-type">
                      What type of interview would you like to practice?
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        id="interview-type"
                        className="w-full bg-[#27282f] border-none rounded-lg h-12 px-4"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-gray-700">
                        <SelectItem
                          value="technical"
                          className="focus:bg-[#27282f] focus:text-white"
                        >
                          Technical
                        </SelectItem>
                        <SelectItem
                          value="behavioral"
                          className="focus:bg-[#27282f] focus:text-white"
                        >
                          Behavioral
                        </SelectItem>
                        <SelectItem
                          value="mixed"
                          className="focus:bg-[#27282f] focus:text-white"
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
                <>
                  {/* Role */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="role">
                          What role are you focusing on?
                        </Label>
                        <Input
                          id="role"
                          placeholder="e.g. Frontend Engineer, Analyst, Product Manager"
                          {...field}
                          className="w-full bg-[#27282f] border-none rounded-lg h-12 px-4 text-[#8e96ac]"
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
                        <Label htmlFor="level">Experience Level</Label>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            id="level"
                            className="w-full bg-[#27282f] border-none rounded-lg h-12 px-4"
                          >
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#191b1f] text-white border-gray-700">
                            <SelectItem
                              value="entry"
                              className="focus:bg-[#27282f] focus:text-white"
                            >
                              Entry-Level
                            </SelectItem>
                            <SelectItem
                              value="mid"
                              className="focus:bg-[#27282f] focus:text-white"
                            >
                              Mid-Level
                            </SelectItem>
                            <SelectItem
                              value="senior"
                              className="focus:bg-[#27282f] focus:text-white"
                            >
                              Senior-Level
                            </SelectItem>
                            <SelectItem
                              value="staff"
                              className="focus:bg-[#27282f] focus:text-white"
                            >
                              Staff / Principal
                            </SelectItem>
                            <SelectItem
                              value="manager"
                              className="focus:bg-[#27282f] focus:text-white"
                            >
                              Manager
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                  {/* Specialty Skills (Tech Stack) */}
                  <FormField
                    control={form.control}
                    name="specialtySkills"
                    render={() => (
                      <div className="space-y-2">
                        <Label htmlFor="tech-stack">
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
                            className="w-full bg-[#27282f] border-none rounded-lg h-12 px-4 text-[#8e96ac]"
                          />
                          <Button
                            type="button"
                            onClick={handleAddSkill}
                            disabled={!skillInput.trim()}
                            className="h-12 bg-[#cac5fe] text-black font-bold text-base rounded-lg hover:bg-[#b8b0fe] transition-colors"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(form.watch("specialtySkills") || []).map(
                            (skill, i) => (
                              <div
                                key={i}
                                className="flex items-center px-3 py-1 rounded-lg bg-[#27282f] text-white"
                              >
                                <span>{skill}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="ml-2 text-[#cac5fe] hover:text-red-400"
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
                </>
              )}

              {/* Always show these interview configuration fields */}

              {/* Show personalization summary when enabled */}
              {usePersonalization &&
                profiles.length > 0 &&
                jobTargets.length > 0 && (
                  <div className="bg-[#27282f] rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-primary-200" />
                      <h4 className="font-semibold text-white">
                        Personalized Interview Settings
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[#8e96ac]">Role:</span>
                        <span className="text-white ml-2">
                          {jobTargets.find(
                            (jt) => jt.id === form.watch("jobTargetId")
                          )?.title || "Not selected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8e96ac]">Company:</span>
                        <span className="text-white ml-2">
                          {jobTargets.find(
                            (jt) => jt.id === form.watch("jobTargetId")
                          )?.company || "Not selected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8e96ac]">Your Profile:</span>
                        <span className="text-white ml-2">
                          {profiles.find(
                            (p) => p.id === form.watch("profileId")
                          )?.name || "Not selected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8e96ac]">
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
                      ✨ Questions will be tailored to your background and
                      target role
                    </p>
                  </div>
                )}

              {/* Number of Questions (Duration) */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      How many questions would you like?
                    </Label>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={String(field.value)}
                      defaultValue={String(field.value)}
                    >
                      <SelectTrigger
                        id="duration"
                        className="w-full bg-[#27282f] border-none rounded-lg h-12 px-4"
                      >
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-gray-700">
                        {[3, 5, 10, 15, 20].map((opt) => (
                          <SelectItem
                            key={opt}
                            value={String(opt)}
                            className="focus:bg-[#27282f] focus:text-white"
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
                    <Label htmlFor="tone">Interview Tone</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        id="tone"
                        className="w-full bg-[#27282f] border-none rounded-lg h-12 px-4"
                      >
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-gray-700">
                        <SelectItem
                          value="professional"
                          className="focus:bg-[#27282f] focus:text-white"
                        >
                          Professional
                        </SelectItem>
                        <SelectItem
                          value="casual"
                          className="focus:bg-[#27282f] focus:text-white"
                        >
                          Casual
                        </SelectItem>
                        <SelectItem
                          value="challenging"
                          className="focus:bg-[#27282f] focus:text-white"
                        >
                          Challenging
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {/* Difficulty */}
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Interview Difficulty</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        id="difficulty"
                        className="w-full bg-[#27282f] border-none rounded-lg h-12 px-4"
                      >
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191b1f] text-white border-gray-700">
                        <SelectItem
                          value="easy"
                          className="focus:bg-[#27282f] focus:text-white"
                        >
                          Easy
                        </SelectItem>
                        <SelectItem
                          value="medium"
                          className="focus:bg-[#27282f] focus:text-white"
                        >
                          Medium
                        </SelectItem>
                        <SelectItem
                          value="hard"
                          className="focus:bg-[#27282f] focus:text-white"
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
                <Label htmlFor="profile-picture">Profile picture</Label>
                <Label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full h-12 px-4 bg-[#27282f] border-none rounded-lg cursor-pointer hover:bg-[#3a3b43]"
                >
                  <Upload className="h-5 w-5 mr-2 text-[#8e96ac]" />
                  <span className="text-[#8e96ac]">
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
                  <div className="text-xs text-[#8e96ac] mt-1">
                    {profilePic.name}
                  </div>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#cac5fe] text-black font-bold text-base rounded-lg hover:bg-[#b8b0fe] transition-colors flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Creating...
                </>
              ) : (
                "Create Interview"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateForm;
