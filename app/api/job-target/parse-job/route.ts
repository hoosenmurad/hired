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

    // Check if at least one input is provided
    if (!file && !textInput) {
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
          error:
            "Job target creation requires an active subscription. Please upgrade your plan to continue.",
          needsUpgrade: true,
        },
        { status: 403 }
      );
    }

    let result;

    if (file) {
      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File size too large (max 10MB)" },
          { status: 400 }
        );
      }

      const fileName = file.name?.toLowerCase() || "";
      const isTextFile =
        fileName.endsWith(".txt") || file.type?.includes("text");
      const isPdfFile =
        fileName.endsWith(".pdf") || file.type === "application/pdf";

      if (!isTextFile && !isPdfFile) {
        return NextResponse.json(
          { success: false, error: "Only PDF and text files are supported" },
          { status: 400 }
        );
      }

      if (isPdfFile) {
        // Handle PDF files
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const prompt = PROMPTS.JOB_PARSE_PDF();

        const validation = validateContextLimits(
          prompt,
          base64Data,
          "gemini-2.0-flash"
        );
        if (!validation.isValid) {
          return NextResponse.json(
            {
              success: false,
              error:
                "File too large to process. Please use a smaller file or text input.",
            },
            { status: 400 }
          );
        }

        result = await generateObject({
          model: google("gemini-2.0-flash-001"),
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
        // Handle text files
        const arrayBuffer = await file.arrayBuffer();
        const textContent = Buffer.from(arrayBuffer).toString("utf-8");

        if (textContent.trim().length < 50) {
          return NextResponse.json(
            {
              success: false,
              error: "File content too short (minimum 50 characters)",
            },
            { status: 400 }
          );
        }

        const prompt = PROMPTS.JOB_PARSE_TEXT(textContent);

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
                "File content too long to process. Please shorten the content.",
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
    }

    // Process and return the result
    if (result?.object) {
      // Clean the extracted data
      const cleanedResult = {
        title: result.object.title?.trim() || "",
        company: result.object.company?.trim() || "",
        description: result.object.description?.trim() || "",
        responsibilities: (result.object.responsibilities || [])
          .map((r) => r?.trim())
          .filter((r) => r && r.length > 0),
        requiredSkills: (result.object.requiredSkills || [])
          .map((s) => s?.trim())
          .filter((s) => s && s.length > 0),
      };

      // Increment usage for subscribed users
      if (isSubscribed && userId) {
        await incrementUsage(userId, "jobTarget");
      }

      return NextResponse.json({
        success: true,
        data: cleanedResult,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to extract job information" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Job parsing error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse job description",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
