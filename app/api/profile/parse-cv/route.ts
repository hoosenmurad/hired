import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { PROMPTS, validateContextLimits } from "@/lib/prompts";

// Ensure Node.js runtime for Buffer and server-only APIs
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Always dynamic
export const maxDuration = 60; // Allow up to 60s processing time

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
    // Sanity check: required API key must exist
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Server misconfiguration: missing AI API key",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("cv") as File | null;

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

    // Validate file type (guard .type access)
    const fileType = (file as unknown as { type?: string }).type || "";
    const fileName = (file as unknown as { name?: string }).name || "";
    const isTextFile = fileType.includes("text") || fileName.endsWith(".txt");
    const isPdfFile =
      fileType === "application/pdf" || fileName.endsWith(".pdf");

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

    type GenerateObjectResult<T> = { object?: T };
    let result: GenerateObjectResult<z.infer<typeof parsedCVSchema>>;

    if (isPdfFile) {
      // Handle PDF files with optimized prompt
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      const prompt = PROMPTS.CV_PARSE_PDF();

      // Validate context limits for PDF + prompt
      const validation = validateContextLimits(
        prompt,
        base64Data,
        "gemini-2.5-flash"
      );
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              "CV file is too large to process. Please use a smaller file or convert to text.",
          },
          { status: 400 }
        );
      }

      result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: parsedCVSchema,
        temperature: 0,
        maxTokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
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
      // Handle text files with optimized prompt and truncation
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

      const prompt = PROMPTS.CV_PARSE_TEXT(extractedText);

      // Validate context limits (align model key with TOKEN_LIMITS)
      const validation = validateContextLimits(prompt, "", "gemini-2.0-flash");
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              "CV text is too long to process. Please shorten the content.",
          },
          { status: 400 }
        );
      }

      result = await generateObject({
        model: google("gemini-2.0-flash"), // align with token limit key
        schema: parsedCVSchema,
        temperature: 0,
        maxTokens: 1024,
        prompt: prompt,
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
    const details =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while parsing the CV",
        ...(details ? { details } : {}),
      },
      { status: 500 }
    );
  }
}
