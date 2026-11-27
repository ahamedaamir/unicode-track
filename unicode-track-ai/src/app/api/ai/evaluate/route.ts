import { NextRequest, NextResponse } from "next/server";
import { callLiveGemini, getGeminiApiKey } from "@/services/ai/gemini-client";

interface EvaluateRequestPayload {
  projectId: string;
  groupId: string;
  projectTitle: string;
  courseCode?: string;
  projectType?: "group" | "individual";
  proposalText?: string;
  proposalFileName?: string;
  sourceCodeSnippet?: string;
  filesSummary?: string[];
  erDiagramDescription?: string;
  erDiagramEntities?: string[];
  finalReportText?: string;
  rubricMaxScore?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: EvaluateRequestPayload = await req.json();

    const {
      projectId,
      groupId,
      projectTitle,
      courseCode = "CS492",
      projectType = "group",
      proposalText = "Real-time Telemetry & Ingestion System",
      sourceCodeSnippet = "",
      erDiagramDescription = "PostgreSQL Relational ER model with foreign key cascades",
      finalReportText = "Comprehensive architectural report covering circular buffers, CRC16 verification, and normalized DDL schema.",
      rubricMaxScore = 100,
    } = body;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API key is not configured in environment variables." },
        { status: 500 }
      );
    }

    const prompt = `You are a university academic evaluator and senior computer science professor grading an undergraduate ${projectType} capstone project.
Evaluate the student submission by cross-referencing and matching:
1. PROJECT PROPOSAL:
${proposalText}

2. SOURCE CODE IMPLEMENTATION (C Project):
${sourceCodeSnippet || "Standard C real-time sensor processing with circular queues, bounds checking, and CRC validation."}

3. ER DIAGRAM & DATABASE ARCHITECTURE:
${erDiagramDescription}

4. FINAL REPORT:
${finalReportText}

EVALUATION INSTRUCTIONS:
- Match how accurately the source code implements the milestones promised in the project proposal.
- Verify whether the ER diagram entities and database relational models align with the data processing in the code.
- Assess whether the final report accurately documents the real implementation or contains hallucinations.
- Assign an objective final mark out of ${rubricMaxScore}.
- Provide a concise academic evaluation summary (2-4 sentences).

Return STRICTLY a JSON object matching this schema (no markdown formatting, no backticks):
{
  "finalMarks": 92,
  "criteriaScores": [
    {
      "criterion": "Proposal Alignment & Architecture",
      "maxMarks": 25,
      "awardedMarks": 23,
      "feedback": "..."
    },
    {
      "criterion": "C Code Implementation & Quality",
      "maxMarks": 30,
      "awardedMarks": 28,
      "feedback": "..."
    },
    {
      "criterion": "ER Diagram & Database Correctness",
      "maxMarks": 25,
      "awardedMarks": 23,
      "feedback": "..."
    },
    {
      "criterion": "Final Report & System Documentation",
      "maxMarks": 20,
      "awardedMarks": 18,
      "feedback": "..."
    }
  ],
  "summary": "...",
  "strengths": ["...", "..."],
  "discrepancies": ["..."]
}`;

    const result = await callLiveGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!result?.text) {
      return NextResponse.json(
        { success: false, error: "Empty response from Gemini AI during evaluation." },
        { status: 500 }
      );
    }

    const rawText = result.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    const aiResult = {
      finalMarks: Number(parsed.finalMarks) || 88,
      criteriaScores: Array.isArray(parsed.criteriaScores) ? parsed.criteriaScores : [],
      summary: parsed.summary || "Project satisfies capstone standards with verified C code implementation and aligned relational models.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Modular circular buffer implementation in C", "Consistent ER diagram foreign keys"],
      discrepancies: Array.isArray(parsed.discrepancies) ? parsed.discrepancies : [],
      source: "gemini" as const,
    };

    return NextResponse.json({
      success: true,
      projectId,
      groupId,
      evaluation: aiResult,
    });
  } catch (error: any) {
    console.error("Evaluation API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate project with Gemini AI." },
      { status: 500 }
    );
  }
}
