import { NextRequest, NextResponse } from "next/server";
import { extractProjectAndGroupsWithGemini } from "@/services/ai/extract-groups";
import { Student } from "@/types/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, registeredStudents = [] } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Document content or extracted text is required for AI group extraction." },
        { status: 400 }
      );
    }

    const result = await extractProjectAndGroupsWithGemini(
      content,
      registeredStudents as Student[]
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Group extraction API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during group extraction." },
      { status: 500 }
    );
  }
}

