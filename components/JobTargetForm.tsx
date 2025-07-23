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
import {
  Upload,
  X,
  Loader,
  Plus,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

const jobTargetSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  responsibilities: z
    .array(z.string().min(1))
    .min(1, "At least one responsibility is required"),
  requiredSkills: z
    .array(z.string().min(1))
    .min(1, "At least one required skill is needed"),
});

type JobTargetFormData = z.infer<typeof jobTargetSchema>;

interface JobTargetFormProps {
  initialData?: JobTarget;
  onSubmit: (data: CreateJobTargetParams) => Promise<void>;
  loading?: boolean;
}

const JobTargetForm = ({
  initialData,
  onSubmit,
  loading = false,
}: JobTargetFormProps) => {
  const [isParsingJob, setIsParsingJob] = useState(false);
  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "text" | "url">("file");

  const form = useForm<JobTargetFormData>({
    resolver: zodResolver(jobTargetSchema),
    defaultValues: {
      title: initialData?.title || "",
      company: initialData?.company || "",
      description: initialData?.description || "",
      responsibilities: initialData?.responsibilities || [],
      requiredSkills: initialData?.requiredSkills || [],
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    await parseJobDescription(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const parseJobDescription = async (file?: File) => {
    setIsParsingJob(true);
    try {
      const formData = new FormData();

      if (file) {
        formData.append("jobDescription", file);
      } else if (inputMode === "text" && textInput.trim()) {
        formData.append("textInput", textInput);
      } else if (inputMode === "url" && urlInput.trim()) {
        formData.append("urlInput", urlInput);
      } else {
        toast.error("Please provide a job description");
        return;
      }

      const response = await fetch("/api/job-target/parse-job", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        const parsedData = result.data as ParsedJobDescription;

        // Populate form with parsed data
        if (parsedData.title) form.setValue("title", parsedData.title);
        if (parsedData.company) form.setValue("company", parsedData.company);
        if (parsedData.description)
          form.setValue("description", parsedData.description);
        if (
          parsedData.responsibilities &&
          parsedData.responsibilities.length > 0
        ) {
          form.setValue("responsibilities", parsedData.responsibilities);
        }
        if (parsedData.requiredSkills && parsedData.requiredSkills.length > 0) {
          form.setValue("requiredSkills", parsedData.requiredSkills);
        }

        toast.success(
          "Job description parsed successfully! Please review and edit the extracted information."
        );
      } else {
        toast.error(result.error || "Failed to parse job description");
      }
    } catch (error) {
      console.error("Error parsing job description:", error);
      toast.error("Failed to parse job description");
    } finally {
      setIsParsingJob(false);
    }
  };

  const handleAddResponsibility = () => {
    const responsibility = responsibilityInput.trim();
    if (
      responsibility &&
      !form.getValues("responsibilities").includes(responsibility)
    ) {
      form.setValue("responsibilities", [
        ...form.getValues("responsibilities"),
        responsibility,
      ]);
      setResponsibilityInput("");
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    const responsibilities = form.getValues("responsibilities");
    form.setValue(
      "responsibilities",
      responsibilities.filter((_, i) => i !== index)
    );
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.getValues("requiredSkills").includes(skill)) {
      form.setValue("requiredSkills", [
        ...form.getValues("requiredSkills"),
        skill,
      ]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    const skills = form.getValues("requiredSkills");
    form.setValue(
      "requiredSkills",
      skills.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (data: JobTargetFormData) => {
    await onSubmit({
      userId: "", // Will be set by the parent component
      ...data,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Add Job Target</h1>
        <p className="text-gray-600">
          Upload job description, paste text, or enter manually
        </p>
      </div>

      {/* Job Description Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          Import Job Description (Optional)
        </h2>

        {/* Input Mode Selection */}
        <div className="flex space-x-4">
          <Button
            type="button"
            variant={inputMode === "file" ? "default" : "outline"}
            onClick={() => setInputMode("file")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
          <Button
            type="button"
            variant={inputMode === "text" ? "default" : "outline"}
            onClick={() => setInputMode("text")}
          >
            Paste Text
          </Button>
          <Button
            type="button"
            variant={inputMode === "url" ? "default" : "outline"}
            onClick={() => setInputMode("url")}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            From URL
          </Button>
        </div>

        {/* File Upload */}
        {inputMode === "file" && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            {isParsingJob ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="animate-spin h-6 w-6" />
                <span>Parsing job description...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-lg">
                  {isDragActive
                    ? "Drop job description here"
                    : "Drag & drop job description here, or click to select"}
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF and text files
                </p>
              </div>
            )}
          </div>
        )}

        {/* Text Input */}
        {inputMode === "text" && (
          <div className="space-y-4">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
            />
            <Button
              type="button"
              onClick={() => parseJobDescription()}
              disabled={!textInput.trim() || isParsingJob}
            >
              {isParsingJob ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Parsing...
                </>
              ) : (
                "Parse Job Description"
              )}
            </Button>
          </div>
        )}

        {/* URL Input */}
        {inputMode === "url" && (
          <div className="space-y-4">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter job posting URL..."
            />
            <Button
              type="button"
              onClick={() => parseJobDescription()}
              disabled={!urlInput.trim() || isParsingJob}
            >
              {isParsingJob ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Parsing...
                </>
              ) : (
                "Parse from URL"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Manual Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Job Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Senior Software Engineer"
                      {...field}
                    />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="e.g. Tech Corp Inc."
                      {...field}
                    />
                  </div>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief overview of the role and what the company does"
                    rows={4}
                    {...field}
                  />
                </div>
              )}
            />
          </div>

          {/* Responsibilities */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Key Responsibilities</h2>
            <div className="flex gap-2">
              <Input
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddResponsibility();
                  }
                }}
                placeholder="Type a responsibility and press Enter"
              />
              <Button
                type="button"
                onClick={handleAddResponsibility}
                disabled={!responsibilityInput.trim()}
              >
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {form.watch("responsibilities").map((responsibility, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-100"
                >
                  <span>{responsibility}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResponsibility(index)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Required Skills</h2>
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
                placeholder="Type a required skill and press Enter"
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
              {form.watch("requiredSkills").map((skill, index) => (
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Creating Job Target...
              </>
            ) : (
              "Create Job Target"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default JobTargetForm;
