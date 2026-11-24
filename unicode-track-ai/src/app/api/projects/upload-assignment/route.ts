import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const BUCKET_NAME = "group-assignments";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Server-Side Secure API for Group Assignment Input (PDF Upload & Text Saving)
 * POST /api/projects/upload-assignment
 * Supports:
 * 1. multipart/form-data for PDF document uploads to private Supabase Storage
 * 2. application/json for raw pasted group assignment text
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // =========================================================================
    // OPTION 1: Upload Group Assignment PDF
    // =========================================================================
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const projectId = (formData.get("projectId") as string) || "";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No PDF file was provided in the upload request." },
          { status: 400 }
        );
      }

      // 1. Server-side file type validation (PDF files only)
      const isPdfType =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdfType) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Only official PDF (.pdf) documents are accepted for group assignments.",
          },
          { status: 400 }
        );
      }

      // 2. Server-side file size validation (max 15MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `File size exceeds the 15 MB limit (file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Please optimize the PDF.`,
          },
          { status: 400 }
        );
      }

      const formattedSize =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `assignments/${projectId || "drafts"}/${Date.now()}_${sanitizedName}`;

      let savedToSupabase = false;
      let storageWarning: string | null = null;

      // 3. Upload to private Supabase Storage bucket
      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient() || createClient();

          // Ensure private bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
          if (!bucketExists) {
            await supabase.storage.createBucket(BUCKET_NAME, {
              public: false,
              fileSizeLimit: MAX_FILE_SIZE_BYTES,
              allowedMimeTypes: ["application/pdf"],
            });
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, buffer, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (uploadError) {
            console.warn("Supabase storage upload error:", uploadError);
            storageWarning = uploadError.message;
          } else {
            savedToSupabase = true;

            // 4. Update database reference if projectId provided
            if (projectId) {
              await supabase
                .from("projects")
                .update({
                  assignment_source_type: "pdf",
                  assignment_file_path: storagePath,
                  assignment_file_name: file.name,
                  assignment_file_size: formattedSize,
                  assignment_text: null, // Clear text so only one source is active
                  assignment_processing_status: "pending",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", projectId);
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Supabase storage error";
          console.warn("Storage upload exception:", msg);
          storageWarning = msg;
        }
      }

      return NextResponse.json({
        success: true,
        sourceType: "pdf",
        filePath: storagePath,
        fileName: file.name,
        fileSize: formattedSize,
        status: "pending",
        savedToSupabase,
        warning: storageWarning || undefined,
        message: savedToSupabase
          ? "PDF file uploaded and saved to secure private storage successfully!"
          : "PDF file processed (local store reference).",
      });
    }

    // =========================================================================
    // OPTION 2: Paste Group Assignment Text
    // =========================================================================
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { text, projectId }: { text: string; projectId?: string } = body;

      if (!text || !text.trim()) {
        return NextResponse.json(
          { success: false, error: "Group assignment text cannot be empty." },
          { status: 400 }
        );
      }

      const trimmedText = text.trim();
      let savedToSupabase = false;

      if (isSupabaseConfigured() && projectId) {
        try {
          const supabase = createAdminClient() || createClient();

          const { error: updateError } = await supabase
            .from("projects")
            .update({
              assignment_source_type: "text",
              assignment_text: trimmedText,
              assignment_file_path: null, // Clear file so only one source is active
              assignment_file_name: null,
              assignment_file_size: null,
              assignment_processing_status: "pending",
              updated_at: new Date().toISOString(),
            })
            .eq("id", projectId);

          if (!updateError) {
            savedToSupabase = true;
          }
        } catch (err) {
          console.warn("Database update exception:", err);
        }
      }

      return NextResponse.json({
        success: true,
        sourceType: "text",
        text: trimmedText,
        status: "pending",
        savedToSupabase,
        message: "Group assignment text saved securely.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported Content-Type header." },
      { status: 415 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/upload-assignment
 * Removes an uploaded PDF or clears the assignment source
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("filePath");
    const projectId = searchParams.get("projectId");

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient() || createClient();

        // 1. Delete object from private storage
        if (filePath) {
          await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        }

        // 2. Reset fields in projects table if projectId provided
        if (projectId) {
          await supabase
            .from("projects")
            .update({
              assignment_source_type: "none",
              assignment_file_path: null,
              assignment_file_name: null,
              assignment_file_size: null,
              assignment_text: null,
              assignment_processing_status: "not_uploaded",
              updated_at: new Date().toISOString(),
            })
            .eq("id", projectId);
        }
      } catch (err) {
        console.warn("Delete storage exception:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Group assignment reference removed successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
