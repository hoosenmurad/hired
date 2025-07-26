import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { PROMPTS, validateContextLimits } from "@/lib/prompts";

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

      // Validate context limits
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
        model: google("gemini-2.0-flash-001"),
        schema: parsedCVSchema,
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
