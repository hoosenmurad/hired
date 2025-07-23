interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  questionRatings: Array<{
    question: string;
    response: string;
    rating: number;
    feedback: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  specialtySkills: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  profileId?: string;
  jobTargetId?: string;
  isPersonalized?: boolean;
}

interface Profile {
  id: string;
  userId: string;
  name: string;
  summary: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  goals: string;
  createdAt: string;
  updatedAt: string;
}

interface JobTarget {
  id: string;
  userId: string;
  title: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  specialtySkills: string[];
  createdAt?: string;
  isPersonalized?: boolean;
  profileName?: string;
  jobTargetTitle?: string;
  jobTargetCompany?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  specialtySkills: string[];
  amount: number;
}

interface TechIconProps {
  specialtySkills: string[];
}

interface NewInterviewPermission {
  allowed: boolean;
  limit: number;
  used: number;
}

interface CreateProfileParams {
  userId: string;
  name: string;
  summary: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  goals: string;
}

interface CreateJobTargetParams {
  userId: string;
  title: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  description: string;
}

interface ParsedCV {
  name?: string;
  summary?: string;
  skills?: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
}

interface ParsedJobDescription {
  title?: string;
  company?: string;
  responsibilities?: string[];
  requiredSkills?: string[];
  description?: string;
}

interface InterviewSetupParams {
  profileId: string;
  jobTargetId: string;
  tone: "professional" | "casual" | "challenging";
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
}

interface ProfileFormProps {
  initialData?: Profile;
  onSubmit: (data: CreateProfileParams) => Promise<void>;
  loading?: boolean;
}

interface JobTargetFormProps {
  initialData?: JobTarget;
  onSubmit: (data: CreateJobTargetParams) => Promise<void>;
  loading?: boolean;
}
