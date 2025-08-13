import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// Ensure Node.js runtime for Buffer and server-only APIs
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // Reduced timeout

// Comprehensive CV schema
const cvSchema = z.object({
  name: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  education: z
    .array(
      z.object({
        degree: z.string().nullable().optional(),
        institution: z.string().nullable().optional(),
        year: z.string().nullable().optional(),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        title: z.string().nullable().optional(),
        company: z.string().nullable().optional(),
        duration: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
    )
    .optional(),
});

// Helper function to clean repetitive text
const cleanRepetitiveText = (text: string): string => {
  if (!text) return "";

  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Remove duplicates while preserving order
  const uniqueSentences = [];
  const seen = new Set();

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().replace(/\s+/g, " ");
    if (!seen.has(normalized) && uniqueSentences.length < 3) {
      seen.add(normalized);
      uniqueSentences.push(sentence);
    }
  }

  return uniqueSentences.join(". ") + (uniqueSentences.length > 0 ? "." : "");
};

// Helper function to parse and clean JSON response
const parseAndCleanResponse = (jsonText: string): z.infer<typeof cvSchema> => {
  try {
    // First, try to clean obvious repetition patterns
    let cleanedText = jsonText;

    // Remove markdown code block wrappers
    cleanedText = cleanedText
      .replace(/```json\s*/g, "")
      .replace(/```\s*$/g, "");
    cleanedText = cleanedText.trim();

    // Find and fix repetitive summary field
    const summaryMatch = cleanedText.match(/"summary":\s*"([^"]*)/);
    if (summaryMatch) {
      const originalSummary = summaryMatch[1];
      const cleanedSummary = cleanRepetitiveText(originalSummary);
      cleanedText = cleanedText.replace(
        /"summary":\s*"[^"]*"/,
        `"summary": "${cleanedSummary}"`
      );
    }

    // Ensure proper JSON closure
    if (!cleanedText.trim().endsWith("}")) {
      const lastBraceIndex = cleanedText.lastIndexOf("}");
      if (lastBraceIndex > 0) {
        cleanedText = cleanedText.substring(0, lastBraceIndex + 1);
      } else {
        cleanedText += "}";
      }
    }

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("JSON parsing failed, attempting repair:", error);

    // Enhanced extraction for all fields
    const extractField = (field: string): string | null => {
      const match = jsonText.match(new RegExp(`"${field}":\\s*"([^"]*)"`, "i"));
      return match ? cleanRepetitiveText(match[1]) : null;
    };

    const extractSkillsArray = (): string[] => {
      const match = jsonText.match(/"skills":\s*\[([\s\S]*?)\]/i);
      if (!match) return [];

      try {
        // Extract individual skill strings from the array content
        const arrayContent = match[1];
        const skills = arrayContent.match(/"([^"]+)"/g);
        return skills ? skills.map((skill) => skill.replace(/"/g, "")) : [];
      } catch {
        return [];
      }
    };

    const extractEducationArray = (): Array<{
      degree: string;
      institution: string;
      year: string;
    }> => {
      const match = jsonText.match(/"education":\s*\[([\s\S]*?)\]/i);
      if (!match) return [];

      try {
        const arrayContent = match[1];
        // Look for education objects
        const eduMatches = arrayContent.match(/\{[^}]*\}/g);
        if (!eduMatches) return [];

        return eduMatches
          .map((eduStr) => {
            const degree = eduStr.match(/"degree":\s*"([^"]*)"/)?.[1] || "";
            const institution =
              eduStr.match(/"institution":\s*"([^"]*)"/)?.[1] || "";
            const year = eduStr.match(/"year":\s*"([^"]*)"/)?.[1] || "";
            return { degree, institution, year };
          })
          .filter((edu) => edu.degree && edu.institution);
      } catch {
        return [];
      }
    };

    const extractExperienceArray = (): Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }> => {
      const match = jsonText.match(/"experience":\s*\[([\s\S]*?)\]/i);
      if (!match) return [];

      try {
        const arrayContent = match[1];
        // Look for experience objects
        const expMatches = arrayContent.match(/\{[^}]*\}/g);
        if (!expMatches) return [];

        return expMatches
          .map((expStr) => {
            const title = expStr.match(/"title":\s*"([^"]*)"/)?.[1] || "";
            const company = expStr.match(/"company":\s*"([^"]*)"/)?.[1] || "";
            const duration = expStr.match(/"duration":\s*"([^"]*)"/)?.[1] || "";
            const description =
              expStr.match(/"description":\s*"([^"]*)"/)?.[1] || "";
            return {
              title,
              company,
              duration,
              description: cleanRepetitiveText(description),
            };
          })
          .filter((exp) => exp.title && exp.company);
      } catch {
        return [];
      }
    };

    return {
      name: extractField("name") || undefined,
      summary: extractField("summary") || undefined,
      skills: extractSkillsArray(),
      education: extractEducationArray(),
      experience: extractExperienceArray(),
    };
  }
};

// Optimized prompt for consistent extraction
const CV_EXTRACTION_PROMPT = `Extract information from this CV/resume and return as JSON:

{
  "name": "Full name of the person",
  "summary": "Brief professional summary - maximum 3 sentences, no repetition",
  "skills": ["skill1", "skill2", "skill3"],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School/University name", 
      "year": "Graduation year"
    }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "duration": "Employment period",
      "description": "Brief job description - maximum 2 sentences"
    }
  ]
}

CRITICAL RULES:
- Return ONLY valid JSON
- Summary: maximum 3 sentences, NO repetition
- Descriptions: maximum 2 sentences each
- Extract ALL skills mentioned
- Include ALL education entries
- Include ALL work experience
- If information is missing, use empty arrays []
- Do NOT repeat text or sentences
- Keep all text concise and professional`;

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "API configuration error" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("cv") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // File validation
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    const fileName = file.name?.toLowerCase() || "";
    const isTextFile = fileName.endsWith(".txt") || file.type?.includes("text");
    const isPdfFile =
      fileName.endsWith(".pdf") || file.type === "application/pdf";

    if (!isTextFile && !isPdfFile) {
      return NextResponse.json(
        { success: false, error: "Only PDF and text files are supported" },
        { status: 400 }
      );
    }

    console.log(`Processing ${isPdfFile ? "PDF" : "text"} file: ${fileName}`);

    let rawResponse;

    if (isPdfFile) {
      // PDF Processing with Gemini 2.0 Flash - using generateText for more control
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      const result = await generateText({
        model: google("gemini-2.0-flash-001"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: CV_EXTRACTION_PROMPT,
              },
              {
                type: "file",
                data: base64Data,
                mimeType: "application/pdf",
              },
            ],
          },
        ],
        maxTokens: 1024,
        temperature: 0,
      });

      rawResponse = result.text;
    } else {
      // Text Processing with Gemini 2.0 Flash
      const arrayBuffer = await file.arrayBuffer();
      const textContent = Buffer.from(arrayBuffer).toString("utf-8");

      if (textContent.trim().length < 50) {
        return NextResponse.json(
          { success: false, error: "File content too short" },
          { status: 400 }
        );
      }

      const result = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `${CV_EXTRACTION_PROMPT}\n\nCV Content:\n${textContent}`,
        maxTokens: 1024,
        temperature: 0,
      });

      rawResponse = result.text;
    }

    console.log(
      "Raw AI response (first 500 chars):",
      rawResponse.substring(0, 500)
    );

    // Parse and clean the response
    const parsedData = parseAndCleanResponse(rawResponse);

    // Validate with schema
    const validatedData = cvSchema.parse(parsedData);

    console.log("Parsed and validated data:", validatedData);

    if (!validatedData) {
      return NextResponse.json(
        { success: false, error: "Failed to extract CV data" },
        { status: 500 }
      );
    }

    // Clean and validate extracted data with repetition removal
    const cleanText = (text: string | null | undefined): string => {
      if (!text) return "";
      return cleanRepetitiveText(text);
    };

    const cleanedData = {
      name: validatedData.name?.trim() || null,
      summary: cleanText(validatedData.summary),
      skills: (validatedData.skills || [])
        .filter((skill) => skill && skill.trim().length > 0)
        .slice(0, 20),
      education: (validatedData.education || [])
        .filter((edu) => edu && (edu.degree || edu.institution)) // Keep if has degree OR institution
        .map((edu) => ({
          degree: edu.degree?.trim() || "",
          institution: edu.institution?.trim() || "",
          year: edu.year?.trim() || "",
        }))
        .slice(0, 5),
      experience: (validatedData.experience || [])
        .filter((exp) => exp && (exp.title || exp.company)) // Keep if has title OR company
        .map((exp) => ({
          title: exp.title?.trim() || "",
          company: exp.company?.trim() || "",
          duration: exp.duration?.trim() || "",
          description: cleanText(exp.description),
        }))
        .slice(0, 5),
    };

    console.log("Final cleaned data:", cleanedData);

    return NextResponse.json({
      success: true,
      data: cleanedData,
    });
  } catch (error) {
    console.error("CV parsing error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse CV",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
