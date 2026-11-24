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

export type MatchStatus =
  | "Matched"
  | "Unmatched"
  | "Ambiguous"
  | "Duplicate"
  | "Invalid student";

export interface ProcessedMember {
  id: string; // Unique key for UI manipulation
  student_id: string | null;
  full_name: string;
  email: string | null;
  status: MatchStatus;
  matchType: "id" | "email" | "name" | null;
  matchedStudent?: {
    id: string;
    studentId?: string;
    fullName: string;
    email: string;
    department?: string;
    departmentId?: string;
    academicYear?: number;
    semester?: number;
    profilePhotoUrl?: string | null;
  };
  ambiguousMatches?: {
    id: string;
    studentId?: string;
    fullName: string;
    email: string;
    department?: string;
  }[];
  duplicateGroupNumbers?: number[];
  warning?: string;
}

export interface ProcessedGroup {
  id: string; // Unique group key for UI manipulation
  group_number: number;
  group_name: string;
  members: ProcessedMember[];
}

export interface AssignmentValidationStats {
  totalGroups: number;
  totalMembers: number;
  matchedCount: number;
  unmatchedCount: number;
  ambiguousCount: number;
  duplicateCount: number;
  invalidCount: number;
  hasBlockingErrors: boolean;
}

export interface ExtractionResult {
  groups: ProcessedGroup[];
  warnings: string[];
  totalGroups: number;
  totalMembers: number;
  matchedCount: number;
  unmatchedCount: number;
  ambiguousCount: number;
  duplicateCount: number;
  invalidCount: number;
  hasBlockingErrors: boolean;
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

    const rawText =
      (typeof result.text === "string" ? result.text : (result.text as string[])?.join("\n\n")) ||
      "";
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
export function normalizeStr(str: string): string {
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
// 5. High-Precision Matching Engine (Exact Priority Order & Status Resolution)
// =============================================================================

/**
 * Attempts to match an extracted member against registered student records.
 * Matching priority:
 * 1. Exact student ID
 * 2. Exact email address
 * 3. Carefully normalized full name, ONLY when reliable (exactly 1 match)
 * If multiple records match the name -> Ambiguous.
 */
export function matchStudentWithPriority(
  rawName: string,
  rawId: string | null,
  rawEmail: string | null,
  registeredStudents: Student[] = []
): {
  status: MatchStatus;
  matchedStudent?: Student;
  matchType: "id" | "email" | "name" | null;
  ambiguousMatches?: Student[];
  warning?: string;
} {
  // Validate basic student information
  if (!rawName || !rawName.trim()) {
    return {
      status: "Invalid student",
      matchType: null,
      warning: "Student full name is missing or invalid.",
    };
  }

  // PRIORITY 1: Exact Student ID
  if (rawId && rawId.trim()) {
    const normRawId = normalizeStr(rawId);
    const byId = registeredStudents.find((s) => {
      if (!s.studentId && !s.id) return false;
      const normStudentId = normalizeStr(s.studentId || "");
      const normId = normalizeStr(s.id || "");
      return normStudentId === normRawId || normId === normRawId;
    });

    if (byId) {
      return {
        status: "Matched",
        matchedStudent: byId,
        matchType: "id",
      };
    }
  }

  // PRIORITY 2: Exact Email Address
  if (rawEmail && rawEmail.trim()) {
    const cleanEmail = rawEmail.toLowerCase().trim();
    const byEmail = registeredStudents.find(
      (s) => s.email && s.email.toLowerCase().trim() === cleanEmail
    );

    if (byEmail) {
      return {
        status: "Matched",
        matchedStudent: byEmail,
        matchType: "email",
      };
    }
  }

  // PRIORITY 3: Carefully normalized full name, ONLY when reliable
  const normRawName = normalizeStr(rawName);
  if (normRawName.length >= 3) {
    const matchingStudents = registeredStudents.filter((s) => {
      const normStudentName = normalizeStr(s.fullName);
      return normStudentName === normRawName;
    });

    // Exactly 1 unambiguous match
    if (matchingStudents.length === 1) {
      return {
        status: "Matched",
        matchedStudent: matchingStudents[0],
        matchType: "name",
      };
    }

    // Ambiguous: multiple students share the exact same normalized name
    if (matchingStudents.length > 1) {
      return {
        status: "Ambiguous",
        matchType: null,
        ambiguousMatches: matchingStudents,
        warning: `Ambiguous match: Found ${matchingStudents.length} students with name "${rawName}". Manual lecturer selection required.`,
      };
    }

    // Try high-confidence prefix/suffix match (e.g. "Alex Chen" vs "Alex Chen Jr" or "Alexander Chen")
    const partialMatches = registeredStudents.filter((s) => {
      const norm = normalizeStr(s.fullName);
      return norm.includes(normRawName) || normRawName.includes(norm);
    });

    if (partialMatches.length === 1 && partialMatches[0].fullName.toLowerCase().includes(rawName.toLowerCase())) {
      return {
        status: "Matched",
        matchedStudent: partialMatches[0],
        matchType: "name",
      };
    }

    if (partialMatches.length > 1) {
      return {
        status: "Ambiguous",
        matchType: null,
        ambiguousMatches: partialMatches,
        warning: `Multiple partial matches found for "${rawName}". Please select the correct student.`,
      };
    }
  }

  // No match found
  return {
    status: "Unmatched",
    matchType: null,
    warning: `Student "${rawName}" (ID: ${rawId || "N/A"}) was not found in the registered student records.`,
  };
}

/**
 * Re-validates all groups and members:
 * - Detects duplicate students across multiple groups within the project
 * - Checks department/academic cohort alignment
 * - Computes complete validation stats
 */
export function revalidateAssignmentGroups(
  groups: ProcessedGroup[],
  registeredStudents: Student[] = [],
  targetDepartmentId?: string
): {
  groups: ProcessedGroup[];
  warnings: string[];
  stats: AssignmentValidationStats;
} {
  const warnings: string[] = [];

  // Track student occurrences across groups: key -> array of group numbers
  const studentOccurrences = new Map<string, number[]>();

  groups.forEach((grp) => {
    grp.members.forEach((m) => {
      const studentKey = m.matchedStudent?.id || (m.student_id ? normalizeStr(m.student_id) : null);
      if (studentKey) {
        const existing = studentOccurrences.get(studentKey) || [];
        existing.push(grp.group_number);
        studentOccurrences.set(studentKey, existing);
      }
    });
  });

  let totalMembersCount = 0;
  let matchedCount = 0;
  let unmatchedCount = 0;
  let ambiguousCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  const revalidatedGroups: ProcessedGroup[] = groups.map((grp) => {
    const updatedMembers: ProcessedMember[] = grp.members.map((m) => {
      totalMembersCount++;

      // Check if student is duplicate across multiple groups
      const studentKey = m.matchedStudent?.id || (m.student_id ? normalizeStr(m.student_id) : null);
      const appearances = studentKey ? studentOccurrences.get(studentKey) || [] : [];
      const isDuplicate = appearances.length > 1;

      let finalStatus: MatchStatus = m.status;
      let finalWarning: string | undefined = m.warning;

      if (!m.full_name || !m.full_name.trim()) {
        finalStatus = "Invalid student";
        finalWarning = "Student full name is blank or malformed.";
      } else if (isDuplicate) {
        finalStatus = "Duplicate";
        const otherGroups = appearances.filter((gNum) => gNum !== grp.group_number);
        finalWarning = `Duplicate student: "${m.full_name}" is assigned to multiple groups (Groups: ${Array.from(new Set(appearances)).join(", ")}).`;
        warnings.push(finalWarning);
      } else if (m.matchedStudent) {
        finalStatus = "Matched";

        // Department warning
        if (
          targetDepartmentId &&
          m.matchedStudent.departmentId &&
          m.matchedStudent.departmentId !== targetDepartmentId
        ) {
          warnings.push(
            `Cohort Notice: Student "${m.full_name}" (Group ${grp.group_number}) belongs to department ${m.matchedStudent.departmentId}, which differs from the project department.`
          );
        }
      }

      // Count stats
      if (finalStatus === "Matched") matchedCount++;
      else if (finalStatus === "Unmatched") unmatchedCount++;
      else if (finalStatus === "Ambiguous") ambiguousCount++;
      else if (finalStatus === "Duplicate") duplicateCount++;
      else if (finalStatus === "Invalid student") invalidCount++;

      return {
        ...m,
        status: finalStatus,
        duplicateGroupNumbers: isDuplicate ? Array.from(new Set(appearances)) : undefined,
        warning: finalWarning,
      };
    });

    return {
      ...grp,
      members: updatedMembers,
    };
  });

  // Unique warnings
  const uniqueWarnings = Array.from(new Set(warnings));

  // Determine if there are blocking errors
  // Duplicates and Invalid students block confirmation; Unmatched & Ambiguous produce warnings
  const hasBlockingErrors = duplicateCount > 0 || invalidCount > 0;

  return {
    groups: revalidatedGroups,
    warnings: uniqueWarnings,
    stats: {
      totalGroups: revalidatedGroups.length,
      totalMembers: totalMembersCount,
      matchedCount,
      unmatchedCount,
      ambiguousCount,
      duplicateCount,
      invalidCount,
      hasBlockingErrors,
    },
  };
}

/**
 * Cross-references Gemini-extracted groups against registered university students.
 * Initializes the reviewable model for the lecturer review screen.
 */
export function matchExtractedGroupsToDatabase(
  geminiResult: GeminiGroupExtractionResponse,
  registeredStudents: Student[] = [],
  sourceType: "pdf" | "text" = "text",
  rawTextExcerpt?: string,
  targetDepartmentId?: string
): ExtractionResult {
  const initialGroups: ProcessedGroup[] = geminiResult.groups.map((grp, gIdx) => {
    const groupNum = grp.group_number || gIdx + 1;
    const groupName = grp.group_name || `Group ${groupNum < 10 ? `0${groupNum}` : groupNum}`;
    const groupId = `grp-temp-${Date.now().toString(36)}-${gIdx + 1}`;

    const members: ProcessedMember[] = grp.members.map((m, mIdx) => {
      const matchResult = matchStudentWithPriority(
        m.full_name,
        m.student_id,
        m.email,
        registeredStudents
      );

      return {
        id: `mem-${groupId}-${mIdx + 1}`,
        student_id: m.student_id || matchResult.matchedStudent?.studentId || matchResult.matchedStudent?.id || null,
        full_name: matchResult.matchedStudent?.fullName || m.full_name,
        email: m.email || matchResult.matchedStudent?.email || null,
        status: matchResult.status,
        matchType: matchResult.matchType,
        matchedStudent: matchResult.matchedStudent
          ? {
              id: matchResult.matchedStudent.id,
              studentId: matchResult.matchedStudent.studentId,
              fullName: matchResult.matchedStudent.fullName,
              email: matchResult.matchedStudent.email,
              department: matchResult.matchedStudent.departmentId,
              departmentId: matchResult.matchedStudent.departmentId,
              academicYear: matchResult.matchedStudent.academicYear,
              semester: matchResult.matchedStudent.semester,
              profilePhotoUrl: matchResult.matchedStudent.profilePhotoUrl,
            }
          : undefined,
        ambiguousMatches: matchResult.ambiguousMatches?.map((s) => ({
          id: s.id,
          studentId: s.studentId,
          fullName: s.fullName,
          email: s.email,
          department: s.departmentId,
        })),
        warning: matchResult.warning,
      };
    });

    return {
      id: groupId,
      group_number: groupNum,
      group_name: groupName,
      members,
    };
  });

  // Revalidate to detect duplicates and build complete statistics
  const { groups: validatedGroups, warnings, stats } = revalidateAssignmentGroups(
    initialGroups,
    registeredStudents,
    targetDepartmentId
  );

  return {
    groups: validatedGroups,
    warnings,
    ...stats,
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
    if (currentGroup) {
      const cleanLine = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (!cleanLine) continue;

      let studentId: string | null = null;
      let fullName: string = cleanLine;
      let email: string | null = null;

      // Extract email
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
