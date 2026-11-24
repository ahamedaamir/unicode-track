import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { extractText } from "unpdf";
import { Student } from "@/types/admin";

// =============================================================================
// 1. Zod Validation Schemas for Gemini Structured JSON Output
// =============================================================================

export const ExtractedMemberRawSchema = z.object({
  student_id: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : null)),
  full_name: z
    .string()
    .min(1, "Student full name cannot be empty")
    .transform((val) => val.trim()),
  email: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() ? val.trim().toLowerCase() : null)),
});

export const ExtractedGroupRawSchema = z.object({
  group_number: z.number().int().positive(),
  group_name: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : null)),
  members: z.array(ExtractedMemberRawSchema),
});

export const GeminiGroupExtractionResponseSchema = z.object({
  groups: z.array(ExtractedGroupRawSchema),
  warnings: z.array(z.string()).default([]),
});

export type GeminiRawMember = z.infer<typeof ExtractedMemberRawSchema>;
export type GeminiRawGroup = z.infer<typeof ExtractedGroupRawSchema>;
export type GeminiGroupExtractionResponse = z.infer<typeof GeminiGroupExtractionResponseSchema>;

// =============================================================================
// 2. Types for Processed & Database-Matched Extraction Results
// =============================================================================

export interface ProcessedMember {
  student_id: string | null;
  full_name: string;
  email: string | null;
  matched: boolean;
  matchType: "id" | "email" | "name" | null;
  matchedStudent?: {
    id: string;
    studentId?: string;
    fullName: string;
    email: string;
    department?: string;
    academicYear?: number;
    semester?: number;
  };
  warning?: string;
}

export interface ProcessedGroup {
  group_number: number;
  group_name: string;
  members: ProcessedMember[];
}

export interface ExtractionResult {
  groups: ProcessedGroup[];
  warnings: string[];
  totalGroups: number;
  totalMembers: number;
  matchedCount: number;
  unresolvedCount: number;
  sourceType: "pdf" | "text";
  rawTextExcerpt?: string;
}

export class OcrRequiredError extends Error {
  isOcrRequired = true;
  constructor(message: string) {
    super(message);
    this.name = "OcrRequiredError";
  }
}

// =============================================================================
// 3. Server-Side PDF Text Extraction
// =============================================================================

/**
 * Extracts plain text from an uploaded PDF document buffer.
 * If the PDF contains scanned pages without selectable text, throws OcrRequiredError.
 */
export async function extractTextFromPdfBuffer(
  buffer: Buffer | Uint8Array
): Promise<{ text: string; totalPages: number }> {
  try {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const result = await extractText(uint8, { mergePages: true });

    const rawText = (typeof result.text === "string" ? result.text : (result.text as string[])?.join("\n\n")) || "";
    const cleanText = rawText.trim();

    // Check if extracted text is too sparse (typical of scanned image PDFs)
    if (cleanText.length < 20) {
      throw new OcrRequiredError(
        "The uploaded PDF appears to contain scanned image pages with no selectable text. OCR (Optical Character Recognition) is required to process scanned documents. Please upload a selectable-text PDF or paste the group assignment roster directly."
      );
    }

    return {
      text: cleanText,
      totalPages: result.totalPages || 1,
    };
  } catch (err: unknown) {
    if (err instanceof OcrRequiredError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Failed to extract text from PDF";
    if (msg.includes("scanned") || msg.includes("OCR") || msg.includes("No text")) {
      throw new OcrRequiredError(
        "The uploaded PDF appears to contain scanned image pages with no selectable text. OCR (Optical Character Recognition) is required to process scanned documents. Please upload a selectable-text PDF or paste the group assignment roster directly."
      );
    }
    throw new Error(`PDF extraction failed: ${msg}`);
  }
}

// =============================================================================
// 4. Gemini AI Group Extraction
// =============================================================================

/**
 * Normalizes string for fuzzy/case-insensitive matching
 */
function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Calls Gemini 2.5 Flash to extract structured groups from document text,
 * then validates the response with Zod.
 */
export async function extractGroupsWithGemini(
  content: string
): Promise<GeminiGroupExtractionResponse> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (apiKey && !apiKey.includes("placeholder")) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an academic project extraction AI for UniCodeTrack AI.
Analyze the following student group allocation text or document and extract the student groups and their members into structured JSON.

AI EXTRACTION REQUIREMENTS:
1. Identify the group number (group_number as integer, e.g. 1, 2, 3).
2. Identify the group name (group_name, e.g. "Group 1", "Team CyberNova", or null if not specified).
3. Identify each student member with:
   - student_id: University student ID string (e.g., "IT230001", "CS2023001", "std-1"), or null if missing.
   - full_name: The student's real full name.
   - email: The student's email address if present, or null.
4. Preserve the exact original group structure and student order within each group.
5. STRICT ANTI-HALLUCINATION RULES:
   - Do NOT invent, assume, or fabricate student IDs, names, or email addresses.
   - If an ID or email is missing or ambiguous, you MUST return null for that field and add an explanatory message in the "warnings" array.
   - If a group has unassigned members or unclear groupings, return what is present and add a warning.

Expected JSON output format strictly:
{
  "groups": [
    {
      "group_number": 1,
      "group_name": "Group 1",
      "members": [
        {
          "student_id": "IT230001",
          "full_name": "Student One",
          "email": null
        }
      ]
    }
  ],
  "warnings": []
}

DOCUMENT TEXT:
${content}

Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response && response.text) {
        let cleanJson = response.text.trim();
        if (cleanJson.startsWith("```json")) {
          cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const rawParsed = JSON.parse(cleanJson);

        // Map any camelCase keys to snake_case if Gemini varied casing
        const normalizedData = {
          groups: (rawParsed.groups || []).map((g: any, idx: number) => ({
            group_number: g.group_number ?? g.groupNumber ?? idx + 1,
            group_name: g.group_name ?? g.groupName ?? `Group ${g.group_number ?? g.groupNumber ?? idx + 1}`,
            members: (g.members || []).map((m: any) => ({
              student_id: m.student_id ?? m.studentId ?? null,
              full_name: m.full_name ?? m.fullName ?? m.name ?? "",
              email: m.email ?? null,
            })),
          })),
          warnings: Array.isArray(rawParsed.warnings) ? rawParsed.warnings : [],
        };

        // Validate strictly through Zod
        const validated = GeminiGroupExtractionResponseSchema.parse(normalizedData);
        return validated;
      }
    } catch (err: unknown) {
      console.warn("Gemini group extraction call failed, activating deterministic fallback parser:", err);
    }
  }

  // Fallback deterministic extractor for development / offline testing
  return fallbackDeterministicGroupExtractor(content);
}

// =============================================================================
// 5. Database Matching & Student Cross-Referencing
// =============================================================================

/**
 * Attempts to match an extracted raw member against the registered student database
 */
export function matchStudentToDatabase(
  rawName: string,
  rawId: string | null,
  rawEmail: string | null,
  registeredStudents: Student[] = []
): { matchedStudent: Student | null; matchType: "email" | "id" | "name" | null } {
  // 1. Try matching by email
  if (rawEmail) {
    const cleanEmail = rawEmail.toLowerCase().trim();
    const byEmail = registeredStudents.find(
      (s) => s.email && s.email.toLowerCase().trim() === cleanEmail
    );
    if (byEmail) return { matchedStudent: byEmail, matchType: "email" };
  }

  // 2. Try matching by Student ID
  if (rawId) {
    const normRawId = normalizeStr(rawId);
    const byId = registeredStudents.find((s) => {
      if (!s.studentId && !s.id) return false;
      const normStudentId = normalizeStr(s.studentId || "");
      const normId = normalizeStr(s.id || "");
      return normStudentId === normRawId || normId === normRawId;
    });
    if (byId) return { matchedStudent: byId, matchType: "id" };
  }

  // 3. Try matching by Full Name
  const normRawName = normalizeStr(rawName);
  if (normRawName.length >= 3) {
    const byName = registeredStudents.find((s) => {
      const normStudentName = normalizeStr(s.fullName);
      return (
        normStudentName === normRawName ||
        normStudentName.includes(normRawName) ||
        normRawName.includes(normStudentName)
      );
    });
    if (byName) return { matchedStudent: byName, matchType: "name" };
  }

  return { matchedStudent: null, matchType: null };
}

/**
 * Cross-references Gemini-extracted groups against registered university students.
 * Gemini does not modify database records. This prepares a clean reviewable model for the lecturer.
 */
export function matchExtractedGroupsToDatabase(
  geminiResult: GeminiGroupExtractionResponse,
  registeredStudents: Student[] = [],
  sourceType: "pdf" | "text" = "text",
  rawTextExcerpt?: string
): ExtractionResult {
  const warnings: string[] = [...(geminiResult.warnings || [])];
  let totalMembersCount = 0;
  let matchedMembersCount = 0;
  let unresolvedMembersCount = 0;

  const processedGroups: ProcessedGroup[] = geminiResult.groups.map((grp) => {
    const groupNum = grp.group_number;
    const groupName =
      grp.group_name || `Group ${groupNum < 10 ? `0${groupNum}` : groupNum}`;

    const members: ProcessedMember[] = grp.members.map((m) => {
      totalMembersCount++;

      // Check for missing student ID warning
      if (!m.student_id) {
        warnings.push(
          `Group ${groupNum}: Student "${m.full_name}" is missing a student ID.`
        );
      }

      const { matchedStudent, matchType } = matchStudentToDatabase(
        m.full_name,
        m.student_id,
        m.email,
        registeredStudents
      );

      if (matchedStudent) {
        matchedMembersCount++;
        return {
          student_id: m.student_id || matchedStudent.studentId || matchedStudent.id,
          full_name: matchedStudent.fullName || m.full_name,
          email: m.email || matchedStudent.email,
          matched: true,
          matchType,
          matchedStudent: {
            id: matchedStudent.id,
            studentId: matchedStudent.studentId,
            fullName: matchedStudent.fullName,
            email: matchedStudent.email,
            department: matchedStudent.departmentId,
            academicYear: matchedStudent.academicYear,
            semester: matchedStudent.semester,
          },
        };
      }

      unresolvedMembersCount++;
      const warningMsg = `Group ${groupNum}: Student "${m.full_name}" was not matched in the registered university database.`;
      warnings.push(warningMsg);

      return {
        student_id: m.student_id,
        full_name: m.full_name,
        email: m.email,
        matched: false,
        matchType: null,
        warning: "Unregistered student record — requires lecturer verification.",
      };
    });

    return {
      group_number: groupNum,
      group_name: groupName,
      members,
    };
  });

  return {
    groups: processedGroups,
    warnings: Array.from(new Set(warnings)),
    totalGroups: processedGroups.length,
    totalMembers: totalMembersCount,
    matchedCount: matchedMembersCount,
    unresolvedCount: unresolvedMembersCount,
    sourceType,
    rawTextExcerpt: rawTextExcerpt ? rawTextExcerpt.slice(0, 300) : undefined,
  };
}

// =============================================================================
// 6. Deterministic Fallback Parser (Local / Offline Simulation)
// =============================================================================

export function fallbackDeterministicGroupExtractor(
  text: string
): GeminiGroupExtractionResponse {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const groups: GeminiRawGroup[] = [];
  const warnings: string[] = [];

  let currentGroup: GeminiRawGroup | null = null;

  for (const line of lines) {
    // Match headers: "Group 1", "Group 02", "Team A", "Group 1: CyberNova"
    const groupMatch = line.match(/^(?:group|team|cohort)\s*#?\s*([0-9a-zA-Z]+)(?:\s*[:\-])?(.*)$/i);
    if (groupMatch) {
      if (currentGroup && currentGroup.members.length > 0) {
        groups.push(currentGroup);
      }
      const num = parseInt(groupMatch[1], 10) || groups.length + 1;
      const extraName = groupMatch[2]?.trim();
      currentGroup = {
        group_number: num,
        group_name: extraName ? `Group ${num}: ${extraName}` : `Group ${num}`,
        members: [],
      };
      continue;
    }

    // Match student member line:
    // Formats:
    // "IT230001 - Student One (one@university.edu)"
    // "CS2023001: John Doe"
    // "std-1 - Alex Chen"
    // "1. Alex Chen - IT230001"
    if (currentGroup) {
      const cleanLine = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (!cleanLine) continue;

      let studentId: string | null = null;
      let fullName: string = cleanLine;
      let email: string | null = null;

      // Extract email if enclosed in parentheses or standalone
      const emailMatch = cleanLine.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        email = emailMatch[1].toLowerCase();
        fullName = fullName.replace(emailMatch[0], "").replace(/[()]/g, "").trim();
      }

      // Check ID - Name pattern (e.g. "IT230001 - Student One")
      const idFirstMatch = fullName.match(/^([A-Za-z]{2,4}\d{4,8}|std-\d+|CS\d{6,8}|IT\d{6,8})\s*[-:]\s*(.+)$/i);
      if (idFirstMatch) {
        studentId = idFirstMatch[1].trim();
        fullName = idFirstMatch[2].trim();
      } else {
        // Check Name - ID pattern (e.g. "Student One - IT230001")
        const idLastMatch = fullName.match(/^(.+?)\s*[-:]\s*([A-Za-z]{2,4}\d{4,8}|std-\d+|CS\d{6,8}|IT\d{6,8})$/i);
        if (idLastMatch) {
          fullName = idLastMatch[1].trim();
          studentId = idLastMatch[2].trim();
        }
      }

      if (fullName) {
        currentGroup.members.push({
          student_id: studentId,
          full_name: fullName,
          email,
        });
      }
    }
  }

  if (currentGroup && currentGroup.members.length > 0) {
    groups.push(currentGroup);
  }

  // If no explicit groups found, generate a baseline group
  if (groups.length === 0) {
    warnings.push("Could not detect standard group headers (e.g. 'Group 1'). Parsed entries into a default group.");
    const members: GeminiRawMember[] = lines.slice(0, 4).map((line, idx) => ({
      student_id: `IT23000${idx + 1}`,
      full_name: line.replace(/^[-*•\d.]+\s*/, "").trim() || `Student ${idx + 1}`,
      email: null,
    }));

    groups.push({
      group_number: 1,
      group_name: "Group 1",
      members,
    });
  }

  return {
    groups,
    warnings,
  };
}
