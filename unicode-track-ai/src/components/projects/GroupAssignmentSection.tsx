"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  Type,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  FileCheck,
  Check,
  HelpCircle,
  Sparkles,
  Users,
  ShieldCheck,
  Eye,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface GroupAssignmentData {
  sourceType: "pdf" | "text" | "none";
  filePath?: string;
  fileName?: string;
  fileSize?: string;
  text?: string;
  status: "pending" | "processing" | "completed" | "error" | "not_uploaded";
}

interface GroupAssignmentSectionProps {
  projectId?: string;
  initialSourceType?: "pdf" | "text" | "none";
  initialFilePath?: string;
  initialFileName?: string;
  initialFileSize?: string;
  initialText?: string;
  initialStatus?: "pending" | "processing" | "completed" | "error" | "not_uploaded";
  onAssignmentChange?: (data: GroupAssignmentData) => void;
  className?: string;
}

export function GroupAssignmentSection({
  projectId,
  initialSourceType = "none",
  initialFilePath = "",
  initialFileName = "",
  initialFileSize = "",
  initialText = "",
  initialStatus = "not_uploaded",
  onAssignmentChange,
  className = "",
}: GroupAssignmentSectionProps) {
  // Input method: Option 1 (PDF) vs Option 2 (Text)
  const [activeMethod, setActiveMethod] = useState<"pdf" | "text">(
    initialSourceType === "text" ? "text" : "pdf"
  );

  // PDF File State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState(initialFilePath);
  const [uploadedFileName, setUploadedFileName] = useState(initialFileName);
  const [uploadedFileSize, setUploadedFileSize] = useState(initialFileSize);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text State
  const [assignmentText, setAssignmentText] = useState(initialText);
  const [isSavingText, setIsSavingText] = useState(false);
  const [textSuccess, setTextSuccess] = useState(false);
  const [textError, setTextError] = useState("");

  // Overall Processing Status
  const [processingStatus, setProcessingStatus] = useState<
    "pending" | "processing" | "completed" | "error" | "not_uploaded"
  >(initialStatus);

  // Sync to parent when values change
  const notifyChange = (newData: Partial<GroupAssignmentData>) => {
    if (!onAssignmentChange) return;

    if (activeMethod === "pdf") {
      onAssignmentChange({
        sourceType: uploadedFileName ? "pdf" : "none",
        filePath: uploadedFilePath,
        fileName: uploadedFileName,
        fileSize: uploadedFileSize,
        text: undefined,
        status: uploadedFileName ? "pending" : "not_uploaded",
        ...newData,
      });
    } else {
      onAssignmentChange({
        sourceType: assignmentText.trim() ? "text" : "none",
        filePath: undefined,
        fileName: undefined,
        fileSize: undefined,
        text: assignmentText.trim(),
        status: assignmentText.trim() ? "pending" : "not_uploaded",
        ...newData,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // OPTION 1: PDF Upload Handlers
  // ---------------------------------------------------------------------------
  const handleFileSelect = async (file: File) => {
    setFileError("");

    // 1. Accept PDF files only
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("Invalid file type. Only official PDF (.pdf) documents are accepted.");
      return;
    }

    // 2. Validate file size (max 15 MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError(
        `File exceeds the 15 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please optimize the document.`
      );
      return;
    }

    setPdfFile(file);
    setIsUploading(true);
    setUploadProgress(20);

    const formattedSize =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (projectId) formData.append("projectId", projectId);

      setUploadProgress(65);

      const res = await fetch("/api/projects/upload-assignment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (data.success) {
        setUploadedFilePath(data.filePath || `assignments/temp/${file.name}`);
        setUploadedFileName(file.name);
        setUploadedFileSize(formattedSize);
        setProcessingStatus("pending");

        notifyChange({
          sourceType: "pdf",
          filePath: data.filePath || `assignments/temp/${file.name}`,
          fileName: file.name,
          fileSize: formattedSize,
          status: "pending",
        });
      } else {
        setFileError(data.error || "Failed to upload PDF. Please try again.");
      }
    } catch {
      // Offline fallback: store file reference locally
      setUploadedFileName(file.name);
      setUploadedFileSize(formattedSize);
      setUploadedFilePath(`local-temp/${file.name}`);
      setProcessingStatus("pending");

      notifyChange({
        sourceType: "pdf",
        fileName: file.name,
        fileSize: formattedSize,
        status: "pending",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = async () => {
    if (uploadedFilePath && projectId) {
      try {
        await fetch(
          `/api/projects/upload-assignment?filePath=${encodeURIComponent(
            uploadedFilePath
          )}&projectId=${encodeURIComponent(projectId)}`,
          { method: "DELETE" }
        );
      } catch {
        // Continue clearing state
      }
    }

    setPdfFile(null);
    setUploadedFilePath("");
    setUploadedFileName("");
    setUploadedFileSize("");
    setProcessingStatus("not_uploaded");
    if (fileInputRef.current) fileInputRef.current.value = "";

    notifyChange({
      sourceType: "none",
      filePath: undefined,
      fileName: undefined,
      fileSize: undefined,
      status: "not_uploaded",
    });
  };

  // ---------------------------------------------------------------------------
  // OPTION 2: Text Input Handlers
  // ---------------------------------------------------------------------------
  const handleSaveText = async () => {
    setTextError("");
    setTextSuccess(false);

    if (!assignmentText.trim()) {
      setTextError("Please paste group assignment text before saving.");
      return;
    }

    setIsSavingText(true);
    try {
      if (projectId) {
        const res = await fetch("/api/projects/upload-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: assignmentText.trim(),
            projectId,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to save assignment text.");
        }
      }

      setProcessingStatus("pending");
      setTextSuccess(true);
      setTimeout(() => setTextSuccess(false), 3000);

      notifyChange({
        sourceType: "text",
        text: assignmentText.trim(),
        status: "pending",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving text";
      setTextError(msg);
    } finally {
      setIsSavingText(false);
    }
  };

  // Switch between input methods explicitly
  const handleSwitchMethod = (method: "pdf" | "text") => {
    setActiveMethod(method);
    if (method === "pdf") {
      notifyChange({
        sourceType: uploadedFileName ? "pdf" : "none",
      });
    } else {
      notifyChange({
        sourceType: assignmentText.trim() ? "text" : "none",
      });
    }
  };

  // Real-time group / student pattern detector for Option 2
  const detectGroupsAndStudents = (text: string) => {
    if (!text) return { groupCount: 0, studentCount: 0 };
    const groupMatches = text.match(/(?:Group|Team|Cohort)\s*#?\s*\d+/gi) || [];
    const studentMatches =
      text.match(/(?:[A-Z]{2,4}\d{4,8}|std-\d+|CS\d{6,8}|IT\d{6,8})/gi) || [];
    return {
      groupCount: groupMatches.length,
      studentCount: studentMatches.length,
    };
  };

  const detected = detectGroupsAndStudents(assignmentText);

  // Load standard template example
  const handleLoadExampleFormat = () => {
    const example = `Group 1\nIT230001 - Student One (one@university.edu)\nIT230002 - Student Two (two@university.edu)\nIT230003 - Student Three (three@university.edu)\n\nGroup 2\nIT230004 - Student Four (four@university.edu)\nIT230005 - Student Five (five@university.edu)\nIT230006 - Student Six (six@university.edu)`;
    setAssignmentText(example);
    notifyChange({
      sourceType: "text",
      text: example,
      status: "pending",
    });
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 ${className}`}
    >
      {/* Header & Source Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0B1220] text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-[#0B1220] tracking-tight">
                Group Assignment Configuration
              </h3>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                Group Project
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your preferred input method to allocate students into group workspaces.
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {processingStatus === "pending" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Source Saved: Pending Processing
            </span>
          ) : processingStatus === "completed" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Groups Processed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              No Assignment Uploaded
            </span>
          )}
        </div>
      </div>

      {/* Input Method Selector (Exclusive Selection) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Input Method <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            Choose either PDF upload or text roster
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Method 1 Tab */}
          <button
            type="button"
            onClick={() => handleSwitchMethod("pdf")}
            className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
              activeMethod === "pdf"
                ? "border-teal-500 bg-teal-50/20 shadow-xs ring-2 ring-teal-500/10"
                : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeMethod === "pdf"
                  ? "bg-teal-600 text-white shadow-2xs"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4
                  className={`font-bold text-xs sm:text-sm ${
                    activeMethod === "pdf" ? "text-slate-900" : "text-slate-700"
                  }`}
                >
                  OPTION 1: Upload Group Assignment PDF
                </h4>
                {activeMethod === "pdf" && (
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Upload official timetable or group allocation document in PDF format.
              </p>
            </div>
          </button>

          {/* Method 2 Tab */}
          <button
            type="button"
            onClick={() => handleSwitchMethod("text")}
            className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
              activeMethod === "text"
                ? "border-teal-500 bg-teal-50/20 shadow-xs ring-2 ring-teal-500/10"
                : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeMethod === "text"
                  ? "bg-teal-600 text-white shadow-2xs"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              <Type className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4
                  className={`font-bold text-xs sm:text-sm ${
                    activeMethod === "text" ? "text-slate-900" : "text-slate-700"
                  }`}
                >
                  OPTION 2: Paste Group Assignment Text
                </h4>
                {activeMethod === "text" && (
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Paste student IDs, names, and team groups directly into the editor.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* OPTION 1 CONTENT: PDF UPLOAD                                            */}
      {/* ======================================================================= */}
      {activeMethod === "pdf" && (
        <div className="space-y-4 pt-1 animate-in fade-in-50">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {!uploadedFileName ? (
            /* Drag and Drop Upload Area */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="p-8 sm:p-10 rounded-3xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 bg-slate-50/60 text-center cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-2xs">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                  Choose Group Assignment PDF or Drag & Drop
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Accepts official PDF documents up to <strong>15 MB</strong>
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Select PDF Document</span>
              </div>
            </div>
          ) : (
            /* Uploaded PDF Document Card */
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs font-mono">
                  PDF
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate" title={uploadedFileName}>
                      {uploadedFileName}
                    </h4>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {uploadedFileSize}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Stored in private bucket: <strong className="font-mono text-slate-700">group-assignments</strong></span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Replace or Remove */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 animate-in fade-in-50">
              <div className="flex justify-between text-xs font-semibold text-teal-800">
                <span>Uploading PDF to private storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* File Validation Error Alert */}
          {fileError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium">{fileError}</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* OPTION 2 CONTENT: PASTE ROSTER TEXT                                     */}
      {/* ======================================================================= */}
      {activeMethod === "text" && (
        <div className="space-y-4 pt-1 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-medium">
              Paste group headers followed by student university IDs and names:
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadExampleFormat}
                className="text-teal-700 hover:text-teal-800 font-bold hover:underline flex items-center gap-1 text-[11px]"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Template Example</span>
              </button>

              {assignmentText && (
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentText("");
                    notifyChange({ sourceType: "none", text: undefined });
                  }}
                  className="text-slate-400 hover:text-rose-600 text-[11px] font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Large Textarea */}
          <div className="relative">
            <textarea
              rows={8}
              placeholder={`Group 1\nIT230001 - Student One\nIT230002 - Student Two\nIT230003 - Student Three\n\nGroup 2\nIT230004 - Student Four\nIT230005 - Student Five`}
              value={assignmentText}
              onChange={(e) => {
                setAssignmentText(e.target.value);
                notifyChange({
                  sourceType: e.target.value.trim() ? "text" : "none",
                  text: e.target.value.trim(),
                  status: e.target.value.trim() ? "pending" : "not_uploaded",
                });
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono text-slate-900 leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all resize-y"
            />
          </div>

          {/* Format Helper & Counter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                {detected.groupCount} Groups Detected
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                {detected.studentCount} Students Detected
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                {assignmentText.length} characters
              </span>

              {projectId && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSavingText || !assignmentText.trim()}
                  onClick={handleSaveText}
                  icon={
                    isSavingText ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isSavingText ? "Saving..." : "Save Assignment Text"}
                </Button>
              )}
            </div>
          </div>

          {/* Success message */}
          {textSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Group assignment text saved securely to database!</span>
            </div>
          )}

          {/* Error message */}
          {textError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{textError}</span>
            </div>
          )}
        </div>
      )}

      {/* Security & Access Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          <strong>Security Policy:</strong> Uploaded assignment files are stored in a private Supabase Storage bucket with strict Row Level Security. Only course lecturers can access student allocations. File parsing with Gemini will take place in the next step.
        </p>
      </div>
    </div>
  );
}
