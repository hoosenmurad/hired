"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { auth } from "@/firebase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge, X } from "lucide-react";

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
  const user = auth.currentUser;
  const router = useRouter();
  const [skillInput, setSkillInput] = useState("");

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
          userid: user?.uid,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Type</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="input">
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Frontend Engineer"
                  {...field}
                  className="input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Level</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="input">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry-Level</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior-Level</SelectItem>
                    <SelectItem value="staff">Staff / Principal</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialtySkills"
          render={() => (
            <FormItem>
              <FormLabel>Specialty Skills</FormLabel>
              <FormControl>
                <div className="space-y-2">
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
                      className="input"
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
                    {form.watch("specialtySkills").map((skill, i) => (
                      <Badge key={i} className="flex items-center gap-1">
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Questions</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={String(field.value)}
                  defaultValue={String(field.value)}
                >
                  <SelectTrigger className="input">
                    <SelectValue placeholder="Select number" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 10, 15, 20].map((opt) => (
                      <SelectItem key={opt} value={String(opt)}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full cursor-pointer">
          Generate Questions
        </Button>
      </form>
    </Form>
  );
};

export default CreateForm;
