// Token-optimized prompt management with context limits

// Token limits for different models (approximate)
export const TOKEN_LIMITS = {
  "gemini-2.0-flash": {
    input: 1000000,
    output: 8192,
    safe_input: 950000, // Leave buffer for system prompts
  },
  "gemini-2.5-flash": {
    input: 2000000,
    output: 8192,
    safe_input: 1900000,
  },
  "gpt-4": {
    input: 128000,
    output: 4096,
    safe_input: 120000,
  },
} as const;

// Character to token ratio estimates (conservative)
const CHAR_TO_TOKEN_RATIO = 4;

// Types for better type safety
interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface ProfileData {
  name: string;
  summary?: string;
  skills?: string[];
  experience?: ExperienceEntry[];
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

interface JobTargetData {
  title: string;
  company: string;
  description?: string;
  responsibilities?: string[];
  requiredSkills?: string[];
}

// Context limit utilities
export function truncateText(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHAR_TO_TOKEN_RATIO;
  if (text.length <= maxChars) return text;

  return text.substring(0, maxChars) + "...(truncated)";
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHAR_TO_TOKEN_RATIO);
}

// Optimized prompt templates
export const PROMPTS = {
  // 1. Interview Question Generation (Token optimized)
  INTERVIEW_PERSONALIZED: (data: {
    profile: ProfileData;
    jobTarget: JobTargetData;
    type: string;
    level: string;
    tone: string;
    difficulty: string;
    amount: number;
    specialtySkills?: string;
  }) => {
    // Limit profile experience to most recent 3 entries
    const recentExperience = data.profile.experience?.slice(0, 3) || [];

    // Truncate long descriptions
    const truncatedExperience = recentExperience.map(
      (exp: ExperienceEntry) => ({
        ...exp,
        description: truncateText(exp.description || "", 50),
      })
    );

    // Limit skills to top 10
    const topSkills = data.profile.skills?.slice(0, 10) || [];
    const topRequiredSkills = data.jobTarget.requiredSkills?.slice(0, 10) || [];

    return `Generate ${data.amount} interview questions for:

CANDIDATE: ${data.profile.name}
ROLE: ${data.jobTarget.title} at ${data.jobTarget.company}

BACKGROUND:
• Skills: ${topSkills.join(", ")}
• Experience: ${truncatedExperience
      .map((exp) => `${exp.title} at ${exp.company}`)
      .join(" | ")}

TARGET ROLE:
• Required: ${topRequiredSkills.join(", ")}
• Type: ${data.type} • Level: ${data.level} • Tone: ${data.tone}

RULES:
1. Match ${data.type} focus (behavioral/technical)
2. ${data.difficulty} difficulty level
3. Voice-friendly (no special chars)
4. Return JSON array: ["Q1", "Q2", ...]`;
  },

  INTERVIEW_STANDARD: (data: {
    role: string;
    level: string;
    specialtySkills?: string;
    type: string;
    tone: string;
    difficulty: string;
    amount: number;
  }) => {
    const skills = data.specialtySkills
      ? data.specialtySkills.split(",").slice(0, 8).join(", ")
      : "General";

    return `Create ${data.amount} ${data.type} interview questions for ${data.role} (${data.level}).

REQUIREMENTS:
• Skills: ${skills}
• Tone: ${data.tone}
• Difficulty: ${data.difficulty}

RULES:
1. Voice-friendly format
2. Match experience level
3. Balance behavioral/technical per type
4. Return JSON: ["Q1", "Q2", ...]`;
  },

  // 2. CV Parsing (Ultra optimized)
  CV_PARSE_PDF: () => `Extract CV data as JSON:

FIELDS:
- name: string
- summary: string (max 2 sentences)
- skills: string[] (top 15)
- education: {degree, institution, year}[]
- experience: {title, company, duration, description}[] (max 5 recent)

RULES:
• Concise descriptions only
• Remove formatting artifacts
• Professional language
• Skip unclear data`,

  CV_PARSE_TEXT: (text: string) => {
    const truncatedText = truncateText(text, 8000); // ~2000 tokens for input

    return `Parse CV and extract structured data:

${truncatedText}

Extract:
• name, summary (brief)
• skills array (technical + soft)
• education array
• experience array (recent 5)

Format: Clean JSON only.`;
  },

  // 3. Job Description Parsing (Optimized)
  JOB_PARSE_PDF: () => `Parse job description PDF to JSON:

EXTRACT:
- title: string
- company: string  
- description: string (summary)
- responsibilities: string[] (key duties)
- requiredSkills: string[] (all requirements)

RULES:
• Comprehensive extraction
• Clean formatting
• Reasonable inferences if unclear`,

  JOB_PARSE_TEXT: (text: string) => {
    const truncatedText = truncateText(text, 8000);

    return `Parse job description:

${truncatedText}

Extract as JSON:
• title, company, description
• responsibilities array
• requiredSkills array

Keep comprehensive, clean format.`;
  },

  // 4. Feedback Generation (Enhanced with realistic scoring)
  FEEDBACK_ANALYSIS: (
    questions: string[],
    transcript: string,
    level: string = "mid"
  ) => {
    // Limit questions to prevent context overflow
    const limitedQuestions = questions.slice(0, 15);

    // Truncate transcript if too long
    const truncatedTranscript = truncateText(transcript, 15000); // ~3750 tokens

    return `Analyze interview performance with realistic, calibrated scoring:

INTERVIEW DATA:
QUESTIONS:
${limitedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

TRANSCRIPT:
${truncatedTranscript}

EXPERIENCE LEVEL: ${level.toUpperCase()}

SCORING CALIBRATION FOR ${level.toUpperCase()} LEVEL:
- 90-100: Exceptional, top 5-10% of candidates (rare)
- 80-89: Strong performance, clearly qualified for role
- 70-79: Adequate, meets requirements with minor gaps
- 60-69: Below expectations, concerning gaps
- 50-59: Significant deficiencies
- 40-49: Major issues, substantial problems
- 20-39: Very poor performance, serious concerns
- 0-19: No meaningful response, unprofessional, or completely irrelevant

SCORING GUIDELINES:
- Use the FULL range 0-100, don't cluster around 50-70
- Most candidates should score 40-75 range for actual attempts
- Be HARSH and honest in evaluation - this is realistic hiring
- Scores above 80 should be rare and well-justified
- Consider experience level expectations
- NO RESPONSE = 0 points (not 50)
- TEST RESPONSES = 0-10 points maximum
- OFF-TOPIC RESPONSES = 0-20 points maximum
- MINIMAL EFFORT = 10-30 points maximum

CRITICAL SCORING RULES:
1. If candidate says "testing", "just testing", or similar → 0-5 points maximum
2. If candidate doesn't answer the question at all → 0-10 points maximum  
3. If response is under 10 words of actual content → 0-20 points maximum
4. If response shows zero effort or preparation → 0-25 points maximum
5. Only give 50+ points if there's genuine attempt to answer the question

EVIDENCE REQUIREMENTS:
For each score, provide specific evidence from responses:
- Quote specific phrases that support the rating
- Note presence/absence of examples, structure, clarity
- Identify technical accuracy or gaps
- Document communication patterns

CATEGORY SCORING RUBRICS:

COMMUNICATION SKILLS:
- 90+: Articulate, structured, clear examples, excellent flow
- 80-89: Clear communication, good structure, mostly complete
- 70-79: Generally clear, adequate structure, some gaps
- 60-69: Sometimes unclear, disorganized, missing details
- 50-59: Frequently unclear, poor organization
- 40-49: Very unclear communication, hard to follow
- 20-39: Barely coherent, major communication issues
- 0-19: No meaningful communication, testing responses, gibberish

TECHNICAL KNOWLEDGE:
- 90+: Deep understanding, current practices, excellent examples
- 80-89: Solid foundation, good examples, minor gaps
- 70-79: Adequate knowledge, some examples, moderate gaps
- 60-69: Basic understanding, significant gaps, limited examples
- 50-59: Fundamental gaps, outdated or incorrect knowledge
- 40-49: Very limited knowledge, major misconceptions
- 20-39: Minimal technical understanding, mostly incorrect
- 0-19: No technical knowledge demonstrated, irrelevant responses

PROBLEM SOLVING:
- 90+: Systematic approach, multiple solutions, considers trade-offs
- 80-89: Logical approach, reasonable solutions, good analysis
- 70-79: Basic approach, workable solutions, limited analysis
- 60-69: Inconsistent approach, incomplete solutions
- 50-59: Poor methodology, unclear solutions
- 40-49: Very poor problem-solving, illogical approach
- 20-39: No clear methodology, completely confused approach
- 0-19: No problem-solving demonstrated, off-topic or testing

CULTURAL FIT:
- 90+: Excellent professional values, collaboration, growth mindset
- 80-89: Good professional presence, teamwork orientation
- 70-79: Adequate professional behavior, some alignment
- 60-69: Mixed signals, some concerning responses
- 50-59: Poor alignment, conflicting values
- 40-49: Unprofessional behavior, concerning attitudes
- 20-39: Very unprofessional, major red flags
- 0-19: Completely unprofessional, testing responses, inappropriate

CONFIDENCE & CLARITY:
- 90+: Confident, decisive, clear under pressure
- 80-89: Generally confident, clear responses, minor hesitation
- 70-79: Adequate confidence, some uncertainty but recovers
- 60-69: Inconsistent confidence, unclear responses
- 50-59: Low confidence affecting communication
- 40-49: Very low confidence, frequent hesitation
- 20-39: Extremely hesitant, barely able to respond
- 0-19: No confidence, testing responses, complete uncertainty

REQUIRED OUTPUT FORMAT:
{
  "totalScore": number,
  "overallPercentile": "Top 10%" | "Top 25%" | "Average" | "Below average" | "Bottom 25%",
  "reliabilityScore": "High" | "Medium" | "Low",
  "categoryScores": [
    {
      "name": "Communication Skills",
      "score": number,
      "percentile": string,
      "confidence": "High" | "Medium" | "Low",
      "evidence": ["✅ Specific evidence item", "❌ Gap identified"],
      "comment": "Detailed assessment explanation",
      "benchmarkComparison": "Performance level description",
      "improvementTips": ["Actionable tip 1", "Actionable tip 2"]
    }
    // ... repeat for all 5 categories
  ],
  "questionRatings": [
    {
      "question": "Question text",
      "response": "Summary of candidate response", 
      "rating": number,
      "feedback": "Specific feedback on this response",
      "evidence": ["Supporting evidence from response"],
      "category": "Primary category this question tests",
      "confidence": "Assessment confidence level"
    }
    // ... for each question
  ],
  "strengths": [
    {
      "area": "Strength area",
      "description": "What they did well",
      "evidence": ["Specific supporting evidence"]
    }
  ],
  "areasForImprovement": [
    {
      "area": "Improvement area", 
      "description": "What needs work",
      "priority": "High" | "Medium" | "Low",
      "actionableSteps": ["Step 1", "Step 2"]
    }
  ],
  "finalAssessment": "Overall assessment with hiring recommendation context",
  "limitations": [
    "Assessment limitation 1",
    "Assessment limitation 2"
  ],
  "nextSteps": [
    "Recommended next action 1",
    "Recommended next action 2"
  ]
}

CRITICAL INSTRUCTIONS:
- Be honest and critical in evaluation
- Use specific evidence from transcript
- Don't inflate scores - use realistic benchmarks
- Focus on interview communication skills, not assumed technical ability
- Acknowledge assessment limitations clearly
- Provide actionable improvement guidance`;
  },

  // 5. Voice Interview System (Optimized)
  VOICE_INTERVIEWER:
    () => `Professional voice interviewer. Conduct structured interview using provided questions.

GUIDELINES:
• Follow question flow: {{questions}}
• Active listening, brief follow-ups
• Professional yet warm tone
• Concise responses (voice conversation)
• Answer role questions professionally
• Close properly: "This concludes our interview. Thank you. Goodbye."

Keep responses short, natural, conversational.`,
} as const;

// Context validation functions
export function validateContextLimits(
  prompt: string,
  additionalContent: string = "",
  model: keyof typeof TOKEN_LIMITS
): { isValid: boolean; estimatedTokens: number; maxTokens: number } {
  const totalContent = prompt + additionalContent;
  const estimatedTokens = estimateTokens(totalContent);
  const maxTokens = TOKEN_LIMITS[model].safe_input;

  return {
    isValid: estimatedTokens <= maxTokens,
    estimatedTokens,
    maxTokens,
  };
}

// Helper for profile data truncation
export function optimizeProfileData(profile: ProfileData): ProfileData {
  return {
    ...profile,
    summary: truncateText(profile.summary || "", 200),
    skills: (profile.skills || []).slice(0, 15),
    experience: (profile.experience || [])
      .slice(0, 3)
      .map((exp: ExperienceEntry) => ({
        ...exp,
        description: truncateText(exp.description || "", 150),
      })),
    education: (profile.education || []).slice(0, 3),
  };
}

// Helper for job target data truncation
export function optimizeJobTargetData(jobTarget: JobTargetData): JobTargetData {
  return {
    ...jobTarget,
    description: truncateText(jobTarget.description || "", 300),
    responsibilities: (jobTarget.responsibilities || []).slice(0, 8),
    requiredSkills: (jobTarget.requiredSkills || []).slice(0, 12),
  };
}

export default PROMPTS;
