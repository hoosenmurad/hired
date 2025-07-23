import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import pdf from "pdf-parse";

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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    // Extract text based on file type
    if (file.type === "application/pdf") {
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;
    } else if (file.type.includes("text")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Please upload a PDF or text file.",
        },
        { status: 400 }
      );
    }

    // Parse CV using Gemini
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: parsedCVSchema,
      prompt: `
        Parse the following CV/Resume and extract structured information:

        CV Text:
        ${extractedText}

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

    return NextResponse.json({
      success: true,
      data: object,
    });
  } catch (error) {
    console.error("Error parsing CV:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse CV" },
      { status: 500 }
    );
  }
}
