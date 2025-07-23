import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import pdf from "pdf-parse";

const parsedJobSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  requiredSkills: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("jobDescription") as File;
    const textInput = formData.get("textInput") as string;
    const urlInput = formData.get("urlInput") as string;

    let jobText = "";

    if (file) {
      // Handle file upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === "application/pdf") {
        const pdfData = await pdf(buffer);
        jobText = pdfData.text;
      } else if (file.type.includes("text")) {
        jobText = buffer.toString("utf-8");
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Unsupported file type. Please upload a PDF or text file.",
          },
          { status: 400 }
        );
      }
    } else if (textInput) {
      // Handle text input
      jobText = textInput;
    } else if (urlInput) {
      // Handle URL input (basic implementation)
      try {
        const response = await fetch(urlInput);
        if (!response.ok) {
          throw new Error("Failed to fetch job description from URL");
        }
        jobText = await response.text();
        // Simple HTML tag removal
        jobText = jobText
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } catch (fetchError) {
        console.error("URL fetch error:", fetchError);
        return NextResponse.json(
          { success: false, error: "Failed to fetch job description from URL" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "No job description provided" },
        { status: 400 }
      );
    }

    // Parse job description using Gemini
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: parsedJobSchema,
      prompt: `
        Parse the following job description and extract structured information:

        Job Description:
        ${jobText}

        Please extract:
        1. Job title
        2. Company name
        3. Key responsibilities (as an array of strings)
        4. Required skills and qualifications (as an array of strings)
        5. Overall job description (summary of the role)

        If any information is not available or unclear, omit that field rather than guessing.
        For responsibilities, break down main duties and expectations.
        For required skills, include both technical skills and qualifications mentioned.
      `,
    });

    return NextResponse.json({
      success: true,
      data: object,
    });
  } catch (error) {
    console.error("Error parsing job description:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse job description" },
      { status: 500 }
    );
  }
}
