import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const parsedJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  responsibilities: z
    .array(z.string().min(1))
    .min(1, "At least one responsibility is required"),
  requiredSkills: z
    .array(z.string().min(1))
    .min(1, "At least one skill is required"),
  description: z.string().min(10, "Job description is required"),
});

export async function POST(request: NextRequest) {
  try {
    console.log("Job description parsing request received");

    const formData = await request.formData();
    const file = formData.get("jobDescription") as File;
    const textInput = formData.get("textInput") as string;
    const urlInput = formData.get("urlInput") as string;

    let result;

    if (file) {
      console.log("Processing file:", file.name, file.type, file.size);

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
        console.log("Unsupported file type:", file.type);
        return NextResponse.json(
          {
            success: false,
            error:
              "Unsupported file type. Please upload a text file (.txt) or PDF file (.pdf).",
          },
          { status: 400 }
        );
      }

      console.log("Starting AI parsing with Gemini");

      if (isPdfFile) {
        // Handle PDF files using Firebase AI Logic patterns
        console.log(
          "Processing PDF file with Gemini following Firebase AI Logic patterns"
        );

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

        // Clean the result data following Firebase best practices
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
          result = { object: cleanedResult };
        }
      } else {
        // Handle text files
        console.log("Processing text file");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const jobText = buffer.toString("utf-8");

        // Validate extracted text
        if (!jobText || jobText.trim().length < 50) {
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
          model: google("gemini-2.5-flash"),
          schema: parsedJobSchema,
          prompt: `
            You are a job description parser. Extract ALL the following information from this job posting.
            You MUST provide all fields - if information seems unclear, make reasonable inferences based on context.

            Job Description:
            ${jobText.substring(0, 10000)} ${
            jobText.length > 10000 ? "...(truncated)" : ""
          }

            REQUIRED EXTRACTION:

            1. **Job Title**: Extract the exact job title/position name
            
            2. **Company Name**: Find the company/organization name
            
            3. **Job Description**: Create a comprehensive summary that includes:
               - What the role involves
               - The company/department context  
               - Key objectives and goals
               - Any relevant company information
               
            4. **Key Responsibilities**: Extract ALL duties, tasks, and responsibilities mentioned. Include:
               - Day-to-day tasks
               - Project responsibilities  
               - Collaboration duties
               - Strategic initiatives
               - Reporting responsibilities
               Break these into clear, actionable bullet points.
               
            5. **Required Skills**: Extract ALL skills, qualifications, and requirements mentioned. Include:
               - Years of experience required
               - Technical skills and tools
               - Soft skills and abilities
               - Educational requirements
               - Industry experience
               - Preferred qualifications
               
            FORMAT: Return structured data where responsibilities and skills are arrays of strings.
            Each responsibility and skill should be a complete, standalone statement.
            
            IMPORTANT: You must extract information for ALL fields. Do not leave any field empty.
          `,
        });
      }
    } else if (textInput) {
      console.log("Processing text input, length:", textInput.length);

      // Validate text input
      if (!textInput || textInput.trim().length < 50) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The job description appears to be empty or too short to parse. Please provide at least 50 characters.",
          },
          { status: 400 }
        );
      }

      result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: parsedJobSchema,
        prompt: `
          You are a job description parser. Extract ALL the following information from this job posting.
          You MUST provide all fields - if information seems unclear, make reasonable inferences based on context.

          Job Description:
          ${textInput.substring(0, 10000)} ${
          textInput.length > 10000 ? "...(truncated)" : ""
        }

          REQUIRED EXTRACTION:

          1. **Job Title**: Extract the exact job title/position name
          
          2. **Company Name**: Find the company/organization name
          
          3. **Job Description**: Create a comprehensive summary that includes:
             - What the role involves
             - The company/department context  
             - Key objectives and goals
             - Any relevant company information
             
          4. **Key Responsibilities**: Extract ALL duties, tasks, and responsibilities mentioned. Include:
             - Day-to-day tasks
             - Project responsibilities  
             - Collaboration duties
             - Strategic initiatives
             - Reporting responsibilities
             Break these into clear, actionable bullet points.
             
          5. **Required Skills**: Extract ALL skills, qualifications, and requirements mentioned. Include:
             - Years of experience required
             - Technical skills and tools
             - Soft skills and abilities
             - Educational requirements
             - Industry experience
             - Preferred qualifications
             
          FORMAT: Return structured data where responsibilities and skills are arrays of strings.
          Each responsibility and skill should be a complete, standalone statement.
          
          IMPORTANT: You must extract information for ALL fields. Do not leave any field empty.
        `,
      });
    } else if (urlInput) {
      console.log("Processing URL input:", urlInput);
      try {
        const response = await fetch(urlInput);
        if (!response.ok) {
          throw new Error("Failed to fetch job description from URL");
        }
        let jobText = await response.text();
        // Simple HTML tag removal
        jobText = jobText
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        console.log("URL content extracted, length:", jobText.length);

        // Validate extracted text
        if (!jobText || jobText.trim().length < 50) {
          return NextResponse.json(
            {
              success: false,
              error:
                "The URL content appears to be empty or too short to parse. Please provide a valid job posting URL.",
            },
            { status: 400 }
          );
        }

        result = await generateObject({
          model: google("gemini-2.5-flash"),
          schema: parsedJobSchema,
          prompt: `
            You are a job description parser. Extract ALL the following information from this job posting.
            You MUST provide all fields - if information seems unclear, make reasonable inferences based on context.

            Job Description from URL:
            ${jobText.substring(0, 10000)} ${
            jobText.length > 10000 ? "...(truncated)" : ""
          }

            REQUIRED EXTRACTION:

            1. **Job Title**: Extract the exact job title/position name
            
            2. **Company Name**: Find the company/organization name
            
            3. **Job Description**: Create a comprehensive summary that includes:
               - What the role involves
               - The company/department context  
               - Key objectives and goals
               - Any relevant company information
               
            4. **Key Responsibilities**: Extract ALL duties, tasks, and responsibilities mentioned. Include:
               - Day-to-day tasks
               - Project responsibilities  
               - Collaboration duties
               - Strategic initiatives
               - Reporting responsibilities
               Break these into clear, actionable bullet points.
               
            5. **Required Skills**: Extract ALL skills, qualifications, and requirements mentioned. Include:
               - Years of experience required
               - Technical skills and tools
               - Soft skills and abilities
               - Educational requirements
               - Industry experience
               - Preferred qualifications
               
            FORMAT: Return structured data where responsibilities and skills are arrays of strings.
            Each responsibility and skill should be a complete, standalone statement.
            
            IMPORTANT: You must extract information for ALL fields. Do not leave any field empty.
          `,
        });
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

    console.log("AI parsing completed successfully");

    return NextResponse.json({
      success: true,
      data: result.object,
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
      if (error.message.includes("file") || error.message.includes("PDF")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to process the uploaded file. Please ensure it's a valid PDF or text file.",
          },
          { status: 400 }
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
