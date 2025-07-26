import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { PROMPTS, validateContextLimits } from "@/lib/prompts";
import {
  checkQuotaAvailability,
  incrementUsage,
  getUserPlanInfo,
} from "@/lib/billing";

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

    // Check quota availability (allow non-subscribers to see UI but block creation)
    const { isSubscribed, userId } = await getUserPlanInfo();

    if (isSubscribed && userId) {
      const quota = await checkQuotaAvailability(userId, "jobTarget");
      if (!quota.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Job target limit reached. You have ${quota.remaining} of ${quota.limit} remaining this month.`,
            quota: quota,
          },
          { status: 403 }
        );
      }
    } else if (!isSubscribed) {
      return NextResponse.json(
        {
          success: false,
          error: "Please subscribe to a plan to create job targets.",
          requiresSubscription: true,
        },
        { status: 403 }
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
        // Handle PDF files with optimized prompt
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const prompt = PROMPTS.JOB_PARSE_PDF();

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
                "Job description file is too large to process. Please use a smaller file or convert to text.",
            },
            { status: 400 }
          );
        }

        result = await generateObject({
          model: google("gemini-2.5-flash"),
          schema: parsedJobSchema,
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
        // Handle text files with optimized prompt
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

        const prompt = PROMPTS.JOB_PARSE_TEXT(extractedText);

        // Validate context limits
        const validation = validateContextLimits(
          prompt,
          "",
          "gemini-2.0-flash"
        );
        if (!validation.isValid) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Job description text is too long to process. Please shorten the content.",
            },
            { status: 400 }
          );
        }

        result = await generateObject({
          model: google("gemini-2.0-flash-001"),
          schema: parsedJobSchema,
          prompt: prompt,
        });
      }
    } else if (textInput && textInput.trim().length > 0) {
      // Handle direct text input with optimized prompt
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

      const prompt = PROMPTS.JOB_PARSE_TEXT(textInput);

      // Validate context limits
      const validation = validateContextLimits(prompt, "", "gemini-2.0-flash");
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Job description text is too long to process. Please shorten the content.",
          },
          { status: 400 }
        );
      }

      result = await generateObject({
        model: google("gemini-2.0-flash-001"),
        schema: parsedJobSchema,
        prompt: prompt,
      });
    } else if (urlInput && urlInput.trim().length > 0) {
      // Enhanced URL handling with better error handling
      try {
        // Validate URL format
        let validUrl: URL;
        try {
          validUrl = new URL(urlInput.trim());
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid URL format. Please provide a valid URL.",
            },
            { status: 400 }
          );
        }

        // Only allow http/https protocols
        if (!["http:", "https:"].includes(validUrl.protocol)) {
          return NextResponse.json(
            {
              success: false,
              error: "Only HTTP and HTTPS URLs are supported.",
            },
            { status: 400 }
          );
        }

        const response = await fetch(validUrl.toString(), {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobParser/1.0)",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Failed to fetch content from URL: ${response.status} ${response.statusText}`,
            },
            { status: 400 }
          );
        }

        const html = await response.text();

        // Enhanced HTML content extraction
        const textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "") // Remove navigation
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "") // Remove headers
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "") // Remove footers
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (textContent.length < 100) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Could not extract sufficient job description content from the URL. The page may not contain a job posting or may be behind authentication.",
            },
            { status: 400 }
          );
        }

        const prompt = PROMPTS.JOB_PARSE_TEXT(textContent);

        // Validate context limits
        const validation = validateContextLimits(
          prompt,
          "",
          "gemini-2.0-flash"
        );
        if (!validation.isValid) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Content from URL is too long to process. Please use direct text input with shortened content.",
            },
            { status: 400 }
          );
        }

        result = await generateObject({
          model: google("gemini-2.0-flash-001"),
          schema: parsedJobSchema,
          prompt: prompt,
        });
      } catch (error) {
        console.error("Error fetching URL:", error);

        if (error instanceof Error) {
          if (error.name === "TimeoutError") {
            return NextResponse.json(
              {
                success: false,
                error: "Request timed out. The URL took too long to respond.",
              },
              { status: 400 }
            );
          }

          if (error.message.includes("fetch")) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "Network error occurred while fetching the URL. Please check the URL and try again.",
              },
              { status: 400 }
            );
          }
        }

        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to fetch content from the provided URL. Please check the URL or use direct text input.",
          },
          { status: 400 }
        );
      }
    }

    // Process and return the result
    if (result?.object) {
      // Clean the extracted data
      const cleanedResult = {
        title: result.object.title?.trim() || "",
        company: result.object.company?.trim() || "",
        description: result.object.description?.trim() || "",
        responsibilities: Array.isArray(result.object.responsibilities)
          ? result.object.responsibilities
              .filter((r) => r?.trim())
              .map((r) => r.trim())
          : [],
        requiredSkills: Array.isArray(result.object.requiredSkills)
          ? result.object.requiredSkills
              .filter((s) => s?.trim())
              .map((s) => s.trim())
          : [],
      };

      // Increment usage for successful creation
      if (isSubscribed && userId) {
        await incrementUsage(userId, "jobTarget");
      }

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
