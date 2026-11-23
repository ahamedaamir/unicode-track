import { NextRequest, NextResponse } from "next/server";
import { evaluateProjectCodeWithGemini, CodeReviewInput } from "@/services/ai/code-review";

/**
 * Server-side API Route for Gemini AI Code Review
 * POST /api/ai/review-code
 */
export async function POST(req: NextRequest) {
  try {
    const body: CodeReviewInput = await req.json();

    if (!body.projectId || !body.groupId || !body.rubric) {
      return NextResponse.json(
        { error: "Missing required parameters: projectId, groupId, and rubric are required." },
        { status: 400 }
      );
    }

    if (!body.rubric.criteria || body.rubric.criteria.length === 0) {
      return NextResponse.json(
        { error: "The provided evaluation rubric contains no criteria. Please configure a valid rubric first." },
        { status: 400 }
      );
    }

    // Execute code review with Gemini 2.5 Flash
    const evaluation = await evaluateProjectCodeWithGemini(body);

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/review-code:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to complete AI code review.",
      },
      { status: 500 }
    );
  }
}

