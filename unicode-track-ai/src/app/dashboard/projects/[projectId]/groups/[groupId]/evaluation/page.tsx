"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Save,
  Check,
  RotateCcw,
  GitBranch,
  GitCommit,
  ExternalLink,
  BookOpen,
  FileCode2,
  Layers,
  FileText,
  ShieldCheck,
  ChevronRight,
  Info,
  Users,
  Eye,
  Sliders,
  CheckCheck,
  Database,
  Download,
  Image,
  Code,
  FileCheck,
  CheckSquare,
  AlertTriangle,
  FileCode,
  Table,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ProjectEvaluation,
  CriterionEvaluationScore,
  EvaluationRubric,
  EvaluationStatus,
} from "@/types/evaluation";
import {
  ERDiagramSubmission,
  ERDiagramAIAnalysis,
  ERLecturerFeedback,
  DEFAULT_ER_DIAGRAM_RUBRIC,
  ERDiagramIssue,
  ERCriterionEvaluation,
} from "@/types/er-diagram";
import { SAMPLE_C_PROJECT_FILES } from "@/services/github/repositories";

function EvaluationReviewContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const groupId = params?.groupId as string;

  const {
    projects,
    courses,
    groups,
    getRubricForProject,
    getEvaluationForGroup,
    saveEvaluation,
    updateEvaluationCriterionScore,
    approveEvaluation,
    publishEvaluation,
    getERSubmissionForGroup,
    saveERAnalysis,
    saveERFeedback,
    publishERFeedback,
    showToast,
  } = useAdminData();

  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;
  const group = groups.find((g) => g.id === groupId) || groups.find((g) => g.projectId === projectId) || groups[0];

  const rubric = getRubricForProject(projectId);
  const existingEvaluation = getEvaluationForGroup(groupId) || (group ? getEvaluationForGroup(group.id) : undefined);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"criteria" | "requirements" | "github" | "er_diagram" | "feedback">("criteria");

  // Code inspection preview modal
  const [inspectingEvidence, setInspectingEvidence] = useState<{
    file: string;
    functionName?: string;
    lineRange?: string;
    snippet?: string;
  } | null>(null);

  // ER Diagram Issue SQL Evidence Modal
  const [inspectingERIssue, setInspectingERIssue] = useState<ERDiagramIssue | null>(null);

  // Current Evaluation State
  const [evaluation, setEvaluation] = useState<ProjectEvaluation | undefined>(existingEvaluation);

  // AI Review Running State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");

  // ER Diagram Review States
  const existingERSub = getERSubmissionForGroup(groupId) || (group ? getERSubmissionForGroup(group.id) : undefined);
  const [currentERSubmission, setCurrentERSubmission] = useState<ERDiagramSubmission | undefined>(existingERSub);
  const [isAnalyzingER, setIsAnalyzingER] = useState(false);
  const [erAnalysisProgress, setErAnalysisProgress] = useState("");

  // Sync ER submission when context updates
  useEffect(() => {
    if (existingERSub) {
      setCurrentERSubmission(existingERSub);
    }
  }, [existingERSub]);

  // ER Lecturer Feedback Draft State
  const [erQualitativeComments, setErQualitativeComments] = useState(
    existingERSub?.lecturerFeedback?.generalComments ||
      "Good database conceptualization with clear attendee-event relationships. Ensure foreign key indexing and composite key constraints are added in SQL schema."
  );
  const [allowStudentAIFeedback, setAllowStudentAIFeedback] = useState(
    existingERSub?.lecturerFeedback?.allowStudentAIFeedbackView ?? true
  );

  // ER Rubric Criteria & Marks State
  const activeERRubric = project?.databaseDesignConfig?.rubricCriteria || DEFAULT_ER_DIAGRAM_RUBRIC;
  const [erCriteriaMarks, setErCriteriaMarks] = useState<{ criterionId: string; marks: number; comments?: string }[]>(() => {
    if (existingERSub?.lecturerFeedback?.criterionAdjustedMarks) {
      return Object.entries(existingERSub.lecturerFeedback.criterionAdjustedMarks).map(([criterionId, marks]) => ({
        criterionId,
        marks,
        comments: "",
      }));
    }
    if (existingERSub?.aiAnalysis?.criterionEvaluations) {
      return existingERSub.aiAnalysis.criterionEvaluations.map((c) => ({
        criterionId: c.criterionId,
        marks: c.finalMarks,
        comments: c.explanation,
      }));
    }
    return activeERRubric.map((c) => ({
      criterionId: c.id,
      marks: Math.round(c.maxMarks * 0.85),
      comments: "",
    }));
  });

  // Calculate dynamic approved ER score: sum(c.marks)
  const currentERTotalApprovedMarks = Math.round(
    erCriteriaMarks.reduce((sum, item) => sum + (Number(item.marks) || 0), 0) * 10
  ) / 10;
  const maxERTotalMarks = activeERRubric.reduce((sum, c) => sum + c.maxMarks, 0);

  // Lecturer General Comments
  const [lecturerComments, setLecturerComments] = useState(
    evaluation?.lecturerComments ||
      "Well-implemented capstone prototype with commendable memory hygiene in C. Please address sensor input validation boundary conditions prior to final defense."
  );

  // Calculate dynamic letter grade
  const getLetterGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: "A+", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (percentage >= 80) return { grade: "A", color: "text-teal-600 bg-teal-50 border-teal-200" };
    if (percentage >= 70) return { grade: "B+", color: "text-blue-600 bg-blue-50 border-blue-200" };
    if (percentage >= 60) return { grade: "B", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
    if (percentage >= 50) return { grade: "C", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { grade: "F", color: "text-rose-600 bg-rose-50 border-rose-200" };
  };

  // Run AI Code Review
  const handleRunAICodeReview = async () => {
    if (!group) return;

    setIsAnalyzing(true);
    setAnalysisProgress("Analyzing repository files and comparing them with the project rubric...");

    try {
      const response = await fetch("/api/ai/review-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          groupId: group.id,
          groupNumber: group.groupNumber,
          groupName: group.groupName,
          rubric,
          repoUrl: group.repoUrl || "https://github.com/unicodetrack-demo/cybernova-event-hub",
          commitSha: group.branches?.[0]?.latestCommitHash || "7b4c89a",
          requirementsText: project?.requirementsContent || project?.description,
          files: SAMPLE_C_PROJECT_FILES,
          commits: group.commits || [],
          branches: group.branches || [],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI Code Review service returned an error.");
      }

      const newEvaluation: ProjectEvaluation = data.evaluation;
      setEvaluation(newEvaluation);
      saveEvaluation(newEvaluation);
      showToast("Gemini AI code review successfully completed!", "success");
    } catch (err: any) {
      console.error("AI Evaluation error:", err);
      showToast(err.message || "Failed to execute AI code review.", "error");
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  // Lecturer score override handler
  const handleScoreChange = (criterionId: string, val: string) => {
    if (!evaluation) return;
    const num = parseFloat(val);
    if (isNaN(num)) return;

    const targetCriterion = evaluation.criterionScores.find((c) => c.criterionId === criterionId);
    if (!targetCriterion) return;

    const bounded = Math.max(0, Math.min(targetCriterion.maxMarks, num));

    const updatedCriterionScores = evaluation.criterionScores.map((c) => {
      if (c.criterionId === criterionId) {
        return {
          ...c,
          lecturerScore: bounded,
          finalScore: bounded,
          percentage: Math.round((bounded / c.maxMarks) * 100),
        };
      }
      return c;
    });

    const newTotal = Math.round(updatedCriterionScores.reduce((acc, c) => acc + c.finalScore, 0) * 10) / 10;
    const newPercentage = Math.round((newTotal / evaluation.maxScore) * 100);

    const updated: ProjectEvaluation = {
      ...evaluation,
      criterionScores: updatedCriterionScores,
      totalScore: newTotal,
      percentage: newPercentage,
      status: evaluation.status === "published" ? "published" : "in_review",
    };

    setEvaluation(updated);
    saveEvaluation(updated);
  };

  // Lecturer ER criterion marks change handler (strictly bounds 0 <= marks <= maxMarks)
  const handleERCriterionMarkChange = (criterionId: string, val: string) => {
    const num = parseFloat(val);
    const targetCriterion = activeERRubric.find((c) => c.id === criterionId);
    const max = targetCriterion ? targetCriterion.maxMarks : 15;
    const bounded = isNaN(num) ? 0 : Math.max(0, Math.min(max, num));

    setErCriteriaMarks((prev) => {
      const exists = prev.some((p) => p.criterionId === criterionId);
      if (exists) {
        return prev.map((p) => (p.criterionId === criterionId ? { ...p, marks: bounded } : p));
      }
      return [...prev, { criterionId, marks: bounded }];
    });
  };

  // Run Gemini ER Diagram and SQL Schema Analysis
  const handleRunAIERAnalysis = async (focusSqlOnly = false) => {
    if (!group) return;

    // Use current submission or generate initial sample submission if not yet present
    const subToAnalyze = currentERSubmission || {
      id: `er-sub-${group.id}-demo`,
      projectId,
      groupId: group.id,
      groupNumber: group.groupNumber,
      groupName: group.groupName,
      submittedByName: "Alex Chen",
      submittedByEmail: "alex.chen@student.university.edu",
      fileName: "CS492_Group01_ER_Diagram_v1.pdf",
      fileSize: "2.4 MB",
      fileType: "pdf" as const,
      fileUrl: "/sample-diagrams/cs492-group01-er-v1.pdf",
      version: 1,
      versionNote: "Initial normalized Crow's Foot ER diagram for Symposium Telemetry & Event Management.",
      status: "submitted" as const,
      submittedAt: new Date().toISOString(),
    };

    setIsAnalyzingER(true);
    setErAnalysisProgress(
      focusSqlOnly
        ? "Comparing ER diagram entities and keys with GitHub SQL schema (database/schema.sql)..."
        : "Gemini 2.5 Flash analyzing ER entities, primary keys, cardinalities, and normal forms..."
    );

    try {
      const response = await fetch("/api/ai/analyze-er-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          groupId: group.id,
          submission: subToAnalyze,
          config: project?.databaseDesignConfig,
          sqlFiles: SAMPLE_C_PROJECT_FILES.filter(
            (f) => f.path.endsWith(".sql") || f.path.includes("database")
          ).map((f) => ({ path: f.path, content: f.content })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "ER Diagram analysis service returned an error.");
      }

      const analysis: ERDiagramAIAnalysis = data.analysis;
      saveERAnalysis(subToAnalyze.id, analysis);

      const updatedSub: ERDiagramSubmission = {
        ...subToAnalyze,
        status: "reviewed",
        aiAnalysis: analysis,
      };
      setCurrentERSubmission(updatedSub);

      if (analysis.criterionEvaluations && analysis.criterionEvaluations.length > 0) {
        setErCriteriaMarks(
          analysis.criterionEvaluations.map((c: ERCriterionEvaluation) => ({
            criterionId: c.criterionId,
            marks: c.finalMarks,
            comments: c.explanation,
          }))
        );
      }

      showToast(
        focusSqlOnly
          ? "ER Diagram successfully cross-verified against GitHub SQL schemas!"
          : "Gemini ER diagram analysis completed successfully!",
        "success"
      );
    } catch (err: any) {
      console.error("ER Analysis error:", err);
      showToast(err.message || "Failed to analyze ER diagram.", "error");
    } finally {
      setIsAnalyzingER(false);
      setErAnalysisProgress("");
    }
  };

  // Lecturer saves ER feedback & marks (status: approved or resubmission_requested)
  const handleSaveERFeedback = (decision: "approved" | "resubmission_requested") => {
    if (!currentERSubmission) {
      showToast("No ER diagram submission found to evaluate.", "error");
      return;
    }

    const feedback: ERLecturerFeedback = {
      id: `er-fb-${currentERSubmission.id}`,
      lecturerName: "Dr. Evelyn Reed",
      reviewedAt: new Date().toISOString(),
      approvedMarks: currentERTotalApprovedMarks,
      status: decision === "resubmission_requested" ? "resubmission_requested" : "approved",
      generalComments: erQualitativeComments,
      criterionAdjustedMarks: Object.fromEntries(erCriteriaMarks.map((c) => [c.criterionId, c.marks])),
      allowStudentAIFeedbackView: allowStudentAIFeedback,
      isPublished: false,
    };

    saveERFeedback(currentERSubmission.id, feedback);

    const updatedSub: ERDiagramSubmission = {
      ...currentERSubmission,
      status: decision === "resubmission_requested" ? "resubmission_requested" : "approved",
      lecturerFeedback: feedback,
    };
    setCurrentERSubmission(updatedSub);

    if (decision === "resubmission_requested") {
      showToast("Resubmission requested from student team with comments.", "info");
    } else {
      showToast(`ER diagram evaluation approved with score ${currentERTotalApprovedMarks}/100!`, "success");
    }
  };

  // Publish ER feedback and marks to student group workspace
  const handlePublishERFeedback = () => {
    if (!currentERSubmission) return;

    if (!currentERSubmission.lecturerFeedback) {
      handleSaveERFeedback("approved");
    }

    publishERFeedback(currentERSubmission.id);

    const updatedSub: ERDiagramSubmission = {
      ...currentERSubmission,
      status: "published",
      lecturerFeedback: currentERSubmission.lecturerFeedback
        ? {
            ...currentERSubmission.lecturerFeedback,
            status: "published",
            isPublished: true,
            publishedAt: new Date().toISOString(),
            allowStudentAIFeedbackView: allowStudentAIFeedback,
          }
        : undefined,
    };
    setCurrentERSubmission(updatedSub);
  };

  // Lecturer approves marks
  const handleApproveEvaluation = () => {
    if (!evaluation) return;
    approveEvaluation(evaluation.id, lecturerComments);
    const updated: ProjectEvaluation = {
      ...evaluation,
      status: "approved",
      lecturerComments,
    };
    setEvaluation(updated);
  };

  // Publish marks to students
  const handlePublishEvaluation = () => {
    if (!evaluation) return;
    publishEvaluation(evaluation.id);
    const updated: ProjectEvaluation = {
      ...evaluation,
      status: "published",
      lecturerComments,
      publishedAt: new Date().toISOString(),
    };
    setEvaluation(updated);
  };

  if (!project || !group) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Evaluation Records Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested group could not be located in project records.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Projects
        </Link>
      </div>
    );
  }

  const currentGrade = getLetterGrade(evaluation?.percentage || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            <Link
              href={`/dashboard/projects/${projectId}/groups/${group.id}`}
              className="hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Group Review
            </Link>
            <span>/</span>
            <span className="text-slate-500">{project.courseCode}</span>
            <span>/</span>
            <span className="text-slate-900">{group.groupName}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-teal-600" />
            AI Code Review & Rubric Evaluation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gemini 2.5 Flash academic code evaluation against rubric criteria for{" "}
            <span className="font-semibold text-slate-800">{group.groupName}</span>.
          </p>
        </div>

        {/* Global Action Header Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href={`/dashboard/projects/${projectId}/evaluation/criteria`}>
            <Button variant="outline" className="flex items-center gap-1.5 text-xs border-slate-200">
              <Sliders className="w-3.5 h-3.5 text-slate-600" /> Edit Rubric
            </Button>
          </Link>

          <Button
            onClick={handleRunAICodeReview}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm font-semibold"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Analyzing Code..." : "Review Code with Gemini AI"}
          </Button>

          {evaluation && evaluation.status !== "published" && (
            <>
              <Button
                variant="outline"
                onClick={handleApproveEvaluation}
                className="flex items-center gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Check className="w-3.5 h-3.5" /> Approve Marks
              </Button>
              <Button
                onClick={handlePublishEvaluation}
                className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold"
              >
                <Send className="w-3.5 h-3.5" /> Publish to Students
              </Button>
            </>
          )}

          {evaluation && evaluation.status === "published" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
              <CheckCheck className="w-4 h-4 text-emerald-600" /> Published to Group
            </div>
          )}
        </div>
      </div>

      {/* Progress Message Banner during Gemini Analysis */}
      {isAnalyzing && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-3 text-teal-900 animate-pulse">
          <Sparkles className="w-5 h-5 text-teal-600 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-bold">{analysisProgress}</p>
            <p className="text-xs text-teal-700">
              Evaluating circular buffers, CRC-16 integrity algorithms, compiler safety, and Git telemetry...
            </p>
          </div>
        </div>
      )}

      {/* Top Metadata & Summary Score Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Total Score & Letter Grade Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evaluation Score
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${currentGrade.color}`}
              >
                Grade {currentGrade.grade}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-slate-900">
                {evaluation ? evaluation.totalScore : "--"}
              </span>
              <span className="text-slate-400 font-semibold text-lg">
                / {evaluation ? evaluation.maxScore : rubric.totalMarks}
              </span>
            </div>

            {/* Percentage Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Total Achievement</span>
                <span>{evaluation ? `${evaluation.percentage}%` : "0%"}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${evaluation ? evaluation.percentage : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Status:</span>
            {evaluation?.status === "published" ? (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Published
              </span>
            ) : evaluation?.status === "approved" ? (
              <span className="font-bold text-blue-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Approved
              </span>
            ) : evaluation?.status === "ai_completed" ? (
              <span className="font-bold text-purple-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Completed
              </span>
            ) : (
              <span className="font-bold text-slate-400">Not Evaluated</span>
            )}
          </div>
        </div>

        {/* Group & Repository Context Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{group.groupName}</h3>
                <p className="text-xs text-slate-500">
                  Course: <span className="font-semibold text-slate-700">{project.courseCode}</span> •{" "}
                  {group.members.length} Student Members
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                  <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                  <span>{group.defaultBranch || "main"}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                  <GitCommit className="w-3.5 h-3.5 text-teal-600" />
                  <span>Commit: {evaluation?.commitSha?.slice(0, 7) || "HEAD"}</span>
                </div>
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block mb-1 flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Gemini Academic Code Critique:
              </strong>
              {evaluation?.summary ||
                "Run 'Review Code with Gemini AI' to perform automated code inspection against this project rubric."}
            </div>
          </div>

          {/* Members list */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="font-semibold text-slate-600">Roster:</span>
              {group.members.map((m) => (
                <span
                  key={m.studentId}
                  className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700 shrink-0"
                >
                  {m.fullName}
                </span>
              ))}
            </div>
            {evaluation?.evaluatedAt && (
              <span className="text-[11px] text-slate-400 shrink-0">
                Evaluated {new Date(evaluation.evaluatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("criteria")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "criteria"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Criterion Breakdown ({evaluation?.criterionScores.length || rubric.criteria.length})
        </button>

        <button
          onClick={() => setActiveTab("requirements")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "requirements"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Requirements Coverage ({evaluation?.requirementsCoverage.length || 6})
        </button>

        <button
          onClick={() => setActiveTab("github")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "github"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <GitCommit className="w-4 h-4" />
          GitHub Activity Telemetry
        </button>

        <button
          onClick={() => setActiveTab("er_diagram")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "er_diagram"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Database className="w-4 h-4" />
          ER Diagram & Database ({currentERSubmission ? `v${currentERSubmission.version}` : "v1"})
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "feedback"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Send className="w-4 h-4" />
          Lecturer Feedback & Publishing
        </button>
      </div>

      {/* TAB 1: Criterion Breakdown */}
      {activeTab === "criteria" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="w-4 h-4 text-teal-600" />
              Lecturers can override AI-recommended scores directly in each criterion input. Total marks update dynamically.
            </span>
            <span className="font-semibold text-slate-700">
              Rubric Total: {evaluation ? evaluation.totalScore : "--"} / {rubric.totalMarks}
            </span>
          </div>

          <div className="space-y-4">
            {(evaluation?.criterionScores || rubric.criteria.map((c) => ({
              id: c.id,
              criterionId: c.id,
              criterionName: c.name,
              maxMarks: c.maxMarks,
              aiScore: 0,
              finalScore: 0,
              percentage: 0,
              explanation: "Click 'Review Code with Gemini AI' to generate academic analysis.",
              evidence: [],
              suggestions: [],
            }))).map((scoreItem, idx) => (
              <div
                key={scoreItem.criterionId || idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-100">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{scoreItem.criterionName}</h3>
                      <p className="text-xs text-slate-500">
                        Maximum: <span className="font-semibold text-slate-700">{scoreItem.maxMarks} Marks</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* AI Score Badge */}
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase">AI Suggested</span>
                      <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {scoreItem.aiScore} / {scoreItem.maxMarks}
                      </span>
                    </div>

                    {/* Lecturer Score Input */}
                    <div className="text-right">
                      <label className="text-[11px] font-bold text-slate-600 block uppercase">Approved Mark</label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        max={scoreItem.maxMarks}
                        value={scoreItem.finalScore}
                        onChange={(e) => handleScoreChange(scoreItem.criterionId, e.target.value)}
                        className="w-20 px-3 py-1 bg-teal-50/50 border border-teal-200 rounded-lg text-sm font-black text-teal-800 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-900 font-semibold block mb-1">Pedagogical Evaluation:</strong>
                  {scoreItem.explanation}
                </div>

                {/* Evidence Section */}
                {scoreItem.evidence && scoreItem.evidence.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-teal-600" />
                      Repository Evidence & Code Citations:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {scoreItem.evidence.map((ev, evIdx) => (
                        <div
                          key={evIdx}
                          onClick={() => setInspectingEvidence(ev)}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-xl cursor-pointer transition-all text-xs"
                        >
                          <div className="truncate mr-2">
                            <span className="font-mono font-bold text-teal-700">{ev.file}</span>
                            {ev.functionName && (
                              <span className="text-slate-500 font-mono ml-1">→ {ev.functionName}()</span>
                            )}
                            {ev.lineRange && (
                              <span className="text-slate-400 font-mono text-[11px] ml-1">
                                (L{ev.lineRange})
                              </span>
                            )}
                          </div>
                          <button className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-800 shrink-0">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions Section */}
                {scoreItem.suggestions && scoreItem.suggestions.length > 0 && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-900">
                    <strong className="font-semibold block mb-1 flex items-center gap-1.5 text-amber-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Actionable Recommendations:
                    </strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {scoreItem.suggestions.map((s, sIdx) => (
                        <li key={sIdx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Requirements Coverage */}
      {activeTab === "requirements" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              Requirements Specification Coverage
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gemini comparison between declared academic project requirements and actual implemented C codebase routines.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Academic Requirement</th>
                  <th className="py-3 px-4">Implementation Status</th>
                  <th className="py-3 px-4">Evidence & Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(evaluation?.requirementsCoverage || [
                  {
                    requirement: "FR-1: Real-time Circular Telemetry Ingestion Buffer",
                    status: "Implemented",
                    explanation: "Circular buffer queue with head/tail modulo bounds implemented in src/main.c.",
                  },
                  {
                    requirement: "FR-2: CRC-16 Packet Integrity Verification",
                    status: "Implemented",
                    explanation: "Hardware polynomial checksum calculation verified in src/telemetry.c.",
                  },
                  {
                    requirement: "FR-3: Multi-Channel Analog Sensor Calibration",
                    status: "Implemented",
                    explanation: "ADC conversion routines for temperature and pressure in src/sensor.c.",
                  },
                  {
                    requirement: "FR-4: Anomaly Detection and Notification Flagging",
                    status: "Partial",
                    explanation: "Anomaly flags are printed; dedicated alert log queue requires completion.",
                  },
                  {
                    requirement: "FR-5: Persistent File System Logging & Offline Storage",
                    status: "Missing",
                    explanation: "No persistent file I/O operations (fopen/fwrite) found in retrieved files.",
                  },
                  {
                    requirement: "NFR-1: Zero Memory Leaks & Fixed Stack Allocations",
                    status: "Implemented",
                    explanation: "Bounded static array allocations; clean buffer lifecycle.",
                  },
                ]).map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs">{req.requirement}</td>
                    <td className="py-3 px-4">
                      {req.status === "Implemented" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Implemented
                        </span>
                      ) : req.status === "Partial" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5" /> Partial
                        </span>
                      ) : req.status === "Missing" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          <Info className="w-3.5 h-3.5" /> Unable to verify
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed">{req.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GitHub Activity Telemetry */}
      {activeTab === "github" && (
        <div className="space-y-6">
          {/* Academic Caveat Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-blue-900 text-xs">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-blue-950 block mb-0.5">Academic Collaboration Policy Notice:</strong>
              GitHub activity metrics are supporting collaborative telemetry indicators, not the sole determinant of individual marks. Faculty evaluate algorithm correctness, code quality, and defense presentations alongside repository participation.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-600" />
                Repository Velocity
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Repository Name</span>
                  <span className="font-mono font-semibold text-slate-900">{group.repoName || "cybernova-event-hub"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Total Commits</span>
                  <span className="font-bold text-teal-700">{group.totalCommits || 80} commits</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Branches</span>
                  <span className="font-semibold text-slate-900">{group.branches?.length || 3} active</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Default Branch</span>
                  <span className="font-mono font-semibold text-slate-900">{group.defaultBranch || "main"}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Gemini Qualitative Git Analysis
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {evaluation?.gitTelemetryAnalysis ||
                  "Repository exhibits regular commit velocity across development phases. Commits are distributed across team members with descriptive commit messages following conventional commits."}
              </p>

              {/* Contributor Distribution */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Member Contribution Breakdown</h4>
                <div className="space-y-2">
                  {group.members.map((m) => {
                    const pct = Math.round((m.commitsCount / (group.totalCommits || 80)) * 100);
                    return (
                      <div key={m.studentId} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">{m.fullName}</span>
                          <span className="text-slate-500 font-mono">
                            {m.commitsCount} commits ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ER Diagram & Database Design Evaluation */}
      {activeTab === "er_diagram" && (
        <div className="space-y-6">
          {/* ER Progress Banner */}
          {isAnalyzingER && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-3 text-teal-900 animate-pulse">
              <Sparkles className="w-5 h-5 text-teal-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-bold">{erAnalysisProgress}</p>
                <p className="text-xs text-teal-700">
                  Auditing entity cardinalities, composite primary keys, 1NF/2NF/3NF dependencies, and DDL consistency with database/schema.sql...
                </p>
              </div>
            </div>
          )}

          {/* Submission Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                    Database Specification & ER Model
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    Version {currentERSubmission?.version || 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 uppercase">
                    {currentERSubmission?.fileType || "pdf"}
                  </span>
                  {currentERSubmission?.fileSize && (
                    <span className="text-xs text-slate-400 font-mono">
                      {currentERSubmission.fileSize}
                    </span>
                  )}
                  {/* Status Badge */}
                  {currentERSubmission?.status === "published" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCheck className="w-3.5 h-3.5" /> Published
                    </span>
                  ) : currentERSubmission?.status === "approved" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Check className="w-3.5 h-3.5" /> Marks Approved
                    </span>
                  ) : currentERSubmission?.status === "resubmission_requested" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <RotateCcw className="w-3.5 h-3.5" /> Resubmission Requested
                    </span>
                  ) : currentERSubmission?.status === "reviewed" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <Sparkles className="w-3.5 h-3.5" /> AI Evaluated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> Awaiting Review
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-600" />
                  {currentERSubmission?.fileName || "CS492_Group01_ER_Diagram_v1.pdf"}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Submitted by{" "}
                  <span className="font-semibold text-slate-800">
                    {currentERSubmission?.submittedByName || "Alex Chen"}
                  </span>{" "}
                  • {currentERSubmission?.submittedAt ? new Date(currentERSubmission.submittedAt).toLocaleString() : "Recently"}
                </p>

                {currentERSubmission?.versionNote && (
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{currentERSubmission.versionNote}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={currentERSubmission?.fileUrl || "#"}
                  download={currentERSubmission?.fileName || "er-diagram.pdf"}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" /> Download Diagram
                </a>

                <Button
                  onClick={() => handleRunAIERAnalysis(false)}
                  disabled={isAnalyzingER}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm font-semibold text-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingER ? "animate-spin" : ""}`} />
                  {isAnalyzingER ? "Analyzing..." : "Run AI ER Analysis"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleRunAIERAnalysis(true)}
                  disabled={isAnalyzingER}
                  className="flex items-center gap-1.5 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 font-semibold"
                >
                  <Code className="w-3.5 h-3.5" /> Compare With GitHub Code
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSaveERFeedback("resubmission_requested")}
                  className="flex items-center gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Request Resubmission
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSaveERFeedback("approved")}
                  className="flex items-center gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
                >
                  <Check className="w-3.5 h-3.5" /> Approve Evaluation
                </Button>

                <Button
                  onClick={handlePublishERFeedback}
                  disabled={currentERSubmission?.status === "published"}
                  className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold"
                >
                  <Send className="w-3.5 h-3.5" /> Publish to Students
                </Button>
              </div>
            </div>

            {/* Score & Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {/* AI Suggested Score */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                    AI Suggested Score
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-purple-900">
                      {currentERSubmission?.aiAnalysis?.totalSuggestedScore !== undefined
                        ? currentERSubmission.aiAnalysis.totalSuggestedScore
                        : 85}
                    </span>
                    <span className="text-sm font-bold text-purple-400">/ 100</span>
                  </div>
                </div>
                <p className="text-[11px] text-purple-600 mt-2">
                  Strict application sum of 7 rubric criteria marks.
                </p>
              </div>

              {/* Approved Marks */}
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                    Approved Marks
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-teal-900">
                      {currentERTotalApprovedMarks}
                    </span>
                    <span className="text-sm font-bold text-teal-400">/ {maxERTotalMarks}</span>
                  </div>
                </div>
                <p className="text-[11px] text-teal-600 mt-2">
                  Dynamic lecturer score across customized criteria.
                </p>
              </div>

              {/* Normalization & Key Metrics */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Database Normalization
                  </span>
                  <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                    3NF (Normalized)
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {currentERSubmission?.aiAnalysis?.issues?.length || 3}
                  </span>{" "}
                  Issues Found •{" "}
                  <span className="font-semibold text-slate-800">
                    {currentERSubmission?.aiAnalysis?.criterionEvaluations?.length || 7}
                  </span>{" "}
                  Criteria Evaluated
                </div>
              </div>

              {/* Status & Publication Control */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Workspace Visibility
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {currentERSubmission?.status === "published"
                      ? "Visible to Student Group"
                      : "Internal Faculty Draft"}
                  </p>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowStudentAIFeedback}
                    onChange={(e) => setAllowStudentAIFeedback(e.target.checked)}
                    className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-600">Students can view AI analysis</span>
                </label>
              </div>
            </div>

            {/* Sub-Metrics Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Diagram Completeness</span>
                  <span>{currentERSubmission?.aiAnalysis?.completenessScore || 90}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500"
                    style={{ width: `${currentERSubmission?.aiAnalysis?.completenessScore || 90}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Key & Cardinality Correctness</span>
                  <span>{currentERSubmission?.aiAnalysis?.overallCorrectnessScore || 85}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${currentERSubmission?.aiAnalysis?.overallCorrectnessScore || 85}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>SQL Implementation Consistency</span>
                  <span>{currentERSubmission?.aiAnalysis?.implementationConsistencyScore || 80}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${currentERSubmission?.aiAnalysis?.implementationConsistencyScore || 80}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Executive Pedagogical Summary */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block mb-1 flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Gemini ER & Database Architecture Evaluation:
              </strong>
              {currentERSubmission?.aiAnalysis?.summary ||
                "Comprehensive relational architecture modeling symposium events, real-time sensor telemetry, and attendee registrations. Normalization conforms to 3NF standards with well-isolated attributes. Please review foreign key constraints and index coverage in database/schema.sql."}
            </div>
          </div>

          {/* Missing Elements Checklist */}
          {currentERSubmission?.aiAnalysis && (
            (currentERSubmission.aiAnalysis.missingEntities && currentERSubmission.aiAnalysis.missingEntities.length > 0) ||
            (currentERSubmission.aiAnalysis.incorrectKeys && currentERSubmission.aiAnalysis.incorrectKeys.length > 0) ||
            (currentERSubmission.aiAnalysis.cardinalityProblems && currentERSubmission.aiAnalysis.cardinalityProblems.length > 0)
          ) && (
            <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Missing or Incomplete Database Elements Checklist
              </h4>
              <p className="text-xs text-slate-500">
                Elements specified in academic rubric or SQL requirements that were omitted or incomplete in the submitted ER diagram:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {currentERSubmission.aiAnalysis.missingEntities?.map((elem: string, idx: number) => (
                  <div
                    key={`me-${idx}`}
                    className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5 text-xs text-slate-700"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Missing Entity: <strong className="text-amber-900">{elem}</strong></span>
                  </div>
                ))}
                {currentERSubmission.aiAnalysis.incorrectKeys?.map((elem: string, idx: number) => (
                  <div
                    key={`ik-${idx}`}
                    className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5 text-xs text-slate-700"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Key Discrepancy: <strong className="text-amber-900">{elem}</strong></span>
                  </div>
                ))}
                {currentERSubmission.aiAnalysis.cardinalityProblems?.map((elem: string, idx: number) => (
                  <div
                    key={`cp-${idx}`}
                    className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5 text-xs text-slate-700"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Cardinality Concern: <strong className="text-amber-900">{elem}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues List with Severity Badges & SQL Code Evidence */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-teal-600" />
                  Identified ER Issues & Architectural Deficiencies
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Categorized by severity and verified against the GitHub DDL implementation.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {currentERSubmission?.aiAnalysis?.issues?.length || 3} Issues Reported
              </span>
            </div>

            <div className="space-y-3">
              {(
                currentERSubmission?.aiAnalysis?.issues || [
                  {
                    id: "er-iss-1",
                    severity: "Major",
                    category: "relationships",
                    title: "Implicit Many-to-Many Relationship Without Associative Table",
                    explanation:
                      "Symposium Events and Attendees are modeled as a direct M:N relationship in the diagram, but relational implementation requires an explicit junction table (event_registrations).",
                    expectedCorrection:
                      "Introduce an associative table 'event_registrations' with composite primary key or surrogate key to normalize the M:N relationship to 3NF.",
                    confidenceLevel: "High",
                    status: "Definitely incorrect",
                    relevantCodeFile: "database/schema.sql",
                    codeLineRange: "24-38",
                  },
                  {
                    id: "er-iss-2",
                    severity: "Minor",
                    category: "sql_implementation",
                    title: "Missing Index on Foreign Key column sensor_telemetry.event_id",
                    explanation:
                      "While the foreign key constraint exists in schema.sql, there is no corresponding B-tree index on event_id for high-throughput telemetric lookups.",
                    expectedCorrection:
                      "Add 'CREATE INDEX idx_telemetry_event ON sensor_telemetry(event_id);' to avoid sequential scans during sensor analytics queries.",
                    confidenceLevel: "High",
                    status: "Potentially incorrect",
                    relevantCodeFile: "database/schema.sql",
                    codeLineRange: "40-49",
                  },
                  {
                    id: "er-iss-3",
                    severity: "Suggestion",
                    category: "normalization",
                    title: "Consider Enumeration Type for Event Status",
                    explanation:
                      "Status field in symposium_events uses VARCHAR(32) without a CHECK constraint, permitting arbitrary status strings.",
                    expectedCorrection:
                      "Use a PostgreSQL ENUM or VARCHAR CHECK constraint ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').",
                    confidenceLevel: "Medium",
                    status: "Cannot determine from diagram",
                  },
                ]
              ).map((issue: ERDiagramIssue, idx: number) => {
                const severityStyle =
                  issue.severity === "Critical"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : issue.severity === "Major"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : issue.severity === "Minor"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <div
                    key={issue.id || idx}
                    className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-xl border border-slate-200 transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${severityStyle}`}
                        >
                          {issue.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white text-slate-600 border border-slate-200 uppercase">
                          {issue.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                          Status: <strong className="text-slate-800">{issue.status}</strong>
                        </span>
                      </div>

                      {issue.relevantCodeFile && (
                        <button
                          onClick={() => setInspectingERIssue(issue)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 transition-all"
                        >
                          <FileCode className="w-3.5 h-3.5 text-teal-600" />
                          View in SQL Schema ({issue.relevantCodeFile})
                        </button>
                      )}
                    </div>

                    <h5 className="font-bold text-slate-900 text-sm">{issue.title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">{issue.explanation}</p>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                      <strong className="text-teal-700 font-semibold block mb-0.5">
                        Academic Recommendation:
                      </strong>
                      {issue.expectedCorrection}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rubric Marks Editor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  ER Diagram & Database Rubric Evaluation
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lecturer approved marks are bounded 0 to maxMarks. Total score dynamically recalculates.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Approved Score</span>
                <span className="text-lg font-black text-teal-700">
                  {currentERTotalApprovedMarks} / {maxERTotalMarks}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {activeERRubric.map((criterion, idx) => {
                const currentMarkObj = erCriteriaMarks.find((m) => m.criterionId === criterion.id);
                const currentMark = currentMarkObj !== undefined ? currentMarkObj.marks : Math.round(criterion.maxMarks * 0.85);

                const aiCriterionEval = currentERSubmission?.aiAnalysis?.criterionEvaluations?.find(
                  (c: ERCriterionEvaluation) => c.criterionId === criterion.id
                );
                const aiSuggestedMark = aiCriterionEval ? aiCriterionEval.finalMarks : Math.round(criterion.maxMarks * 0.85);
                const pedagogicalComment =
                  aiCriterionEval?.explanation ||
                  "Well structured entity modeling complying with academic database design principles.";

                return (
                  <div
                    key={criterion.id || idx}
                    className="p-5 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-100">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{criterion.name}</h5>
                          <span className="text-xs text-slate-500">
                            Maximum Marks: <strong className="text-slate-700">{criterion.maxMarks}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* AI Suggested Mark */}
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                            AI Suggested
                          </span>
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            {aiSuggestedMark} / {criterion.maxMarks}
                          </span>
                        </div>

                        {/* Approved Mark Input */}
                        <div className="text-right">
                          <label className="text-[10px] font-bold text-slate-600 block uppercase">
                            Approved Mark
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={criterion.maxMarks}
                            value={currentMark}
                            onChange={(e) => handleERCriterionMarkChange(criterion.id, e.target.value)}
                            className="w-20 px-3 py-1 bg-white border border-teal-200 rounded-lg text-sm font-black text-teal-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                      <strong className="text-slate-800 font-semibold block mb-0.5">
                        Pedagogical Critique:
                      </strong>
                      {pedagogicalComment}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lecturer Qualitative Feedback & Publication Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-teal-600" />
                Lecturer Official Evaluation Comments & Decision
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                These comments and final approved marks will be delivered to the student group workspace upon publication.
              </p>
            </div>

            <textarea
              rows={4}
              value={erQualitativeComments}
              onChange={(e) => setErQualitativeComments(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
              placeholder="Enter constructive faculty feedback, database design recommendations, or defense notes..."
            />

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Evaluation Status & Student Release
                </span>
                <p className="text-xs text-slate-500">
                  Total Approved Marks: <strong className="text-teal-700">{currentERTotalApprovedMarks} / {maxERTotalMarks}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => handleSaveERFeedback("resubmission_requested")}
                  className="flex items-center gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Request Resubmission
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSaveERFeedback("approved")}
                  className="flex items-center gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Check className="w-3.5 h-3.5" /> Approve Draft
                </Button>
                <Button
                  onClick={handlePublishERFeedback}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Publish to Student Workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Lecturer Feedback & Publishing */}
      {activeTab === "feedback" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-600" />
              Lecturer Official Feedback & Publishing
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add qualitative feedback comments and finalize approval before publishing marks to the group workspace.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Lecturer Qualitative Comments & Instructions (Visible to Students upon Publishing)
            </label>
            <textarea
              rows={4}
              value={lecturerComments}
              onChange={(e) => setLecturerComments(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
              placeholder="Provide faculty feedback, defense scheduling notes, and constructive guidance..."
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Publication Security Control</span>
              <p className="text-xs text-slate-500">
                Students will only see final approved marks after you click &ldquo;Publish to Students&rdquo;.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleApproveEvaluation}
                className="flex items-center gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Check className="w-3.5 h-3.5" /> Approve Draft
              </Button>
              <Button
                onClick={handlePublishEvaluation}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Publish to Group Workspace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Code Evidence Inspection Modal */}
      {inspectingEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileCode2 className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-teal-300">{inspectingEvidence.file}</span>
                {inspectingEvidence.lineRange && (
                  <span className="text-slate-400">Lines {inspectingEvidence.lineRange}</span>
                )}
              </div>
              <button
                onClick={() => setInspectingEvidence(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Referenced Function / Routine
                </h4>
                <p className="font-mono text-sm font-bold text-slate-900">
                  {inspectingEvidence.functionName ? `${inspectingEvidence.functionName}()` : "Global Scope"}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Code Snippet / Architectural Context
                </h4>
                <div className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
                  <pre>{inspectingEvidence.snippet || "// Routine verified under Gemini AST code review."}</pre>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setInspectingEvidence(null)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded-xl"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ER Diagram Issue SQL Schema Evidence Modal */}
      {inspectingERIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileCode className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-teal-300">
                  {inspectingERIssue.relevantCodeFile || "database/schema.sql"}
                </span>
                {inspectingERIssue.codeLineRange && (
                  <span className="text-slate-400">Lines {inspectingERIssue.codeLineRange}</span>
                )}
              </div>
              <button
                onClick={() => setInspectingERIssue(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      inspectingERIssue.severity === "Critical"
                        ? "bg-rose-100 text-rose-800"
                        : inspectingERIssue.severity === "Major"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {inspectingERIssue.severity}
                  </span>
                  <span className="text-xs text-slate-500 font-mono uppercase">
                    {inspectingERIssue.category} • {inspectingERIssue.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{inspectingERIssue.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{inspectingERIssue.explanation}</p>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  SQL Schema Code Evidence
                </h5>
                <div className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-60 leading-relaxed">
                  <pre>
                    {SAMPLE_C_PROJECT_FILES.find((f) => f.path.includes("schema.sql"))?.content ||
                      "-- CREATE TABLE event_registrations (\n--   id SERIAL PRIMARY KEY,\n--   attendee_id INTEGER NOT NULL REFERENCES attendees(id),\n--   event_id INTEGER NOT NULL REFERENCES symposium_events(id)\n-- );"}
                  </pre>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs text-teal-900">
                <strong className="text-teal-950 font-semibold block mb-0.5">Faculty Guidance & Correction:</strong>
                {inspectingERIssue.expectedCorrection}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setInspectingERIssue(null)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded-xl"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LecturerEvaluationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading AI Evaluation...</div>}>
      <EvaluationReviewContent />
    </Suspense>
  );
}

