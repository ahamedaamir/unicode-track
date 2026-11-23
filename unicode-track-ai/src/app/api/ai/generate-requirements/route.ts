import { NextRequest, NextResponse } from "next/server";
import { generateProjectRequirements } from "@/services/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, topic, difficulty, technologies, teamSize, courseCode, department, projectType } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Project idea prompt is required." },
        { status: 400 }
      );
    }

    const result = await generateProjectRequirements({
      prompt: prompt.trim(),
      topic: topic ? String(topic).trim() : undefined,
      difficulty: difficulty ? String(difficulty).trim() : "Intermediate",
      technologies: technologies ? String(technologies).trim() : undefined,
      teamSize: teamSize ? String(teamSize).trim() : undefined,
      courseCode: courseCode ? String(courseCode).trim() : undefined,
      department: department ? String(department).trim() : undefined,
      projectType: projectType ? String(projectType).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      requirements: result.text,
      source: result.source,
    });
  } catch (error) {
    console.error("Error in generate-requirements API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate project requirements. Please try again.",
      },
      { status: 500 }
    );
  }
}

