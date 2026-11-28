import { NextRequest, NextResponse } from "next/server";
import { callLiveGemini, getGeminiApiKey } from "@/services/ai/gemini-client";

/**
 * Server-Side AI Project Summary API with Multilingual Support (English, Sinhala, Tamil)
 * POST /api/ai/project-summary
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text = "",
      title = "Academic Project",
      language = "en",
    }: {
      text: string;
      title?: string;
      language?: "en" | "si" | "ta";
    } = body;

    const cleanText = text.trim();
    const cleanTitle = title.trim();

    // 1. Check if Gemini API key is available
    const apiKey = getGeminiApiKey();

    if (apiKey && cleanText) {
      try {
        let promptLanguageInstruction = "";

        if (language === "si") {
          promptLanguageInstruction = `ඔබ විශ්වවිද්‍යාල අධ්‍යයන සහායක AI කෙනෙකි. පහත දැක්වෙන විශ්වවිද්‍යාල අධ්‍යයන ව්‍යාපෘති විස්තරය සහ අවශ්‍යතා ශ්‍රී ලංකාවේ විශ්වවිද්‍යාල සිසුන්ට පහසුවෙන් තේරුම් ගත හැකි වන පරිදි ස්වාභාවික, නිවැරදි සිංහල භාෂාවෙන් (Sinhala) පැහැදිලිව සාරාංශගත කරන්න.
පහත ආකෘතිය අනුව ලියන්න:
📌 **ව්‍යාපෘති දළ විශ්ලේෂණය**
🎯 **ප්‍රධාන අරමුණු සහ අවශ්‍යතා**
📦 **භාරදිය යුතු ප්‍රධාන ප්‍රතිඵල** (GitHub කේත ගබඩාව, වාර්තා ආදිය)`;
        } else if (language === "ta") {
          promptLanguageInstruction = `நீங்கள் ஒரு பல்கலைக்கழக கல்வி உதவியாளர் AI ஆவீர்கள். கீழே கொடுக்கப்பட்டுள்ள பல்கலைக்கழக கல்வித் திட்ட விவரக்குறிப்புகள் மற்றும் தேவைகளை மாணவர்கள் எளிதாகப் புரிந்து கொள்ளும் வகையில் இயல்பான, தெளிவான தமிழ் மொழியில் (Tamil) சுருக்கமாகக் கூறவும்.
பின்வரும் கட்டமைப்பில் எழுதவும்:
📌 **திட்டத்தின் கண்ணோட்டம்**
🎯 **முக்கிய நோக்கங்கள் மற்றும் தேவைகள்**
📦 **சமர்ப்பிக்க வேண்டியவை** (GitHub களஞ்சியம், அறிக்கைகள் போன்றவை)`;
        } else {
          promptLanguageInstruction = `You are an academic university project assistant AI. Summarize the following university project specifications and requirements into a clear, high-yield, structured summary in English for undergraduate students.
Format with:
📌 **Project Overview**
🎯 **Key Objectives & Functional Scope**
📦 **Mandatory Deliverables** (Repository, documentation, reports)`;
        }

        const prompt = `${promptLanguageInstruction}

PROJECT TITLE:
${cleanTitle}

PROJECT SPECIFICATIONS & REQUIREMENTS:
${cleanText}

Guidelines:
- Keep the summary informative, clean, and concise (under 250 words).
- Do not mention internal mark percentages or grading criteria weights.
- Focus purely on what the students must build, achieve, and submit.
- Return only the structured summary markdown.`;

        const result = await callLiveGemini({
          contents: prompt,
        });

        if (result && result.text && result.text.trim()) {
          return NextResponse.json({
            success: true,
            summary: result.text.trim(),
            language,
            source: "gemini",
          });
        }
      } catch (err: any) {
        console.warn("Gemini live summary error, switching to multilingual fallback:", err?.message);
      }
    }

    // 2. Multilingual Fallback
    let fallbackSummary = "";

    if (language === "si") {
      fallbackSummary = `📌 **ව්‍යාපෘති දළ විශ්ලේෂණය**
මෙම අධ්‍යයන ව්‍යාපෘතිය "${cleanTitle}" මගින් සිසුන්ගේ ප්‍රායෝගික ක්‍රමලේඛන, පද්ධති නිර්මාණ සහ මෘදුකාංග ඉංජිනේරු කුසලතා වර්ධනය කිරීම අරමුණු කරයි.

🎯 **ප්‍රධාන අරමුණු සහ අවශ්‍යතා**
• පාඨමාලා අවශ්‍යතා අනුව නියමිත කාලසීමාවට පෙර මූලික මොඩියුල සැලසුම් කිරීම සහ ක්‍රියාත්මක කිරීම.
• ආරක්ෂිත, පිරිසිදු හා කාර්යක්ෂම කේතකරණ ප්‍රමිතීන් (Clean Code Standards) අනුගමනය කිරීම.
• දත්ත සමුදාය, පද්ධති නිර්මාණය (Architecture) සහ සම්බන්ධතා නියමිත පරිදි සම්පූර්ණ කිරීම.

📦 **භාරදිය යුතු ප්‍රධාන ප්‍රතිඵල**
• GitHub කේත ගබඩාව (Source Code Repository) සහ ප්‍රධාන ශාඛා ක්‍රියාකාරී කේතය.
• ව්‍යාපෘති යෝජනාවලිය (Proposal), ER සටහන සහ අවසාන ව්‍යාපෘති වාර්තාව (අධ්‍යක්ෂකවරයා විසින් ඉල්ලා ඇති පරිදි).`;
    } else if (language === "ta") {
      fallbackSummary = `📌 **திட்டத்தின் கண்ணோட்டம்**
"${cleanTitle}" என்ற இக்கல்வித் திட்டம் மாணவர்களின் நடைமுறை நிரலாக்கம், கணினி கட்டமைப்பு மற்றும் மென்பொருள் பொறியியல் திறன்களை மேம்படுத்துவதை நோக்கமாகக் கொண்டுள்ளது.

🎯 **முக்கிய நோக்கங்கள் மற்றும் தேவைகள்**
• பாடத்திட்ட தேவைகளுக்கு ஏற்ப உரிய காலத்திற்குள் முக்கிய செயல்பாட்டுத் தொகுதிகளை உருவாக்குதல்.
• பாதுகாப்பான, ஒழுங்கமைக்கப்பட்ட மற்றும் திறமையான குறியீட்டுத் தரங்களைப் பின்பற்றுதல்.
• தரவுத்தள வடிவமைப்பு, கணினி மாதிரி மற்றும் உறவுகளைச் சரியாக நிறைவு செய்தல்.

📦 **சமர்ப்பிக்க வேண்டியவை**
• GitHub மூலக் குறியீட்டுக் களஞ்சியம் (Source Code Repository) மற்றும் தொடர் பதிவுகள்.
• திட்ட முன்மொழிவு, ER வரைபடம் மற்றும் இறுதித் திட்ட அறிக்கை (விரிவுரையாளரால் கோரப்பட்டவாறு).`;
    } else {
      fallbackSummary = `📌 **Project Overview**
The "${cleanTitle}" coursework project focuses on building, testing, and demonstrating core software engineering and system architecture competencies.

🎯 **Key Objectives & Functional Scope**
• Design and implement the primary functional modules according to the course milestones and deadline.
• Adhere to clean code conventions, memory bounds safety, and proper error handling.
• Ensure relational database normalization and architectural constraints are properly satisfied.

📦 **Mandatory Deliverables**
• GitHub repository with commit history, active branches, and reproducible build scripts.
• Milestone documentation including project proposal, ER diagram schema, and comprehensive final report.`;
    }

    return NextResponse.json({
      success: true,
      summary: fallbackSummary,
      language,
      source: "fallback",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate project summary." },
      { status: 500 }
    );
  }
}
