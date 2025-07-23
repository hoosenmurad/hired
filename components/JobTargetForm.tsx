"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader, Link as LinkIcon } from "lucide-react";
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Add Job Target</h1>
          <p className="text-light-100 mt-2">
            Upload job description, paste text, or enter manually
          </p>
        </div>

        {/* Job Description Upload Section */}
        <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Import Job Description (Optional)
          </h2>

          {/* Input Mode Selection */}
          <div className="flex space-x-4">
            <Button
              type="button"
              onClick={() => setInputMode("file")}
              className={
                inputMode === "file"
                  ? "bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10"
                  : "bg-dark-200 text-primary-200 hover:bg-dark-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10"
              }
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button
              type="button"
              onClick={() => setInputMode("text")}
              className={
                inputMode === "text"
                  ? "bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10"
                  : "bg-dark-200 text-primary-200 hover:bg-dark-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10"
              }
            >
              Paste Text
            </Button>
            <Button
              type="button"
              onClick={() => setInputMode("url")}
              className={
                inputMode === "url"
                  ? "bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10"
                  : "bg-dark-200 text-primary-200 hover:bg-dark-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10"
              }
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              From URL
            </Button>
          </div>

          {/* File Upload */}
          {inputMode === "file" && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary-200 bg-dark-200"
                  : "border-light-600 hover:border-primary-200 bg-dark-200/50"
              }`}
            >
              <input {...getInputProps()} />
              {isParsingJob ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="animate-spin h-6 w-6 text-primary-200" />
                  <span className="text-white">Parsing job description...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-light-400" />
                  <p className="text-lg text-white">
                    {isDragActive
                      ? "Drop job description here"
                      : "Drag & drop job description here, or click to select"}
                  </p>
                  <p className="text-sm text-light-100">
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
                className="bg-dark-200 rounded-lg min-h-12 px-5 placeholder:text-light-100 border-none text-white resize-none"
              />
              <Button
                type="button"
                onClick={() => parseJobDescription()}
                disabled={!textInput.trim() || isParsingJob}
                className="bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10 disabled:bg-light-600"
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
                className="bg-dark-200 rounded-full min-h-12 px-5 placeholder:text-light-100 border-none text-white"
              />
              <Button
                type="button"
                onClick={() => parseJobDescription()}
                disabled={!urlInput.trim() || isParsingJob}
                className="bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-5 cursor-pointer min-h-10 disabled:bg-light-600"
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
        <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">
                  Job Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label
                          htmlFor="title"
                          className="text-light-100 font-normal"
                        >
                          Job Title
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g. Senior Software Engineer"
                          className="bg-dark-200 rounded-full min-h-12 px-5 placeholder:text-light-100 border-none text-white"
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
                        <Label
                          htmlFor="company"
                          className="text-light-100 font-normal"
                        >
                          Company
                        </Label>
                        <Input
                          id="company"
                          placeholder="e.g. Tech Corp Inc."
                          className="bg-dark-200 rounded-full min-h-12 px-5 placeholder:text-light-100 border-none text-white"
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
                      <Label
                        htmlFor="description"
                        className="text-light-100 font-normal"
                      >
                        Job Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Brief overview of the role and what the company does"
                        rows={4}
                        className="bg-dark-200 rounded-lg min-h-12 px-5 placeholder:text-light-100 border-none text-white resize-none"
                        {...field}
                      />
                    </div>
                  )}
                />
              </div>

              {/* Responsibilities */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">
                  Key Responsibilities
                </h2>
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
                    className="bg-dark-200 rounded-full min-h-12 px-5 placeholder:text-light-100 border-none text-white"
                  />
                  <Button
                    type="button"
                    onClick={handleAddResponsibility}
                    disabled={!responsibilityInput.trim()}
                    className="bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-5 cursor-pointer min-h-12"
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {form
                    .watch("responsibilities")
                    .map((responsibility, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-dark-200/50 border border-light-600/20"
                      >
                        <span className="text-white">{responsibility}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsibility(index)}
                          className="text-primary-200 hover:text-destructive-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">
                  Required Skills
                </h2>
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
                    className="bg-dark-200 rounded-full min-h-12 px-5 placeholder:text-light-100 border-none text-white"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!skillInput.trim()}
                    className="bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-5 cursor-pointer min-h-12"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch("requiredSkills").map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-1 rounded-full bg-dark-200 text-primary-200 border border-primary-200/20"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="ml-2 text-primary-200 hover:text-destructive-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full min-h-12 font-bold px-5 cursor-pointer"
                disabled={loading}
              >
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
      </div>
    </div>
  );
};

export default JobTargetForm;
