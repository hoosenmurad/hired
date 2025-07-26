// Enhanced scoring system with accuracy improvements and realistic benchmarks
import { z } from "zod";

// Enhanced feedback schema with confidence and evidence
export const enhancedFeedbackSchema = z.object({
  // Overall assessment
  totalScore: z.number().min(0).max(100),
  overallPercentile: z.string(),
  reliabilityScore: z.enum(["High", "Medium", "Low"]),

  // Category scores with evidence and confidence
  categoryScores: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      percentile: z.string(),
      confidence: z.enum(["High", "Medium", "Low"]),
      evidence: z.array(z.string()),
      comment: z.string(),
      benchmarkComparison: z.string(),
      improvementTips: z.array(z.string()),
    })
  ),

  // Detailed question analysis
  questionRatings: z.array(
    z.object({
      question: z.string(),
      response: z.string(),
      rating: z.number().min(0).max(100),
      feedback: z.string(),
      evidence: z.array(z.string()),
      category: z.string(),
      confidence: z.enum(["High", "Medium", "Low"]),
    })
  ),

  // Enhanced overall assessment
  strengths: z.array(
    z.object({
      area: z.string(),
      description: z.string(),
      evidence: z.array(z.string()),
    })
  ),

  areasForImprovement: z.array(
    z.object({
      area: z.string(),
      description: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      actionableSteps: z.array(z.string()),
    })
  ),

  // Realistic assessment
  finalAssessment: z.string(),
  limitations: z.array(z.string()),
  nextSteps: z.array(z.string()),

  // Tracking data
  sessionComparison: z
    .object({
      previousScore: z.number().optional(),
      improvement: z.string().optional(),
      consistencyNote: z.string().optional(),
    })
    .optional()
    .nullable(),
});

// Scoring benchmarks by role level
export const SCORING_BENCHMARKS = {
  junior: {
    excellent: { min: 85, description: "Exceptional for entry-level" },
    good: { min: 70, description: "Strong junior candidate" },
    adequate: { min: 55, description: "Meets basic requirements" },
    concerning: { min: 40, description: "Needs significant development" },
    poor: { min: 0, description: "Not ready for role" },
  },
  mid: {
    excellent: { min: 88, description: "Top-tier mid-level performance" },
    good: { min: 75, description: "Solid mid-level candidate" },
    adequate: { min: 62, description: "Acceptable with some gaps" },
    concerning: { min: 45, description: "Below expectations" },
    poor: { min: 0, description: "Significant deficiencies" },
  },
  senior: {
    excellent: { min: 90, description: "Exceptional senior-level expertise" },
    good: { min: 80, description: "Strong senior candidate" },
    adequate: { min: 68, description: "Meets senior requirements" },
    concerning: { min: 50, description: "Questions about seniority" },
    poor: { min: 0, description: "Not at senior level" },
  },
} as const;

// Category-specific scoring rubrics
export const CATEGORY_RUBRICS = {
  "Communication Skills": {
    "90-100":
      "Articulate, well-structured responses with clear examples. Excellent listening and follow-up questions.",
    "80-89":
      "Clear communication with good structure. Mostly complete responses with relevant details.",
    "70-79":
      "Generally clear but some unclear explanations. Adequate structure and detail.",
    "60-69":
      "Sometimes unclear or disorganized. Missing key details or structure.",
    "50-59": "Frequently unclear or rambling responses. Poor organization.",
    "Below 50": "Very difficult to follow. Incomplete or confusing responses.",
  },
  "Technical Knowledge": {
    "90-100":
      "Deep understanding with specific examples. Explains complex concepts clearly. Shows current best practices.",
    "80-89":
      "Solid technical foundation with good examples. Minor gaps in advanced topics.",
    "70-79":
      "Adequate knowledge with some examples. Some confusion on intermediate topics.",
    "60-69":
      "Basic understanding but significant gaps. Limited examples or outdated knowledge.",
    "50-59": "Fundamental gaps in core concepts. Unclear explanations.",
    "Below 50": "Major misunderstandings. Cannot explain basic concepts.",
  },
  "Problem Solving": {
    "90-100":
      "Systematic approach with multiple solutions. Considers trade-offs and edge cases.",
    "80-89":
      "Logical approach with reasonable solutions. Shows good analytical thinking.",
    "70-79":
      "Basic problem-solving approach. Solutions are workable but may miss considerations.",
    "60-69":
      "Inconsistent approach. Solutions may have issues or be incomplete.",
    "50-59":
      "Poor problem-solving methodology. Solutions are unclear or incorrect.",
    "Below 50": "Cannot structure problem-solving approach effectively.",
  },
  "Cultural Fit": {
    "90-100":
      "Excellent alignment with professional values. Shows collaboration and growth mindset.",
    "80-89":
      "Good professional presence. Shows teamwork and learning orientation.",
    "70-79": "Adequate professional behavior. Some alignment with team values.",
    "60-69":
      "Mixed signals about cultural alignment. Some concerning responses.",
    "50-59": "Poor cultural alignment indicators. Conflicting values.",
    "Below 50": "Significant cultural misalignment.",
  },
  "Confidence and Clarity": {
    "90-100": "Confident, decisive responses. Clear thinking under pressure.",
    "80-89":
      "Generally confident with clear responses. Minor hesitation on complex topics.",
    "70-79": "Adequate confidence. Some uncertainty but recovers well.",
    "60-69": "Inconsistent confidence. Some unclear or hesitant responses.",
    "50-59": "Low confidence affecting response quality. Frequent uncertainty.",
    "Below 50":
      "Very uncertain responses. Lack of confidence impacts communication.",
  },
} as const;

// Helper functions for scoring accuracy
export function getPercentileForScore(
  score: number,
  category: string,
  level: string = "mid"
): string {
  const benchmarks =
    SCORING_BENCHMARKS[level as keyof typeof SCORING_BENCHMARKS];

  if (score >= benchmarks.excellent.min) return "Top 10% of candidates";
  if (score >= benchmarks.good.min) return "Top 25% of candidates";
  if (score >= benchmarks.adequate.min) return "Average performance";
  if (score >= benchmarks.concerning.min) return "Below average";
  return "Bottom 25% of candidates";
}

export function getConfidenceLevel(
  responseLength: number,
  specificityScore: number,
  questionCount: number
): "High" | "Medium" | "Low" {
  if (questionCount >= 4 && responseLength > 50 && specificityScore > 70)
    return "High";
  if (questionCount >= 2 && responseLength > 20 && specificityScore > 50)
    return "Medium";
  return "Low";
}

export function generateEvidence(response: string, category: string): string[] {
  const evidence: string[] = [];

  // Basic evidence generation (this would be enhanced with more sophisticated analysis)
  if (category === "Technical Knowledge") {
    if (response.includes("example") || response.includes("project")) {
      evidence.push("✅ Provided concrete examples");
    }
    if (response.length > 100) {
      evidence.push("✅ Gave detailed explanations");
    }
    if (response.includes("best practice") || response.includes("pattern")) {
      evidence.push("✅ Mentioned best practices");
    }
    if (response.includes("but") || response.includes("however")) {
      evidence.push("✅ Showed nuanced thinking");
    }
  }

  if (category === "Communication Skills") {
    if (
      response.includes("first") ||
      response.includes("then") ||
      response.includes("finally")
    ) {
      evidence.push("✅ Used clear structure");
    }
    if (response.split(" ").length > 30) {
      evidence.push("✅ Provided comprehensive response");
    }
  }

  return evidence;
}

export function getBenchmarkComparison(
  score: number,
  category: string
): string {
  const rubric = CATEGORY_RUBRICS[category as keyof typeof CATEGORY_RUBRICS];

  if (score >= 90) return rubric["90-100"];
  if (score >= 80) return rubric["80-89"];
  if (score >= 70) return rubric["70-79"];
  if (score >= 60) return rubric["60-69"];
  if (score >= 50) return rubric["50-59"];
  return rubric["Below 50"];
}

export function generateImprovementTips(
  score: number,
  category: string
): string[] {
  const tips: string[] = [];

  if (category === "Communication Skills" && score < 80) {
    tips.push("Structure responses with clear beginning, middle, and end");
    tips.push("Use specific examples to illustrate points");
    tips.push("Practice explaining complex concepts simply");
  }

  if (category === "Technical Knowledge" && score < 80) {
    tips.push("Prepare specific project examples for each technology");
    tips.push("Study current best practices and industry trends");
    tips.push(
      "Practice explaining technical concepts to non-technical audiences"
    );
  }

  if (category === "Problem Solving" && score < 80) {
    tips.push(
      "Use a structured approach: understand, analyze, solve, validate"
    );
    tips.push("Think out loud to show your problem-solving process");
    tips.push("Consider multiple solutions and trade-offs");
  }

  return tips;
}

export function getSystemLimitations(): string[] {
  return [
    "Assessment based on communication only, not hands-on technical skills",
    "Cannot verify accuracy of technical claims made by candidate",
    "Cultural fit assessment is highly subjective and context-dependent",
    "Scores may vary based on question difficulty and interview context",
    "No comparison to actual job performance data",
    "Limited ability to assess soft skills like teamwork and leadership",
  ];
}

interface CategoryScore {
  name: string;
  score: number;
}

export function generateNextSteps(
  categoryScores: CategoryScore[],
  overallScore: number
): string[] {
  const steps: string[] = [];

  // Find lowest scoring category
  const lowestCategory = categoryScores.reduce((min, current) =>
    current.score < min.score ? current : min
  );

  steps.push(
    `Focus improvement efforts on ${lowestCategory.name} (scored ${lowestCategory.score})`
  );

  if (overallScore < 70) {
    steps.push("Practice basic interview communication and preparation");
    steps.push("Research common interview questions for your target role");
  } else if (overallScore < 85) {
    steps.push("Refine responses with more specific examples and details");
    steps.push("Practice advanced technical discussions");
  } else {
    steps.push("Focus on consistency and handling unexpected questions");
    steps.push("Practice leadership and strategic thinking questions");
  }

  steps.push("Schedule regular practice sessions to track improvement");

  return steps;
}

export default enhancedFeedbackSchema;
