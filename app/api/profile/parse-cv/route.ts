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
    console.log("CV parsing request received");

    const formData = await request.formData();
    const file = formData.get("cv") as File;

    if (!file) {
      console.log("No file provided");
      return NextResponse.json(
        { success: false, error: "No CV file uploaded" },
        { status: 400 }
      );
    }

    console.log("File received:", file.name, file.type, file.size);

    // Validate file size (max 5MB for text files)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File size too large. Please upload a file smaller than 5MB.",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    // Only handle text files for now
    if (file.type.includes("text") || file.name.endsWith(".txt")) {
      console.log("Processing text file");
      extractedText = buffer.toString("utf-8");
    } else {
      console.log("Unsupported file type:", file.type);
      return NextResponse.json(
        {
          success: false,
          error:
            "Currently only text files (.txt) are supported. PDF support will be added soon.",
        },
        { status: 400 }
      );
    }

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

    console.log("Starting AI parsing with Gemini");

    // Parse CV using Gemini
    const { object } = await generateObject({
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

    console.log("AI parsing completed successfully");

    return NextResponse.json({
      success: true,
      data: object,
    });
  } catch (error) {
    console.error("Error parsing CV:", error);

    // Check if it's a Gemini API error
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          {
            success: false,
            error: "AI service configuration error. Please contact support.",
          },
          { status: 500 }
        );
      }
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "AI service temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse CV. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
