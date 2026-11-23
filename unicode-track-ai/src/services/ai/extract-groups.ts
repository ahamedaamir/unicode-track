import { GoogleGenAI } from "@google/genai";
import { Student } from "@/types/admin";
import { ExtractedGroupData, ExtractedProjectData, GroupMember } from "@/types/project";

/**
 * Normalizes string for fuzzy/case-insensitive matching
 */
function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Attempts to match an extracted raw member against the registered student database
 */
export function matchStudent(
  rawName: string,
  rawId?: string,
  rawEmail?: string,
  registeredStudents: Student[] = []
): { matchedStudent: Student | null; matchType: "email" | "id" | "name" | null } {
  // 1. Try matching by email
  if (rawEmail) {
    const byEmail = registeredStudents.find(
      (s) => s.email.toLowerCase().trim() === rawEmail.toLowerCase().trim()
    );
    if (byEmail) return { matchedStudent: byEmail, matchType: "email" };
  }

  // 2. Try matching by student ID
  if (rawId) {
    const normalizedRawId = normalizeStr(rawId);
    const byId = registeredStudents.find(
      (s) => s.studentId && normalizeStr(s.studentId) === normalizedRawId
    );
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
 * Analyzes requirements document text using Google Gemini 2.5 Flash
 * and extracts structured project specification + groups with member rosters.
 */
export async function extractProjectAndGroupsWithGemini(
  content: string,
  registeredStudents: Student[] = []
): Promise<ExtractedProjectData> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (apiKey && !apiKey.includes("placeholder")) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an academic project extraction AI for university coursework.
Analyze the following academic project document or syllabus text and extract:
1. The project title
2. The project description and objectives
3. The course code (if mentioned)
4. All student groups and their assigned members.

IMPORTANT INSTRUCTIONS:
- Identify every group number (e.g. Group 1, Group 02, Team A).
- Extract each member's full name, and if mentioned, their Student ID and University Email.
- Do not invent names or details that are not in the text.
- Format the response as a single valid JSON object strictly adhering to this structure:
{
  "title": "string",
  "description": "string",
  "courseCode": "string",
  "groups": [
    {
      "groupNumber": 1,
      "groupName": "string",
      "members": [
        {
          "name": "string",
          "studentId": "string or empty",
          "email": "string or empty"
        }
      ]
    }
  ]
}

DOCUMENT TEXT:
${content}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (response && response.text) {
        // Strip code block markers if present
        let cleanJson = response.text.trim();
        if (cleanJson.startsWith("```json")) {
          cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsed = JSON.parse(cleanJson);
        return processExtractedJson(parsed, registeredStudents);
      }
    } catch (err) {
      console.warn("Gemini group extraction call failed, using deterministic extractor:", err);
    }
  }

  // Deterministic local extractor fallback
  return fallbackGroupExtractor(content, registeredStudents);
}

/**
 * Processes raw JSON from Gemini and cross-references against registered university students
 */
function processExtractedJson(
  data: any,
  registeredStudents: Student[]
): ExtractedProjectData {
  const title = data.title || "Academic Capstone Project";
  const description = data.description || "University course project specification.";
  const courseCode = data.courseCode || "";

  const groups: ExtractedGroupData[] = (data.groups || []).map((g: any, index: number) => {
    const groupNumber = g.groupNumber || index + 1;
    const groupName = g.groupName || `Group ${groupNumber < 10 ? `0${groupNumber}` : groupNumber}`;
    const rawMembers = g.members || [];

    const matchedMembers: GroupMember[] = [];
    const unresolvedMembers: { name: string; studentId?: string; email?: string; reason: string }[] = [];

    rawMembers.forEach((raw: any, memIdx: number) => {
      const { matchedStudent } = matchStudent(raw.name, raw.studentId, raw.email, registeredStudents);

      if (matchedStudent) {
        matchedMembers.push({
          studentId: matchedStudent.studentId || matchedStudent.id,
          fullName: matchedStudent.fullName,
          email: matchedStudent.email,
          department: matchedStudent.departmentId || "Computing",
          academicYear: matchedStudent.academicYear || 4,
          semester: matchedStudent.semester || 1,
          role: memIdx === 0 ? "Team Lead" : "Member",
          commitsCount: 0,
          avatar: matchedStudent.profilePhotoUrl,
        });
      } else {
        unresolvedMembers.push({
          name: raw.name || "Unknown Student",
          studentId: raw.studentId || "",
          email: raw.email || "",
          reason: "Student record not found in registered university database",
        });
      }
    });

    return {
      groupNumber,
      groupName,
      rawMembers,
      matchedMembers,
      unresolvedMembers,
    };
  });

  return {
    title,
    description,
    courseCode,
    groups,
  };
}

/**
 * Fallback deterministic extractor for offline demo and manual syllabus texts
 */
export function fallbackGroupExtractor(
  text: string,
  registeredStudents: Student[]
): ExtractedProjectData {
  // If text contains sample groups or is a new project brief:
  // We can intelligently parse text looking for lines like:
  // "Group 01:", "Group 1", "Team 1", bullet points with names
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let extractedTitle = "";
  let extractedDesc = "";
  const groups: ExtractedGroupData[] = [];
  let currentGroup: ExtractedGroupData | null = null;

  for (const line of lines) {
    if (!extractedTitle && (line.toLowerCase().startsWith("project:") || line.toLowerCase().startsWith("title:"))) {
      extractedTitle = line.replace(/^(project|title):\s*/i, "").trim();
      continue;
    }

    // Match group headers: Group 01, Group 1, Team A, etc.
    const groupMatch = line.match(/^(?:group|team)\s*([0-9a-zA-Z]+)(?:\s*[:\-])?(.*)$/i);
    if (groupMatch) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      const num = parseInt(groupMatch[1], 10) || groups.length + 1;
      const extraName = groupMatch[2]?.trim();
      currentGroup = {
        groupNumber: num,
        groupName: extraName ? `Group ${num}: ${extraName}` : `Group ${num < 10 ? `0${num}` : num}`,
        rawMembers: [],
        matchedMembers: [],
        unresolvedMembers: [],
      };
      continue;
    }

    // Match member line under current group
    if (currentGroup && (line.startsWith("-") || line.startsWith("*") || line.match(/^[0-9]+\./))) {
      const cleanMember = line.replace(/^[-*0-9.]+\s*/, "").trim();
      if (cleanMember) {
        currentGroup.rawMembers.push({ name: cleanMember });

        const { matchedStudent } = matchStudent(cleanMember, undefined, undefined, registeredStudents);
        if (matchedStudent) {
          currentGroup.matchedMembers.push({
            studentId: matchedStudent.studentId || matchedStudent.id,
            fullName: matchedStudent.fullName,
            email: matchedStudent.email,
            department: matchedStudent.departmentId || "Computing",
            academicYear: matchedStudent.academicYear || 4,
            semester: matchedStudent.semester || 1,
            role: currentGroup.matchedMembers.length === 0 ? "Team Lead" : "Member",
            commitsCount: 0,
            avatar: matchedStudent.profilePhotoUrl,
          });
        } else {
          currentGroup.unresolvedMembers.push({
            name: cleanMember,
            reason: "Student record not found in registered university database",
          });
        }
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  // If no explicit groups found in text, synthesize structured cohort groups from available students
  if (groups.length === 0 && registeredStudents.length > 0) {
    // Generate 2 sample cohort groups from registered students
    const chunkSize = 4;
    for (let i = 0; i < Math.min(registeredStudents.length, 8); i += chunkSize) {
      const cohort = registeredStudents.slice(i, i + chunkSize);
      const groupNum = Math.floor(i / chunkSize) + 1;
      groups.push({
        groupNumber: groupNum,
        groupName: `Group ${groupNum < 10 ? `0${groupNum}` : groupNum}`,
        rawMembers: cohort.map((s) => ({ name: s.fullName, studentId: s.studentId, email: s.email })),
        matchedMembers: cohort.map((s, idx) => ({
          studentId: s.studentId || s.id,
          fullName: s.fullName,
          email: s.email,
          department: s.departmentId || "Computing",
          academicYear: s.academicYear || 4,
          semester: s.semester || 1,
          role: idx === 0 ? "Team Lead" : "Member",
          commitsCount: 0,
          avatar: s.profilePhotoUrl,
        })),
        unresolvedMembers: [],
      });
    }
  }

  return {
    title: extractedTitle || "Extracted Course Project",
    description: extractedDesc || "Extracted from uploaded requirements specification document.",
    groups,
  };
}

