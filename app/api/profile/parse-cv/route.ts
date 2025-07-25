import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const parsedCVSchema = z.object({
  name: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        year: z.string(),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string(),
        description: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("cv") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No CV file uploaded" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for PDF/text files)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File size too large. Please upload a file smaller than 10MB.",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const isTextFile = file.type.includes("text") || file.name.endsWith(".txt");
    const isPdfFile =
      file.type === "application/pdf" || file.name.endsWith(".pdf");

    if (!isTextFile && !isPdfFile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported file type. Please upload a text file (.txt) or PDF file (.pdf).",
        },
        { status: 400 }
      );
    }

    let result;

    if (isPdfFile) {
      // Handle PDF files using Firebase AI Logic patterns

      // Convert file to base64 following Firebase recommendations
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      // Use Firebase AI Logic recommended structure for multimodal input
      result = await generateObject({
        model: google("gemini-2.5-flash"), // Updated to use recommended model
        schema: parsedCVSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this CV/Resume PDF document and extract structured information. Return clean, valid JSON.

IMPORTANT INSTRUCTIONS:
- Keep summary concise (2-3 sentences maximum)
- Remove all excessive whitespace, newlines, and formatting artifacts
- Extract only clear, relevant information
- Use professional language
- Do not include repeated characters or visual artifacts

EXTRACT THE FOLLOWING:
1. Full name (string)
2. Professional summary (brief, clean text)
3. Skills (array of individual skills)
4. Education (array with degree, institution, year)
5. Work experience (array with title, company, duration, description)

Return only valid JSON. Omit fields if information is unclear or missing.`,
              },
              {
                type: "file",
                data: base64Data,
                mimeType: "application/pdf",
              },
            ],
          },
        ],
      });
    } else {
      // Handle text files
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extractedText = buffer.toString("utf-8");

      // Validate extracted text
      if (!extractedText || extractedText.trim().length < 50) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The file appears to be empty or too short to parse. Please upload a proper CV with at least 50 characters.",
          },
          { status: 400 }
        );
      }

      result = await generateObject({
        model: google("gemini-2.0-flash-001"),
        schema: parsedCVSchema,
        prompt: `
          Parse the following CV/Resume and extract structured information:

          CV Text:
          ${extractedText.substring(0, 10000)} ${
          extractedText.length > 10000 ? "...(truncated)" : ""
        }

          Please extract:
          1. Full name
          2. Professional summary (2-3 sentences about their background)
          3. Skills (technical and soft skills as an array)
          4. Education (degree, institution, year - if multiple, include all)
          5. Work experience (job title, company, duration, brief description - if multiple, include all)

          If any information is not available or unclear, omit that field rather than guessing.
          For skills, extract both technical skills (like programming languages, tools) and relevant soft skills.
          For experience duration, format as "Month Year - Month Year" or "Month Year - Present".
        `,
      });
    }

    // Additional safety check and cleaning
    if (result.object) {
      // Clean all string fields recursively
      const cleanObject = (obj: unknown): unknown => {
        if (typeof obj === "string") {
          return obj.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
        }
        if (Array.isArray(obj)) {
          return obj.map(cleanObject);
        }
        if (obj && typeof obj === "object") {
          const cleaned: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(obj)) {
            cleaned[key] = cleanObject(value);
          }
          return cleaned;
        }
        return obj;
      };

      const cleanedResult = cleanObject(result.object);

      return NextResponse.json({
        success: true,
        data: cleanedResult,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to extract structured data from CV",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error parsing CV:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while parsing the CV",
      },
      { status: 500 }
    );
  }
}
