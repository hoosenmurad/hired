"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader } from "lucide-react";
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
  const [inputMode, setInputMode] = useState<"file" | "text">("file");

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
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
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
        if (textInput.trim().length < 50) {
          toast.error("Job description must be at least 50 characters long");
          setIsParsingJob(false);
          return;
        }
        formData.append("textInput", textInput);
      } else {
        toast.error("Please provide a job description");
        setIsParsingJob(false);
        return;
      }

      const response = await fetch("/api/job-target/parse-job", {
        method: "POST",
        body: formData,
      });

      // Check if response is ok first
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

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

      if (error instanceof Error) {
        if (error.message.includes("HTTP error")) {
          toast.error(
            "Server error while parsing job description. Please try again."
          );
        } else if (error.message.includes("non-JSON")) {
          toast.error("Server configuration error. Please contact support.");
        } else if (error.message.includes("JSON")) {
          toast.error("Invalid response from server. Please try again.");
        } else {
          toast.error(
            "Failed to parse job description. Please check your input and try again."
          );
        }
      } else {
        toast.error("Failed to parse job description. Please try again.");
      }
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
    console.log("Submitting form data:", data);
    console.log("Form errors:", form.formState.errors);

    try {
      await onSubmit({
        userId: "", // Will be set by the parent component
        ...data,
      });
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to submit form. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Mobile-optimized header */}
        <div className="text-center px-4 sm:px-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
            Add Job Target
          </h1>
          <p className="text-light-100 mt-2 text-sm sm:text-base">
            Upload job description, paste text, or enter manually.
          </p>
        </div>

        {/* Job Description Upload Section */}
        <div className="bg-[#191b1f] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            Import Job Description
          </h2>

          {/* Input Mode Selection - Mobile optimized */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              type="button"
              onClick={() => setInputMode("file")}
              className={`flex-1 h-12 sm:h-10 ${
                inputMode === "file"
                  ? "bg-primary-200 text-dark-100 hover:bg-primary-200/80"
                  : "bg-dark-200 text-primary-200 hover:bg-dark-200/80"
              } rounded-full font-bold px-5 cursor-pointer transition-colors`}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex-1 h-12 sm:h-10 ${
                inputMode === "text"
                  ? "bg-primary-200 text-dark-100 hover:bg-primary-200/80"
                  : "bg-dark-200 text-primary-200 hover:bg-dark-200/80"
              } rounded-full font-bold px-5 cursor-pointer transition-colors`}
            >
              Paste Text
            </Button>
          </div>

          {/* File Upload */}
          {inputMode === "file" && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary-200 bg-dark-200"
                  : "border-light-600 hover:border-primary-200 bg-dark-200/50"
              }`}
            >
              <input {...getInputProps()} />
              {isParsingJob ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-primary-200" />
                  <span className="text-white text-sm sm:text-base">
                    Parsing job description...
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-light-400" />
                  <p className="text-base sm:text-lg text-white">
                    {isDragActive
                      ? "Drop job description here"
                      : "Drag & drop job description here, or click to select"}
                  </p>
                  <p className="text-xs sm:text-sm text-light-100">
                    Supports PDF (.pdf) and text files (.txt). Maximum 10MB.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {inputMode === "text" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={6}
                  className="bg-dark-200 rounded-lg min-h-12 px-4 sm:px-5 py-3 placeholder:text-light-100 border-none text-white resize-none text-sm sm:text-base"
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs sm:text-sm">
                  <span
                    className={`${
                      textInput.length < 50
                        ? "text-destructive"
                        : "text-light-100"
                    }`}
                  >
                    {textInput.length}/50 characters minimum
                  </span>
                  {textInput.length > 0 && textInput.length < 50 && (
                    <span className="text-destructive text-xs">
                      Job description must be at least 50 characters long
                    </span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => parseJobDescription()}
                disabled={textInput.length < 50 || isParsingJob}
                className="w-full sm:w-auto bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-6 cursor-pointer h-12 disabled:bg-light-600 disabled:cursor-not-allowed"
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
        </div>

        {/* Manual Form */}
        <div className="bg-[#191b1f] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 sm:space-y-8"
            >
              {/* Basic Information */}
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Job Information
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label
                          htmlFor="title"
                          className="text-light-100 font-normal text-sm sm:text-base"
                        >
                          Job Title
                        </Label>
                        <FormControl>
                          <Input
                            id="title"
                            placeholder="e.g. Senior Software Engineer"
                            className="bg-dark-200 rounded-full h-12 sm:h-14 px-4 sm:px-5 placeholder:text-light-100 border-none text-white text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
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
                          className="text-light-100 font-normal text-sm sm:text-base"
                        >
                          Company
                        </Label>
                        <FormControl>
                          <Input
                            id="company"
                            placeholder="e.g. Tech Corp Inc."
                            className="bg-dark-200 rounded-full h-12 sm:h-14 px-4 sm:px-5 placeholder:text-light-100 border-none text-white text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-light-100 font-normal text-sm sm:text-base"
                    >
                      Job Description
                    </Label>
                    <FormControl>
                      <Textarea
                        id="description"
                        placeholder="Brief overview of the role and what the position entails..."
                        rows={4}
                        className="bg-dark-200 rounded-lg px-4 sm:px-5 py-3 placeholder:text-light-100 border-none text-white resize-none text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />

              {/* Responsibilities */}
              <FormField
                control={form.control}
                name="responsibilities"
                render={() => (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-xl sm:text-2xl font-semibold text-white">
                        Key Responsibilities
                      </h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        value={responsibilityInput}
                        onChange={(e) => setResponsibilityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddResponsibility();
                          }
                        }}
                        placeholder="Add a key responsibility"
                        className="flex-1 bg-dark-200 rounded-full h-12 sm:h-14 px-4 sm:px-5 placeholder:text-light-100 border-none text-white text-sm sm:text-base"
                      />
                      <Button
                        type="button"
                        onClick={handleAddResponsibility}
                        disabled={!responsibilityInput.trim()}
                        className="w-full sm:w-auto h-12 sm:h-14 bg-primary-200 text-dark-100 font-bold rounded-full hover:bg-primary-200/80 px-6 disabled:bg-light-600 disabled:cursor-not-allowed"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form
                        .watch("responsibilities")
                        .map((responsibility, index) => (
                          <div
                            key={index}
                            className="flex items-center px-3 py-2 rounded-full bg-dark-200 text-primary-200 border border-primary-200/20 text-sm"
                          >
                            <span className="mr-2">{responsibility}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveResponsibility(index)}
                              className="text-primary-200 hover:text-destructive-100 p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                    <FormMessage />
                  </div>
                )}
              />

              {/* Required Skills */}
              <FormField
                control={form.control}
                name="requiredSkills"
                render={() => (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-xl sm:text-2xl font-semibold text-white">
                        Required Skills
                      </h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder="Add a required skill"
                        className="flex-1 bg-dark-200 rounded-full h-12 sm:h-14 px-4 sm:px-5 placeholder:text-light-100 border-none text-white text-sm sm:text-base"
                      />
                      <Button
                        type="button"
                        onClick={handleAddSkill}
                        disabled={!skillInput.trim()}
                        className="w-full sm:w-auto h-12 sm:h-14 bg-primary-200 text-dark-100 font-bold rounded-full hover:bg-primary-200/80 px-6 disabled:bg-light-600 disabled:cursor-not-allowed"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.watch("requiredSkills").map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-2 rounded-full bg-dark-200 text-primary-200 border border-primary-200/20 text-sm"
                        >
                          <span className="mr-2">{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(index)}
                            className="text-primary-200 hover:text-destructive-100 p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </div>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full h-12 sm:h-14 font-bold px-5 cursor-pointer text-sm sm:text-base"
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
