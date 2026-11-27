import { NextRequest, NextResponse } from "next/server";
import { callLiveGemini, getGeminiApiKey } from "@/services/ai/gemini-client";
import { extractText } from "unpdf";

export const runtime = "nodejs";

const DEFAULT_STARTER_CODES: Record<string, string> = {
  c: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n// Write your C solution below\nint main() {\n    // Implementation logic here\n    return 0;\n}\n`,
  java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your Java solution below\n    }\n}\n`,
  python: `# Write your Python solution below\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()\n`,
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetLanguage = ((formData.get("language") as string) || "c").toLowerCase() as "c" | "java" | "python";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No PDF file provided. Please upload an exam or quiz PDF." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Only PDF (.pdf) documents are accepted." },
        { status: 400 }
      );
    }

    // 1. Extract plain text from PDF using unpdf
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let extractedText = "";
    let pageCount = 1;

    try {
      const uint8 = new Uint8Array(buffer);
      const res = await extractText(uint8, { mergePages: true });
      extractedText = (typeof res.text === "string" ? res.text : (res.text as string[])?.join("\n\n")) || "";
      pageCount = res.totalPages || 1;
    } catch (parseErr) {
      console.warn("[scan-quiz-pdf] unpdf text extraction error:", parseErr);
    }

    const cleanText = extractedText.trim();
    const apiKey = getGeminiApiKey();

    // 2. Call Google Gemini AI to analyze the PDF and align questions in order
    if (apiKey) {
      const prompt = `You are a university computer science examination processing agent.
Your task is to scan the following examination/quiz PDF text and extract all programming questions.
Align and order each question sequentially: Question 1, Question 2, Question 3, etc.

Target Programming Language: "${targetLanguage}"

==================================================
EXAM PDF CONTENT (${pageCount} page(s)):
"""
${cleanText.slice(0, 16000) || "Programming quiz questions assessment sheet"}
"""
==================================================

INSTRUCTIONS:
1. Identify the quiz/exam Title or Topic (e.g. "Arrays, Pointers and Memory Management").
2. Extract all distinct coding problems and practical questions.
3. Align them in exact sequential order: Question 1, Question 2, Question 3, etc.
4. For each question:
   - Provide the complete problem prompt with all requirements, instructions, and input/output descriptions in "prompt".
   - Extract the allocated marks (e.g., "(10 marks)" -> 10, or default to 10).
   - Set "language" to "${targetLanguage}".
   - Provide a clean, suitable starter code template in "${targetLanguage}".

Respond ONLY with a valid, clean JSON object matching this schema:
{
  "topic": "Detected Quiz Topic or Title",
  "questions": [
    {
      "questionNumber": 1,
      "prompt": "Detailed problem description from the PDF",
      "maxMarks": 10,
      "language": "${targetLanguage}",
      "starterCode": "Clean starter code template"
    }
  ]
}

Do NOT include markdown fences outside the JSON object.`;

      try {
        const result = await callLiveGemini({
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const rawJson = result?.text?.trim() || "";
        const cleanJson = rawJson
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        if (cleanJson) {
          const parsed = JSON.parse(cleanJson);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            // Sort questions in strict sequential order
            const orderedQuestions = parsed.questions.map((q: any, idx: number) => ({
              id: `q-scanned-${idx + 1}-${Date.now()}`,
              questionNumber: idx + 1,
              prompt: q.prompt || `Question ${idx + 1}`,
              maxMarks: Number(q.maxMarks) || 10,
              language: targetLanguage,
              starterCode: q.starterCode || DEFAULT_STARTER_CODES[targetLanguage] || DEFAULT_STARTER_CODES.c,
            }));

            return NextResponse.json({
              success: true,
              source: "gemini",
              modelUsed: result.model || "gemini-3.5-flash",
              topic: parsed.topic || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
              questions: orderedQuestions,
              pageCount,
              fileName: file.name,
            });
          }
        }
      } catch (geminiErr: any) {
        console.warn("[scan-quiz-pdf] Gemini API scan failed, falling back to heuristic alignment:", geminiErr?.message || geminiErr);
      }
    }

    // 3. Heuristic Fallback Parser if Gemini is unreachable or no API key
    const detectedTopic = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    const questions: any[] = [];

    // Split text by Question/Problem markers
    const regex = /(?:Question|Problem|Task|Q\.?)\s*(\d+)[:\.\-\s]+([\s\S]*?)(?=(?:Question|Problem|Task|Q\.?)\s*\d+[:\.\-\s]+|$)/gi;
    let match;
    let count = 0;

    while ((match = regex.exec(cleanText)) !== null && count < 10) {
      count++;
      const qNum = parseInt(match[1], 10) || count;
      const qText = match[2].trim();

      // Extract marks if present, e.g. "(10 marks)" or "[5 pts]"
      let maxMarks = 10;
      const marksMatch = qText.match(/(?:\[|\()(\d+)\s*(?:marks?|points?|pts?)(?:\]|\))/i);
      if (marksMatch) {
        maxMarks = parseInt(marksMatch[1], 10) || 10;
      }

      questions.push({
        id: `q-scanned-${count}-${Date.now()}`,
        questionNumber: count,
        prompt: qText.length > 10 ? qText : `Problem statement ${count} from ${file.name}`,
        maxMarks,
        language: targetLanguage,
        starterCode: DEFAULT_STARTER_CODES[targetLanguage] || DEFAULT_STARTER_CODES.c,
      });
    }

    // If regex found no structured split, treat whole text or paragraphs as questions
    if (questions.length === 0) {
      const paragraphs = cleanText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 30);

      const items = paragraphs.length > 0 ? paragraphs.slice(0, 4) : [cleanText || `Practical programming assessment from ${file.name}`];

      items.forEach((p, idx) => {
        questions.push({
          id: `q-scanned-${idx + 1}-${Date.now()}`,
          questionNumber: idx + 1,
          prompt: p,
          maxMarks: 10,
          language: targetLanguage,
          starterCode: DEFAULT_STARTER_CODES[targetLanguage] || DEFAULT_STARTER_CODES.c,
        });
      });
    }

    return NextResponse.json({
      success: true,
      source: "heuristic-parser",
      topic: detectedTopic,
      questions,
      pageCount,
      fileName: file.name,
    });
  } catch (err: any) {
    console.error("[scan-quiz-pdf] Global error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to scan and extract questions from the uploaded PDF." },
      { status: 500 }
    );
  }
}
