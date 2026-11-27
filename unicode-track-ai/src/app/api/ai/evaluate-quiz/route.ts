import { NextRequest, NextResponse } from "next/server";
import { callLiveGemini, getGeminiApiKey } from "@/services/ai/gemini-client";

interface QuizQuestionItem {
  questionNumber: number;
  prompt: string;
  language?: string;
  maxMarks: number;
}

interface StudentAnswerItem {
  questionNumber: number;
  code: string;
}

interface StudentSubmissionItem {
  studentId: string;
  studentName: string;
  answers: StudentAnswerItem[];
}

interface EvaluateQuizPayload {
  quizTitle: string;
  topic: string;
  evaluationRequirements?: string;
  questions: QuizQuestionItem[];
  studentSubmissions: StudentSubmissionItem[];
}

export async function POST(req: NextRequest) {
  try {
    const body: EvaluateQuizPayload = await req.json();
    const {
      quizTitle = "Coding Practical Quiz",
      topic = "General Programming",
      evaluationRequirements = "Assess code logic, syntax correctness, and algorithmic approach.",
      questions = [],
      studentSubmissions = [],
    } = body;

    if (!questions.length || !studentSubmissions.length) {
      return NextResponse.json(
        { success: false, error: "Questions and student submissions are required for evaluation." },
        { status: 400 }
      );
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API key is not configured in environment variables." },
        { status: 500 }
      );
    }

    const prompt = `You are a university computer science professor and automated grading agent.
You are evaluating student coding quiz submissions for:
Quiz Title: "${quizTitle}"
Topic: "${topic}"

==================================================
LECTURER EVALUATION REQUIREMENTS (MANDATORY INSTRUCTIONS):
"""
${evaluationRequirements || "Evaluate based on code logic, correct patterns, and clean programming structure."}
"""
==================================================
CRITICAL: You MUST strictly adhere to the lecturer's evaluation requirements above.
For example, if the lecturer specified "dont need to produce accurate output, if patterns correct put marks", you must award marks for recognized architectural patterns, algorithms, and logical flow, and NOT penalize strictly for exact console output or minor typographical errors.

QUIZ QUESTIONS:
${questions
  .map(
    (q) =>
      `Q${q.questionNumber} (Max ${q.maxMarks} Marks, Language: ${q.language || "C"}):
Prompt: ${q.prompt}`
  )
  .join("\n\n")}

STUDENT SUBMISSIONS TO GRADE:
${studentSubmissions
  .map(
    (s, sIdx) => `
[STUDENT ${sIdx + 1}] ID: "${s.studentId}", Name: "${s.studentName}"
${s.answers
  .map(
    (a) => `Question ${a.questionNumber} Code Submission:
\`\`\`${questions.find((q) => q.questionNumber === a.questionNumber)?.language || "c"}
${a.code?.trim() || "// No code submitted"}
\`\`\``
  )
  .join("\n")}
`
  )
  .join("\n--------------------------------------------------\n")}

Respond ONLY with a valid, clean JSON object matching this EXACT JSON schema:
{
  "evaluations": [
    {
      "studentId": "student-id-here",
      "questionEvaluations": [
        {
          "questionNumber": 1,
          "awardedMarks": 5,
          "maxMarks": 5,
          "remarks": "Evaluation remark reflecting the lecturer's requirements",
          "modelAnswer": "Clean, complete, optimal reference code solution for this question"
        }
      ],
      "generalFeedback": "Comprehensive performance summary for this student",
      "totalScore": 18,
      "maxScore": 20
    }
  ]
}

Ensure "awardedMarks" is an integer or float between 0 and "maxMarks" for that question. Do NOT include markdown code fences or conversational text outside the JSON object.`;

    const result = await callLiveGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = result?.text?.trim() || "";
    const cleanJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!cleanJson) {
      return NextResponse.json(
        { success: false, error: "Empty or invalid response from Gemini AI during quiz evaluation." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(cleanJson);
    if (!parsed || !Array.isArray(parsed.evaluations) || parsed.evaluations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Gemini AI returned an unexpected response structure for quiz evaluation." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "gemini",
      evaluations: parsed.evaluations,
      evaluationRequirements,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during quiz evaluation with Gemini AI." },
      { status: 500 }
    );
  }
}
