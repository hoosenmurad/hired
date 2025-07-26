// Profile completion validation
export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

interface ProfileData {
  name?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
}

export function validateProfileCompletion(
  profile: ProfileData
): ProfileCompletionStatus {
  const requiredFields = [
    { key: "name", label: "Full Name" },
    { key: "summary", label: "Professional Summary" },
    {
      key: "skills",
      label: "Skills (at least 3)",
      validator: (val: string[]) => val && val.length >= 3,
    },
    {
      key: "experience",
      label: "Work Experience (at least 1)",
      validator: (val: ProfileData["experience"]) => val && val.length >= 1,
    },
  ];

  const missingFields: string[] = [];
  let completedFields = 0;

  for (const field of requiredFields) {
    const value = profile?.[field.key as keyof ProfileData];

    if (field.validator) {
      if (!field.validator(value as never)) {
        missingFields.push(field.label);
      } else {
        completedFields++;
      }
    } else {
      if (!value || (typeof value === "string" && value.trim().length === 0)) {
        missingFields.push(field.label);
      } else {
        completedFields++;
      }
    }
  }

  const completionPercentage = Math.round(
    (completedFields / requiredFields.length) * 100
  );
  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    missingFields,
    completionPercentage,
  };
}

export function getProfileCompletionMessage(
  status: ProfileCompletionStatus
): string {
  if (status.isComplete) {
    return "Profile is complete and ready for personalized interviews!";
  }

  const missing = status.missingFields.join(", ");
  return `Complete your profile to unlock personalized interviews. Missing: ${missing}`;
}
