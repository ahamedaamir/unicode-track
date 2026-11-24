import { NextRequest, NextResponse } from "next/server";
import {
  extractTextFromPdfBuffer,
  extractGroupsWithGemini,
  matchExtractedGroupsToDatabase,
  OcrRequiredError,
} from "@/services/ai/extract-groups";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Student } from "@/types/admin";

/**
 * Server-Side Secure API for Gemini Group Extraction
 * POST /api/ai/extract-groups
 *
 * Workflow:
 * 1. Accepts uploaded PDF or raw assignment text
 * 2. Extracts document text (throws OcrRequiredError for scanned/image PDFs)
 * 3. Gemini 2.5 Flash analyzes the text and extracts structured groups
 * 4. Zod validates the schema
 * 5. Matches students against university database
 * 6. Returns reviewable preview to the lecturer (NO database modifications)
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let rawText = "";
    let sourceType: "pdf" | "text" = "text";
    let clientStudents: Student[] = [];

    // =========================================================================
    // 1. INPUT PROCESSING: MULTIPART (Direct PDF Upload) vs JSON (Pasted Text or Storage Ref)
    // =========================================================================
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const textParam = (formData.get("text") as string) || "";
      const studentsParam = (formData.get("registeredStudents") as string) || "";

      if (studentsParam) {
        try {
          clientStudents = JSON.parse(studentsParam);
        } catch {
          // ignore parsing error
        }
      }

      if (file) {
        sourceType = "pdf";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { text } = await extractTextFromPdfBuffer(buffer);
        rawText = text;
      } else if (textParam && textParam.trim()) {
        sourceType = "text";
        rawText = textParam.trim();
      } else {
        return NextResponse.json(
          { success: false, error: "Please provide either a PDF file or assignment text." },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      const { text, content, filePath, registeredStudents } = body;

      if (Array.isArray(registeredStudents)) {
        clientStudents = registeredStudents;
      }

      if (filePath) {
        // Download PDF from private Supabase Storage bucket
        sourceType = "pdf";
        if (isSupabaseConfigured()) {
          const supabase = createAdminClient() || createClient();
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("group-assignments")
            .download(filePath);

          if (downloadError || !fileData) {
            return NextResponse.json(
              {
                success: false,
                error: `Failed to download assignment document from storage: ${downloadError?.message || "File not found"}`,
              },
              { status: 404 }
            );
          }

          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const { text } = await extractTextFromPdfBuffer(buffer);
          rawText = text;
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Supabase storage is not configured to retrieve stored document.",
            },
            { status: 500 }
          );
        }
      } else if (text || content) {
        sourceType = "text";
        rawText = ((text || content) as string).trim();
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Group assignment document content, text, or file reference is required.",
          },
          { status: 400 }
        );
      }
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Extracted document text is empty. Please verify the document or paste text directly.",
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // 2. QUERY REGISTERED STUDENTS FROM DATABASE (Supabase)
    // =========================================================================
    const registeredStudentsMap = new Map<string, Student>();

    // Add any client-provided students first
    clientStudents.forEach((s) => {
      if (s.id || s.email) registeredStudentsMap.set(s.id || s.email, s);
    });

    // Query live students from Supabase database if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient() || createClient();
        const { data: dbStudents } = await supabase
          .from("students")
          .select("id, student_id, full_name, email, department_id, academic_year, semester, profile_photo_url, account_status");

        if (dbStudents && Array.isArray(dbStudents)) {
          dbStudents.forEach((row: any) => {
            const mapped: Student = {
              id: row.id,
              studentId: row.student_id || row.id,
              fullName: row.full_name,
              email: row.email,
              departmentId: row.department_id || "Computing",
              academicYear: row.academic_year || 1,
              semester: row.semester || 1,
              profilePhotoUrl: row.profile_photo_url,
              accountStatus: row.account_status || "active",
              createdAt: new Date().toISOString(),
            };
            registeredStudentsMap.set(mapped.id, mapped);
          });
        }
      } catch (dbErr) {
        console.warn("Could not query Supabase students table, using client registered cohort:", dbErr);
      }
    }

    const allRegisteredStudents = Array.from(registeredStudentsMap.values());

    // =========================================================================
    // 3. GEMINI AI EXTRACTION WITH ZOD VALIDATION
    // =========================================================================
    const geminiResult = await extractGroupsWithGemini(rawText);

    // =========================================================================
    // 4. CROSS-REFERENCE WITH DATABASE (Match students without DB changes)
    // =========================================================================
    const extractionResult = matchExtractedGroupsToDatabase(
      geminiResult,
      allRegisteredStudents,
      sourceType,
      rawText
    );

    return NextResponse.json({
      success: true,
      data: extractionResult,
    });
  } catch (err: unknown) {
    console.error("Group extraction API error:", err);

    if (err instanceof OcrRequiredError) {
      return NextResponse.json(
        {
          success: false,
          ocrRequired: true,
          error: err.message,
          canRetry: false,
        },
        { status: 422 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to extract student groups with Gemini AI.";
    const isRateLimit = msg.toLowerCase().includes("rate") || msg.includes("429");

    return NextResponse.json(
      {
        success: false,
        ocrRequired: false,
        canRetry: true,
        error: isRateLimit
          ? "Gemini API rate limit reached. Please wait a moment and click Retry."
          : msg,
      },
      { status: 500 }
    );
  }
}
