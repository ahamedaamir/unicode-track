"use client";

import React, { useState, Suspense } from "react";
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
    showToast,
  } = useAdminData();

  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;
  const group = groups.find((g) => g.id === groupId) || groups.find((g) => g.projectId === projectId) || groups[0];

  const rubric = getRubricForProject(projectId);
  const existingEvaluation = getEvaluationForGroup(groupId) || (group ? getEvaluationForGroup(group.id) : undefined);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"criteria" | "requirements" | "github" | "feedback">("criteria");

  // Code inspection preview modal
  const [inspectingEvidence, setInspectingEvidence] = useState<{
    file: string;
    functionName?: string;
    lineRange?: string;
    snippet?: string;
  } | null>(null);

  // Current Evaluation State
  const [evaluation, setEvaluation] = useState<ProjectEvaluation | undefined>(existingEvaluation);

  // AI Review Running State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");

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

