"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
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
import { Badge, X, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  type: z.string().min(1, { message: "This field is required." }),
  role: z.string().min(1, { message: "This field is required." }),
  level: z.string().min(1, { message: "This field is required." }),
  specialtySkills: z
    .array(z.string().min(1))
    .min(1, { message: "Please add at least one skill." }),
  amount: z.union([
    z.literal(3),
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
  ]),
});

const CreateForm = () => {
  const { user } = useUser();
  const router = useRouter();
  const [skillInput, setSkillInput] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      role: "",
      level: "",
      specialtySkills: [],
      amount: 5,
    },
  });

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.getValues("specialtySkills").includes(skill)) {
      form.setValue("specialtySkills", [
        ...form.getValues("specialtySkills"),
        skill,
      ]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    form.setValue(
      "specialtySkills",
      form.getValues("specialtySkills").filter((s) => s !== skill)
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          specialtySkills: values.specialtySkills.join(", "),
          userid: user?.id,
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      form.reset();
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020408] bg-[url('/grid.png')] flex items-center justify-center p-4">
      <div className="w-full bg-[#191b1f] text-white rounded-2xl shadow-lg p-8 space-y-8">
        <header>
          <h1 className="text-4xl font-bold">Starting Your Interview</h1>
          <p className="text-[#8e96ac] mt-2">
            Customize your mock interview to suit your needs.
          </p>
        </header>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="role">What role are you focusing on?</Label>
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
                      Which tech stack would you like to focus on?
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
                      {form.watch("specialtySkills").map((skill, i) => (
                        <Badge
                          key={i}
                          className="flex items-center gap-1 bg-[#27282f] text-white"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              />
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
              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label htmlFor="profile-picture">Profile picture</Label>
                <Label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full h-12 px-4 bg-[#27282f] border-none rounded-lg cursor-pointer hover:bg-[#3a3b43]"
                >
                  <Upload className="h-5 w-5 mr-2 text-[#8e96ac]" />
                  <span className="text-[#8e96ac]">Upload an image</span>
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
              className="w-full h-12 bg-[#cac5fe] text-black font-bold text-base rounded-lg hover:bg-[#b8b0fe] transition-colors"
            >
              Start Interview
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateForm;
