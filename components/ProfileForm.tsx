"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
  education: z
    .array(
      z.object({
        degree: z.string().min(1, "Degree is required"),
        institution: z.string().min(1, "Institution is required"),
        year: z.string().min(1, "Year is required"),
      })
    )
    .min(1, "At least one education entry is required"),
  experience: z
    .array(
      z.object({
        title: z.string().min(1, "Job title is required"),
        company: z.string().min(1, "Company is required"),
        duration: z.string().min(1, "Duration is required"),
        description: z.string().min(1, "Description is required"),
      })
    )
    .min(1, "At least one experience entry is required"),
  goals: z.string().min(10, "Goals must be at least 10 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData?: Profile;
  onSubmit: (data: CreateProfileParams) => Promise<void>;
  loading?: boolean;
}

const ProfileForm = ({
  initialData,
  onSubmit,
  loading = false,
}: ProfileFormProps) => {
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData?.name || "",
      summary: initialData?.summary || "",
      skills: initialData?.skills || [],
      education: initialData?.education || [
        { degree: "", institution: "", year: "" },
      ],
      experience: initialData?.experience || [
        { title: "", company: "", duration: "", description: "" },
      ],
      goals: initialData?.goals || "",
    },
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control: form.control,
    name: "experience",
  });

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsParsingCV(true);
    try {
      const formData = new FormData();
      formData.append("cv", file);

      const response = await fetch("/api/profile/parse-cv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        const parsedData = result.data as ParsedCV;

        // Populate form with parsed data
        if (parsedData.name) form.setValue("name", parsedData.name);
        if (parsedData.summary) form.setValue("summary", parsedData.summary);
        if (parsedData.skills && parsedData.skills.length > 0) {
          form.setValue("skills", parsedData.skills);
        }
        if (parsedData.education && parsedData.education.length > 0) {
          form.setValue("education", parsedData.education);
        }
        if (parsedData.experience && parsedData.experience.length > 0) {
          form.setValue("experience", parsedData.experience);
        }

        toast.success(
          "CV parsed successfully! Please review and edit the extracted information."
        );
      } else {
        toast.error(result.error || "Failed to parse CV");
      }
    } catch (error) {
      console.error("Error parsing CV:", error);
      toast.error("Failed to parse CV");
    } finally {
      setIsParsingCV(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.getValues("skills").includes(skill)) {
      form.setValue("skills", [...form.getValues("skills"), skill]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    const skills = form.getValues("skills");
    form.setValue(
      "skills",
      skills.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (data: ProfileFormData) => {
    await onSubmit({
      userId: "", // Will be set by the parent component
      ...data,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Create Your Profile</h1>
        <p className="text-gray-600">
          Upload your CV for automatic parsing or fill out manually
        </p>
      </div>

      {/* CV Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Upload CV (Optional)</h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          {isParsingCV ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader className="animate-spin h-6 w-6" />
              <span>Parsing CV...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-lg">
                {isDragActive
                  ? "Drop your CV here"
                  : "Drag & drop your CV here, or click to select"}
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF and text files
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    {...field}
                  />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    placeholder="Brief overview of your professional background and expertise"
                    rows={4}
                    {...field}
                  />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="goals">Career Goals</Label>
                  <Textarea
                    id="goals"
                    placeholder="What are your career goals and aspirations?"
                    rows={3}
                    {...field}
                  />
                </div>
              )}
            />
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Skills</h2>
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
                placeholder="Type a skill and press Enter"
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                disabled={!skillInput.trim()}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch("skills").map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-800"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="ml-2 text-blue-600 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Education</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendEducation({ degree: "", institution: "", year: "" })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>

            {educationFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
              >
                <FormField
                  control={form.control}
                  name={`education.${index}.degree`}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        placeholder="e.g. Bachelor of Science"
                        {...field}
                      />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`education.${index}.institution`}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input placeholder="e.g. University of..." {...field} />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`education.${index}.year`}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input placeholder="e.g. 2020" {...field} />
                    </div>
                  )}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeEducation(index)}
                    disabled={educationFields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Work Experience</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendExperience({
                    title: "",
                    company: "",
                    duration: "",
                    description: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>

            {experienceFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`experience.${index}.title`}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Job Title</Label>
                        <Input
                          placeholder="e.g. Software Engineer"
                          {...field}
                        />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`experience.${index}.company`}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input placeholder="e.g. Tech Corp" {...field} />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`experience.${index}.duration`}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          placeholder="e.g. Jan 2020 - Dec 2022"
                          {...field}
                        />
                      </div>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`experience.${index}.description`}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe your responsibilities and achievements"
                        rows={3}
                        {...field}
                      />
                    </div>
                  )}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeExperience(index)}
                    disabled={experienceFields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Creating Profile...
              </>
            ) : (
              "Create Profile"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ProfileForm;
