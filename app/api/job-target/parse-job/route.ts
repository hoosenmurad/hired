import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const parsedJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  description: z.string(),
  responsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("jobDescription") as File;
    const textInput = formData.get("textInput") as string;
    const urlInput = formData.get("urlInput") as string;

    // Check if at least one input is provided
    if (!file && !textInput && !urlInput) {
      return NextResponse.json(
        { success: false, error: "No job description provided" },
        { status: 400 }
      );
    }

    let result;

    if (file) {
      // Validate file size (max 10MB for PDF/text files)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error:
              "File size too large. Please upload a file smaller than 10MB.",
          },
          { status: 400 }
        );
      }

      // Validate file type
      const isTextFile =
        file.type.includes("text") || file.name.endsWith(".txt");
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

      if (isPdfFile) {
        // Handle PDF files using Firebase AI Logic patterns

        // Convert file to base64 following Firebase recommendations
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        result = await generateObject({
          model: google("gemini-2.5-flash"),
          schema: parsedJobSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this job description PDF document and extract structured information. Return clean, valid JSON.

IMPORTANT INSTRUCTIONS:
- Extract all required information accurately
- Keep descriptions concise but comprehensive
- Remove excessive whitespace and formatting artifacts
- Use professional language
- Make reasonable inferences if information is implicit

EXTRACT THE FOLLOWING:

1. **Job Title**: Extract the exact job title/position name

2. **Company Name**: Find the company/organization name

3. **Job Description**: Create a comprehensive summary including:
   - What the role involves
   - Company/department context
   - Key objectives and goals
   - Relevant company information

4. **Key Responsibilities**: Extract ALL duties and responsibilities. Include:
   - Day-to-day tasks
   - Project responsibilities
   - Collaboration duties
   - Strategic initiatives
   - Reporting responsibilities

5. **Required Skills**: Extract ALL skills and requirements. Include:
   - Years of experience required
   - Technical skills and tools
   - Soft skills and abilities
   - Educational requirements
   - Industry experience
   - Preferred qualifications

Return structured JSON with responsibilities and skills as arrays of strings.
Each item should be clear and actionable. Do not leave any field empty.`,
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
                "The file appears to be empty or too short to parse. Please upload a proper job description with at least 50 characters.",
            },
            { status: 400 }
          );
        }

        result = await generateObject({
          model: google("gemini-2.0-flash-001"),
          schema: parsedJobSchema,
          prompt: `
            Parse the following job description and extract structured information:

            Job Description Text:
            ${extractedText.substring(0, 10000)} ${
            extractedText.length > 10000 ? "...(truncated)" : ""
          }

            Please extract:
            1. Job title
            2. Company name
            3. Overall job description (summary of the role)
            4. Key responsibilities (as an array of specific duties)
            5. Required skills (as an array including experience, technical skills, education, etc.)

            Format the response as clean JSON. If any information is not available, make reasonable inferences based on context.
          `,
        });
      }
    } else if (textInput && textInput.trim().length > 0) {
      // Handle direct text input
      if (textInput.trim().length < 50) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Job description text is too short. Please provide at least 50 characters.",
          },
          { status: 400 }
        );
      }

      result = await generateObject({
        model: google("gemini-2.0-flash-001"),
        schema: parsedJobSchema,
        prompt: `
          Parse the following job description and extract structured information:

          Job Description:
          ${textInput.substring(0, 10000)} ${
          textInput.length > 10000 ? "...(truncated)" : ""
        }

          Please extract:
          1. Job title
          2. Company name
          3. Overall job description (summary of the role)
          4. Key responsibilities (as an array of specific duties)
          5. Required skills (as an array including experience, technical skills, education, etc.)

          Format the response as clean JSON. If any information is not available, make reasonable inferences based on context.
        `,
      });
    } else if (urlInput && urlInput.trim().length > 0) {
      // Handle URL input
      const url = urlInput.trim();

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid URL format. Please provide a valid URL.",
          },
          { status: 400 }
        );
      }

      // Fetch content from URL
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobParser/1.0)",
          },
        });

        if (!response.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Failed to fetch content from URL. Status: ${response.status}`,
            },
            { status: 400 }
          );
        }

        const jobText = await response.text();

        if (!jobText || jobText.trim().length < 100) {
          return NextResponse.json(
            {
              success: false,
              error:
                "The URL content appears to be empty or too short to parse.",
            },
            { status: 400 }
          );
        }

        // Parse the HTML content to extract text (basic text extraction)
        const textContent = jobText
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        result = await generateObject({
          model: google("gemini-2.0-flash-001"),
          schema: parsedJobSchema,
          prompt: `
            Parse the following job description content from a webpage and extract structured information:

            Job Description Content:
            ${textContent.substring(0, 15000)} ${
            textContent.length > 15000 ? "...(truncated)" : ""
          }

            Please extract:
            1. Job title (look for position/role names)
            2. Company name (look for company/organization names)
            3. Overall job description (summary of the role and company context)
            4. Key responsibilities (as an array of specific duties and tasks)
            5. Required skills (as an array including experience, technical skills, education, certifications, etc.)

            Format the response as clean JSON. Focus on job-related content and ignore navigation, footer, or unrelated website content.
            If any information is not clearly available, make reasonable inferences based on context.
          `,
        });
      } catch (error) {
        console.error("Error fetching URL content:", error);
        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to fetch content from the provided URL. Please check the URL and try again.",
          },
          { status: 500 }
        );
      }
    }

    // Process results
    if (result?.object) {
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
          error: "Failed to extract structured data from job description",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error parsing job description:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while parsing the job description",
      },
      { status: 500 }
    );
  }
}
