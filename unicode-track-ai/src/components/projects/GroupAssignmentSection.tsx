"use client";

import React, { useState, useRef } from "react";
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
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  UserX,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/context/AdminDataContext";
import { ExtractionResult, ProcessedGroup } from "@/services/ai/extract-groups";
import { LecturerGroupReviewWorkspace } from "@/components/groups/LecturerGroupReviewWorkspace";
import { ProjectGroup } from "@/types/project";

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
  projectTitle?: string;
  targetDepartmentId?: string;
  initialSourceType?: "pdf" | "text" | "none";
  initialFilePath?: string;
  initialFileName?: string;
  initialFileSize?: string;
  initialText?: string;
  initialStatus?: "pending" | "processing" | "completed" | "error" | "not_uploaded";
  onAssignmentChange?: (data: GroupAssignmentData) => void;
  onExtractedGroupsChange?: (data: ExtractionResult) => void;
  onConfirmedGroups?: (groups: ProjectGroup[]) => void;
  className?: string;
}

export function GroupAssignmentSection({
  projectId,
  projectTitle = "Academic Project",
  targetDepartmentId,
  initialSourceType = "none",
  initialFilePath = "",
  initialFileName = "",
  initialFileSize = "",
  initialText = "",
  initialStatus = "not_uploaded",
  onAssignmentChange,
  onExtractedGroupsChange,
  onConfirmedGroups,
  className = "",
}: GroupAssignmentSectionProps) {
  const { students } = useAdminData();

  // Review Workspace display toggle
  const [showReviewWorkspace, setShowReviewWorkspace] = useState(false);
  const [confirmedGroups, setConfirmedGroups] = useState<ProjectGroup[] | null>(null);

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

  // Gemini AI Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState("");
  const [extractionError, setExtractionError] = useState("");
  const [isOcrRequired, setIsOcrRequired] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [expandedGroupIdx, setExpandedGroupIdx] = useState<number | null>(null);

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
    setExtractionError("");
    setIsOcrRequired(false);
    setExtractionResult(null);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during upload";
      setFileError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = async () => {
    if (!uploadedFilePath && !uploadedFileName) return;

    try {
      await fetch(
        `/api/projects/upload-assignment?filePath=${encodeURIComponent(uploadedFilePath)}&projectId=${projectId || ""}`,
        { method: "DELETE" }
      );
    } catch {
      // Proceed with local reset
    }

    setPdfFile(null);
    setUploadedFilePath("");
    setUploadedFileName("");
    setUploadedFileSize("");
    setUploadProgress(0);
    setFileError("");
    setExtractionError("");
    setIsOcrRequired(false);
    setExtractionResult(null);
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
  // OPTION 2: Text Handlers
  // ---------------------------------------------------------------------------
  const handleSaveText = async () => {
    setTextError("");
    setTextSuccess(false);

    if (!assignmentText.trim()) {
      setTextError("Please enter or paste group allocation text before saving.");
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
    setExtractionError("");
    setIsOcrRequired(false);

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
    const example = `Group 1\nIT230001 - Student One (alex.chen@university.edu)\nIT230002 - Student Two (sarah.lin@university.edu)\nIT230003 - Student Three (marcus.doe@university.edu)\n\nGroup 2\nIT230004 - Student Four (priya.patel@university.edu)\nIT230005 - Student Five (liam.davis@university.edu)\nIT230006 - Student Six (maya.wang@university.edu)`;
    setAssignmentText(example);
    notifyChange({
      sourceType: "text",
      text: example,
      status: "pending",
    });
  };

  // ---------------------------------------------------------------------------
  // GEMINI AI EXTRACTION HANDLER
  // ---------------------------------------------------------------------------
  const handleExtractGroups = async () => {
    setIsExtracting(true);
    setExtractionError("");
    setIsOcrRequired(false);
    setExtractionStep("Preparing document for AI analysis...");

    try {
      let res: Response;

      if (activeMethod === "pdf") {
        if (!pdfFile && !uploadedFilePath) {
          throw new Error("Please upload a PDF file first before extracting groups.");
        }

        setExtractionStep("Extracting text layers from PDF document...");

        if (pdfFile) {
          // Direct file upload to extractor
          const formData = new FormData();
          formData.append("file", pdfFile);
          if (students && students.length > 0) {
            formData.append("registeredStudents", JSON.stringify(students));
          }

          setExtractionStep("Analyzing document text with Google Gemini 2.5 Flash...");
          res = await fetch("/api/ai/extract-groups", {
            method: "POST",
            body: formData,
          });
        } else {
          // Send stored filePath
          setExtractionStep("Downloading stored PDF from storage & analyzing with Gemini AI...");
          res = await fetch("/api/ai/extract-groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filePath: uploadedFilePath,
              registeredStudents: students,
            }),
          });
        }
      } else {
        // Text mode
        if (!assignmentText.trim()) {
          throw new Error("Please enter or paste group assignment text first.");
        }

        setExtractionStep("Analyzing group roster with Google Gemini 2.5 Flash...");
        res = await fetch("/api/ai/extract-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: assignmentText.trim(),
            registeredStudents: students,
          }),
        });
      }

      setExtractionStep("Validating structured JSON schema with Zod & matching against university database...");
      const data = await res.json();

      if (!data.success) {
        if (data.ocrRequired) {
          setIsOcrRequired(true);
          setExtractionError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to extract student groups.");
      }

      setExtractionResult(data.data);
      setProcessingStatus("completed");
      setShowReviewWorkspace(true);

      if (onExtractedGroupsChange) {
        onExtractedGroupsChange(data.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during AI extraction.";
      setExtractionError(msg);
      setProcessingStatus("error");
    } finally {
      setIsExtracting(false);
      setExtractionStep("");
    }
  };

  const handleClearExtraction = () => {
    setExtractionResult(null);
    setExtractionError("");
    setIsOcrRequired(false);
    setShowReviewWorkspace(false);
    setProcessingStatus("pending");
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
          {isExtracting ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              Gemini AI Extracting...
            </span>
          ) : extractionResult ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Extracted: {extractionResult.totalGroups} Groups & {extractionResult.totalMembers} Students
            </span>
          ) : processingStatus === "pending" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Source Ready for AI Extraction
            </span>
          ) : processingStatus === "error" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Extraction Error
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

              {/* Action Buttons: Extract with Gemini, Replace, Remove */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleExtractGroups}
                  disabled={isExtracting || isUploading}
                  icon={
                    isExtracting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isExtracting ? "Extracting..." : "Extract Groups with Gemini"}
                </Button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isExtracting}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Replace
                </button>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isUploading || isExtracting}
                  className="p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors"
                  title="Remove uploaded document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 p-4 rounded-2xl bg-teal-50/50 border border-teal-100 animate-in fade-in-50">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  Uploading PDF to private bucket...
                </span>
                <span className="font-mono text-teal-700 font-semibold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-teal-100 h-2 rounded-full overflow-hidden">
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
                    setExtractionResult(null);
                    notifyChange({ sourceType: "none", text: undefined });
                  }}
                  className="text-slate-400 hover:text-rose-600 text-[11px] font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Large Monospace Textarea */}
          <div className="relative">
            <textarea
              rows={8}
              placeholder={`Group 1\nIT230001 - Student One (alex.chen@university.edu)\nIT230002 - Student Two (sarah.lin@university.edu)\nIT230003 - Student Three (marcus.doe@university.edu)\n\nGroup 2\nIT230004 - Student Four (priya.patel@university.edu)\nIT230005 - Student Five (liam.davis@university.edu)`}
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

          {/* Format Helper, Counter & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                {detected.groupCount} Groups Detected
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                {detected.studentCount} Students Detected
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {assignmentText.length} chars
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {projectId && (
                <button
                  type="button"
                  disabled={isSavingText || !assignmentText.trim()}
                  onClick={handleSaveText}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {isSavingText ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSavingText ? "Saving..." : "Save Text"}</span>
                </button>
              )}

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isExtracting || !assignmentText.trim()}
                onClick={handleExtractGroups}
                icon={
                  isExtracting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )
                }
              >
                {isExtracting ? "Extracting..." : "Extract Groups with Gemini"}
              </Button>
            </div>
          </div>

          {/* Text Success message */}
          {textSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Group assignment text saved securely to database!</span>
            </div>
          )}

          {/* Text Error message */}
          {textError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{textError}</span>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* EXTRACTION LOADING STATE                                                */}
      {/* ======================================================================= */}
      {isExtracting && (
        <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-200 shadow-2xs space-y-3 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Gemini AI Group Extraction in Progress</span>
                <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                  gemini-2.5-flash
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">{extractionStep}</p>
            </div>
          </div>

          <div className="w-full bg-teal-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* OCR REQUIRED WARNING BANNER (When PDF has no text layer)                */}
      {/* ======================================================================= */}
      {isOcrRequired && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-2xs space-y-3 animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-amber-900">
                OCR Required: Scanned Image PDF Detected
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                The uploaded PDF contains scanned pages or non-selectable raster images with no embedded text layer.
                UniCodeTrack AI enforces strict academic integrity and will not silently guess student allocations.
                Optical Character Recognition (OCR) is required to process scanned documents.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-amber-800 font-medium">
              Recommended Alternative: Paste the group assignment roster directly into text input.
            </span>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSwitchMethod("text")}
              icon={<Type className="w-3.5 h-3.5" />}
            >
              Switch to Paste Text
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* EXTRACTION GENERAL ERROR & RETRY OPTION                                 */}
      {/* ======================================================================= */}
      {extractionError && !isOcrRequired && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-900">AI Extraction Failed</p>
              <p className="text-rose-700">{extractionError}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExtractGroups}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Retry Extraction
          </Button>
        </div>
      )}

      {/* ======================================================================= */}
      {/* EXTRACTION PREVIEW & LECTURER REVIEW WORKSPACE                          */}
      {/* ======================================================================= */}
      {extractionResult && (
        <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in-50">
          {/* Header & Metrics Strip */}
          <div className="p-5 rounded-2xl bg-[#0B1220] text-white shadow-md space-y-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                    Gemini AI Extraction & Student Matching
                  </h4>
                  <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/20">
                    Zod Validated
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Students matched against database using strict priority (Exact ID &gt; Exact Email &gt; Unique Name).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowReviewWorkspace(!showReviewWorkspace)}
                  icon={<Sliders className="w-3.5 h-3.5" />}
                >
                  {showReviewWorkspace ? "Hide Review Workspace" : "Open Lecturer Review Screen"}
                </Button>
                <button
                  type="button"
                  onClick={handleExtractGroups}
                  disabled={isExtracting}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-extract</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearExtraction}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Metrics Pills: 5 Matching Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-slate-800 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Groups</span>
                <span className="text-base font-bold text-white mt-0.5 block">{extractionResult.totalGroups} Teams</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
                <span className="text-base font-bold text-teal-400 mt-0.5 block">{extractionResult.totalMembers} Total</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matched</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">{extractionResult.matchedCount} Verified</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unmatched / Ambiguous</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 block">
                  {extractionResult.unmatchedCount + (extractionResult.ambiguousCount || 0)} Pending
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conflicts</span>
                <span className={`text-base font-bold mt-0.5 block ${
                  (extractionResult.duplicateCount || 0) + (extractionResult.invalidCount || 0) > 0 ? "text-rose-400" : "text-slate-400"
                }`}>
                  {(extractionResult.duplicateCount || 0) + (extractionResult.invalidCount || 0)} Blocking
                </span>
              </div>
            </div>
          </div>

          {/* Success Banner if Groups Already Confirmed */}
          {confirmedGroups && confirmedGroups.length > 0 && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-emerald-950">
                    Group Assignments Confirmed & Workspaces Created
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {confirmedGroups.length} Groups • {confirmedGroups.reduce((acc, g) => acc + g.members.length, 0)} Students
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                All project groups have been instantiated with isolated workspace identifiers. Members can now collaborate and connect their repositories.
              </p>
            </div>
          )}

          {/* Warnings Banner (If any) */}
          {extractionResult.warnings && extractionResult.warnings.length > 0 && !showReviewWorkspace && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Extraction & Database Matching Warnings ({extractionResult.warnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1 text-[11px]">
                {extractionResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* RENDER MODE A: FULL INTERACTIVE LECTURER REVIEW WORKSPACE */}
          {showReviewWorkspace ? (
            <div className="space-y-4 pt-2">
              <LecturerGroupReviewWorkspace
                projectId={projectId || "draft-project"}
                projectTitle={projectTitle}
                initialGroups={extractionResult.groups}
                initialWarnings={extractionResult.warnings}
                targetDepartmentId={targetDepartmentId}
                onConfirmed={(created) => {
                  setConfirmedGroups(created);
                  setShowReviewWorkspace(false);
                  setProcessingStatus("completed");
                  if (onConfirmedGroups) {
                    onConfirmedGroups(created);
                  }
                }}
                onCancel={() => setShowReviewWorkspace(false)}
              />
            </div>
          ) : (
            /* RENDER MODE B: COLLAPSED PREVIEW ROSTER */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>Extracted Groups Roster</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (Click &quot;Open Lecturer Review Screen&quot; above to resolve unmatched students or edit assignments)
                  </span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {extractionResult.groups.map((grp: ProcessedGroup, gIdx: number) => {
                  const isExpanded = expandedGroupIdx === null || expandedGroupIdx === gIdx;
                  const matchedInGroup = grp.members.filter((m) => m.status === "Matched").length;

                  return (
                    <div
                      key={grp.group_number || gIdx}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                    >
                      {/* Group Header */}
                      <div
                        className="flex items-center justify-between cursor-pointer select-none"
                        onClick={() => setExpandedGroupIdx(isExpanded && expandedGroupIdx === gIdx ? -1 : gIdx)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#0B1220] text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            #{grp.group_number}
                          </span>
                          <div>
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                              {grp.group_name || `Group ${grp.group_number}`}
                            </h5>
                            <span className="text-[11px] text-slate-500">
                              {grp.members.length} student members
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {matchedInGroup} / {grp.members.length} matched
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Member List with 5 Status Badges */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                          {grp.members.map((member, mIdx) => (
                            <div
                              key={mIdx}
                              className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                member.status === "Matched"
                                  ? "bg-slate-50/70 border-slate-200/80"
                                  : member.status === "Ambiguous"
                                  ? "bg-purple-50/50 border-purple-200"
                                  : member.status === "Duplicate" || member.status === "Invalid student"
                                  ? "bg-rose-50/50 border-rose-200"
                                  : "bg-amber-50/50 border-amber-200/80"
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 truncate">
                                    {member.full_name}
                                  </span>
                                  {mIdx === 0 && (
                                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                      Lead
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                                  <span>
                                    ID: <strong className="text-slate-800">{member.student_id || "None"}</strong>
                                  </span>
                                  {member.email && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[180px]">{member.email}</span>
                                    </>
                                  )}
                                  {member.matchedStudent && (
                                    <>
                                      <span>•</span>
                                      <span className="text-teal-700 font-medium">DB: {member.matchedStudent.fullName}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 5 Distinct Match Status Badges */}
                              <div className="shrink-0 self-start sm:self-center">
                                {member.status === "Matched" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <UserCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Matched ({member.matchType})</span>
                                  </span>
                                ) : member.status === "Ambiguous" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    <AlertCircle className="w-3 h-3 text-purple-600" />
                                    <span>Ambiguous</span>
                                  </span>
                                ) : member.status === "Duplicate" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>Duplicate</span>
                                  </span>
                                ) : member.status === "Invalid student" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    <span>Invalid student</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    <UserX className="w-3 h-3 text-amber-600" />
                                    <span>Unmatched</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Institutional Integrity Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Architectural Notice:</strong> Gemini AI operates strictly in read-only analysis mode and has not created database groups.
                  Click <strong>&quot;Open Lecturer Review Screen&quot;</strong> to reconcile unmatched students, resolve conflicts, and explicitly click <strong>&quot;Confirm Group Assignments&quot;</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security & Access Policy Footer */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
        <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          <strong>Security Policy:</strong> Uploaded assignment files are stored in a private Supabase Storage bucket with strict Row Level Security. Only course lecturers can access student allocations.
        </p>
      </div>
    </div>
  );
}
