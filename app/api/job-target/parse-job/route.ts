import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const parsedJobSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  requiredSkills: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log("Job description parsing request received");

    const formData = await request.formData();
    const file = formData.get("jobDescription") as File;
    const textInput = formData.get("textInput") as string;
    const urlInput = formData.get("urlInput") as string;

    let jobText = "";

    if (file) {
      console.log("Processing file:", file.name, file.type, file.size);

      // Validate file size (max 5MB for text files)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error:
              "File size too large. Please upload a file smaller than 5MB.",
          },
          { status: 400 }
        );
      }

      // Handle file upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type.includes("text") || file.name.endsWith(".txt")) {
        console.log("Processing text file");
        jobText = buffer.toString("utf-8");
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
    } else if (textInput) {
      console.log("Processing text input, length:", textInput.length);
      jobText = textInput;
    } else if (urlInput) {
      console.log("Processing URL input:", urlInput);
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
        console.log("URL content extracted, length:", jobText.length);
      } catch (fetchError) {
        console.error("URL fetch error:", fetchError);
        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to fetch job description from URL. Please check the URL and try again.",
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "No job description provided" },
        { status: 400 }
      );
    }

    // Validate extracted text
    if (!jobText || jobText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The job description appears to be empty or too short to parse. Please provide at least 50 characters.",
        },
        { status: 400 }
      );
    }

    console.log("Starting AI parsing with Gemini");

    // Parse job description using Gemini
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: parsedJobSchema,
      prompt: `
        Parse the following job description and extract structured information:

        Job Description:
        ${jobText.substring(0, 10000)} ${
        jobText.length > 10000 ? "...(truncated)" : ""
      }

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

    console.log("AI parsing completed successfully");

    return NextResponse.json({
      success: true,
      data: object,
    });
  } catch (error) {
    console.error("Error parsing job description:", error);

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
        error:
          "Failed to parse job description. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
