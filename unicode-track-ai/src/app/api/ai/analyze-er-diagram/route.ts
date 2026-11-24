import { NextRequest, NextResponse } from "next/server";
import { analyzeERDiagramWithGemini, AnalyzeERDiagramInput } from "@/services/ai/er-diagram-analysis";

/**
 * Server-side API Route for Gemini ER Diagram & Database Implementation Analysis
 * POST /api/ai/analyze-er-diagram
 */
export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeERDiagramInput = await req.json();

    if (!body.projectId || !body.groupId || !body.submission) {
      return NextResponse.json(
        {
          error: "Missing required parameters: projectId, groupId, and submission are required.",
        },
        { status: 400 }
      );
    }

    if (!body.submission.fileUrl && !body.submission.fileName) {
      return NextResponse.json(
        {
          error: "The provided submission must contain a valid file name or diagram file URL.",
        },
        { status: 400 }
      );
    }

    // Run Gemini 2.5 Flash ER Diagram & SQL Schema Analysis
    const analysis = await analyzeERDiagramWithGemini(body);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/analyze-er-diagram:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze ER diagram.",
      },
      { status: 500 }
    );
  }
}

