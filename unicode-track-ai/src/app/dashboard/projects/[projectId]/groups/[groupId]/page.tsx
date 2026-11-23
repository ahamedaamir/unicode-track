"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FolderGit2,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Check,
  RefreshCw,
  GitBranch,
  GitCommit,
  Terminal,
  Play,
  Copy,
  Clock,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Info,
  Layers,
  FileCode2,
  Cpu,
  Sparkles,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SAMPLE_C_PROJECT_FILES, RepositoryFileNode } from "@/services/github/repositories";

function LecturerGroupReviewContent() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const groupId = params?.groupId as string;

  const {
    projects,
    courses,
    groups,
    reviewProposal,
    syncGroupRepo,
    getEvaluationForGroup,
  } = useAdminData();

  // Find project and group
  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;
  const group = groups.find((g) => g.id === groupId) || groups.find((g) => g.projectId === projectId) || groups[0];

  // Active review tab
  const [activeTab, setActiveTab] = useState<"overview" | "commits" | "code_review">("overview");

  // Proposal evaluation form state
  const [feedbackDecision, setFeedbackDecision] = useState<"approved" | "changes_requested">("approved");
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackScore, setFeedbackScore] = useState("92");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Code review file tree state
  const [selectedFile, setSelectedFile] = useState<RepositoryFileNode>(
    SAMPLE_C_PROJECT_FILES[0]?.children?.[0] || SAMPLE_C_PROJECT_FILES[0]
  );
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [copiedCode, setCopiedCode] = useState(false);

  // C Program execution state
  const [stdinInput, setStdinInput] = useState("");
  const [isRunningC, setIsRunningC] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    status: string;
    compilationStatus: string;
    stdout: string;
    stderr: string;
    executionTimeSeconds: string;
    exitCode: number;
    error?: string;
  } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  if (!project || !group) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Group Not Found</h2>
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

  // Handle proposal review submission
  const handleReviewProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComments.trim()) {
      alert("Please provide constructive feedback comments before submitting evaluation.");
      return;
    }

    setIsSubmittingReview(true);
    reviewProposal(
      group.id,
      feedbackDecision,
      feedbackComments,
      parseInt(feedbackScore, 10) || 85
    );
    setIsSubmittingReview(false);
  };

  // Handle repository sync
  const handleSync = async () => {
    setIsSyncing(true);
    await syncGroupRepo(group.id);
    setIsSyncing(false);
  };

  // Handle running C program
  const handleRunCProgram = async () => {
    if (!selectedFile.content) {
      alert("Please select a valid C source file (.c) to execute.");
      return;
    }

    setIsRunningC(true);
    setExecutionResult(null);

    try {
      const res = await fetch("/api/code/run-c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: selectedFile.content,
          stdin: stdinInput,
          filename: selectedFile.name,
        }),
      });

      const data = await res.json();
      setExecutionResult(data);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        status: "network_error",
        compilationStatus: "Network Failure",
        stdout: "",
        stderr: err.message || "Failed to communicate with C execution sandbox service.",
        executionTimeSeconds: "0.000",
        exitCode: 1,
      });
    } finally {
      setIsRunningC(false);
    }
  };

  const handleCopyCode = () => {
    if (!selectedFile.content) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-teal-700">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/dashboard/projects" className="hover:text-teal-700">Projects</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href={`/dashboard/projects/${project.id}`} className="hover:text-teal-700 font-semibold text-teal-700">
            {project.courseCode}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{group.groupName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/projects/${project.id}/groups/${group.id}/evaluation`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rubric Evaluation</span>
          </Link>

          <Link
            href={`/dashboard/projects/${project.id}/workspace`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-all shadow-2xs"
          >
            <span>Open Student Workspace</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Batch View
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0B1220] text-white">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                {group.groupName}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <BookOpen className="w-3.5 h-3.5" />
                {project.courseCode} — {course?.name || "Curriculum Course"}
              </span>

              {group.repoStatus === "connected" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
                  GitHub: {group.repoName} ({group.totalCommits} commits)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-600" />
                  Repository Not Connected
                </span>
              )}

              {group.proposalStatus === "approved" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Proposal Approved
                </span>
              ) : group.proposalStatus === "changes_requested" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Changes Requested
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Proposal Submitted
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] tracking-tight">
              {project.title}
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed max-w-4xl">
              Faculty evaluation console for reviewing proposal specifications, student git telemetry, source code inspection, and C program sandbox execution.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 lg:w-72 shrink-0 space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cohort Group Status</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Milestone Progress</span>
                <span className="text-teal-600">{group.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${group.progress}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Team Size:</span>
                <span className="font-semibold text-slate-900">{group.members.length} Enrolled Students</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Deadline:</span>
                <span className="font-semibold text-slate-900">{project.deadline || "Dec 15, 2026"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Overview & Proposal Evaluation
          </button>

          <button
            onClick={() => setActiveTab("commits")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "commits"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            GitHub Telemetry & Commits ({group.totalCommits})
          </button>

          <button
            onClick={() => setActiveTab("code_review")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "code_review"
                ? "bg-teal-600 text-white shadow-xs shadow-teal-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            C Code Viewer & Runner
          </button>

          <Link
            href={`/dashboard/projects/${project.id}/groups/${group.id}/evaluation`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all sm:ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            AI Rubric Evaluation ({group.evaluationScore ? `${group.evaluationScore}/100` : "Run Review"})
            <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & PROPOSAL EVALUATION                          */}
      {/* ============================================================== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Student Group Roster */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  Assigned Student Members ({group.members.length})
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Workspace ID: {group.workspaceId}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {group.members.map((member) => (
                  <div
                    key={member.email}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{member.fullName}</span>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>ID: {member.studentId}</span>
                        <span>{member.commitsCount} commits</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal Evaluation Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Capstone Proposal Review & Grading
                </h3>
                {group.proposal && (
                  <Badge
                    variant={group.proposal.status === "approved" ? "teal" : group.proposal.status === "changes_requested" ? "warning" : "default"}
                    size="sm"
                  >
                    {group.proposal.status === "approved" ? "Proposal Approved" : group.proposal.status === "changes_requested" ? "Revision Required" : "Awaiting Evaluation"}
                  </Badge>
                )}
              </div>

              {group.proposal ? (
                <div className="space-y-4">
                  {/* Proposal Document details */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        PDF
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{group.proposal.title}</h4>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                            v{group.proposal.version}.0
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          File: <strong>{group.proposal.fileName}</strong> ({group.proposal.fileSize}) • Submitted by {group.proposal.submittedBy}
                        </p>
                      </div>
                    </div>

                    <a
                      href="#download"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Downloading proposal document: ${group.proposal?.fileName}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Proposal
                    </a>
                  </div>

                  {/* Proposal Description */}
                  {group.proposal.description && (
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-600">
                      <strong className="block text-slate-900 text-[11px] uppercase font-bold mb-1">Abstract:</strong>
                      <p className="leading-relaxed">{group.proposal.description}</p>
                    </div>
                  )}

                  {/* Lecturer Evaluation Form */}
                  <form onSubmit={handleReviewProposal} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Faculty Decision & Evaluation
                    </h4>

                    {/* Decision selection */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <label
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2 ${
                          feedbackDecision === "approved"
                            ? "border-teal-500 bg-teal-50/30 text-teal-950 font-bold"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="decision"
                          value="approved"
                          checked={feedbackDecision === "approved"}
                          onChange={() => setFeedbackDecision("approved")}
                          className="text-teal-600"
                        />
                        <span>Approve Proposal</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2 ${
                          feedbackDecision === "changes_requested"
                            ? "border-rose-500 bg-rose-50/30 text-rose-950 font-bold"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="decision"
                          value="changes_requested"
                          checked={feedbackDecision === "changes_requested"}
                          onChange={() => setFeedbackDecision("changes_requested")}
                          className="text-rose-600"
                        />
                        <span>Request Revisions</span>
                      </label>
                    </div>

                    {/* Score and Comments */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-1 space-y-1">
                        <label className="block font-semibold text-slate-700">Rubric Score (/100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={feedbackScore}
                          onChange={(e) => setFeedbackScore(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="block font-semibold text-slate-700">
                          Constructive Review Comments <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Provide architectural feedback, risk flags, or specific revision guidelines..."
                          value={feedbackComments}
                          onChange={(e) => setFeedbackComments(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={isSubmittingReview}
                        icon={<Check className="w-4 h-4" />}
                      >
                        {isSubmittingReview ? "Submitting..." : "Submit Evaluation & Send to Group"}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No project proposal submitted yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Students will upload their capstone PDF specification from the shared workspace.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Contribution Breakdown & Guidelines */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Git Contribution Telemetry
                </span>
                <span className="font-mono text-xs font-bold text-teal-700">{group.totalCommits} Total Commits</span>
              </div>

              <div className="space-y-3">
                {group.members.map((m) => {
                  const total = group.totalCommits || 1;
                  const pct = Math.min(100, Math.round((m.commitsCount / total) * 100));

                  return (
                    <div key={m.email} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{m.fullName}</span>
                        <span className="font-mono text-teal-700 font-semibold">{m.commitsCount} commits ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Academic Advisory Notice */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Academic Evaluation Guideline:</strong> GitHub statistics are advisory collaboration indicators and should not be used as the sole determinant of individual student marks.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Faculty Shortcuts</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("code_review")}
                className="w-full justify-start text-xs"
                icon={<Terminal className="w-4 h-4 text-teal-600" />}
              >
                Launch C Code Review Console
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("commits")}
                className="w-full justify-start text-xs"
                icon={<GitCommit className="w-4 h-4 text-indigo-600" />}
              >
                Inspect Commit Stream
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GITHUB REPOSITORY & COMMITS                            */}
      {/* ============================================================== */}
      {activeTab === "commits" && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-teal-600" />
                Repository Telemetry & Commit History
              </h3>
              <p className="text-xs text-slate-500">
                Direct branch inspection from {group.repoUrl || "connected repository"}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-700"
              >
                {(group.branches || []).map((b) => (
                  <option key={b.name} value={b.name}>
                    branch: {b.name} {b.isDefault ? "(default)" : ""}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />}
              >
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>
            </div>
          </div>

          {/* Commits Table */}
          <div className="space-y-2">
            {(group.commits || []).map((commit) => (
              <div
                key={commit.hash}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <GitCommit className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{commit.message}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Committed by <strong className="text-slate-800">{commit.author}</strong> on {new Date(commit.date).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                    {commit.branch}
                  </span>
                  <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {commit.shortHash}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SOURCE CODE VIEWER & C PROGRAM EXECUTION                */}
      {/* ============================================================== */}
      {activeTab === "code_review" && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-teal-600" />
                C Source Code Review & Isolated Execution
              </h3>
              <p className="text-xs text-slate-500">
                Inspect C source files directly in the browser and run programs securely inside the sandboxed environment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                Compiler: GCC 13.2 (C11)
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunCProgram}
                disabled={isRunningC}
                icon={isRunningC ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              >
                {isRunningC ? "Compiling & Running..." : "Run C Program"}
              </Button>
            </div>
          </div>

          {/* Code Review Layout: File Tree (Left) + Code Viewer (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* File Tree Navigator */}
            <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Repository File Tree
              </span>

              <div className="space-y-1 text-xs font-mono">
                {SAMPLE_C_PROJECT_FILES.map((node) => {
                  if (node.type === "dir") {
                    return (
                      <div key={node.path} className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 px-2 py-1">
                          <FolderGit2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{node.name}/</span>
                        </div>
                        <div className="pl-4 space-y-0.5">
                          {(node.children || []).map((child) => (
                            <button
                              key={child.path}
                              onClick={() => setSelectedFile(child)}
                              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                                selectedFile.path === child.path
                                  ? "bg-teal-50 text-teal-800 font-bold border border-teal-200"
                                  : "text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <FileCode2 className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{child.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={node.path}
                      onClick={() => setSelectedFile(node)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                        selectedFile.path === node.path
                          ? "bg-teal-50 text-teal-800 font-bold border border-teal-200"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <FileCode2 className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{node.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
              {/* Code Viewer Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{selectedFile.path}</span>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedFile.language || "c"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px]"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {/* Code Lines Display */}
              <div className="p-5 font-mono text-xs text-slate-800 bg-[#0B1220] text-slate-100 overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed">
                <pre>
                  <code>{selectedFile.content || "// Select a file to inspect source"}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* C EXECUTION CONSOLE & SANDBOX TERMINAL                         */}
          {/* ============================================================== */}
          <div className="bg-[#0B1220] text-slate-100 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-teal-400" />
                <h4 className="font-bold text-sm text-white">
                  Sandboxed C Execution Terminal ({selectedFile.name})
                </h4>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Isolated Sandbox: 3.0s CPU • 64MB Cap
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunCProgram}
                  disabled={isRunningC}
                  icon={isRunningC ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                >
                  {isRunningC ? "Running..." : "Run Program"}
                </Button>
              </div>
            </div>

            {/* Stdin input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Standard Input (stdin) - optional
              </label>
              <input
                type="text"
                placeholder="Pass optional program input here..."
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            {/* Execution Result Terminal Output */}
            {executionResult ? (
              <div className="space-y-3 pt-2">
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        executionResult.success ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span className="text-slate-300">Status:</span>
                    <strong className={executionResult.success ? "text-emerald-400" : "text-rose-400"}>
                      {executionResult.compilationStatus}
                    </strong>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>Execution: {executionResult.executionTimeSeconds}s</span>
                    <span>Exit code: {executionResult.exitCode}</span>
                  </div>
                </div>

                {/* Stdout Console */}
                <div className="p-4 rounded-xl bg-black/70 border border-slate-800/80 font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {executionResult.stdout || "// No standard output generated."}
                </div>

                {/* Stderr / Compilation errors if any */}
                {executionResult.stderr && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 font-mono text-xs text-rose-300 whitespace-pre-wrap leading-relaxed">
                    <strong className="block text-rose-400 mb-1">Standard Error / Compiler Diagnostic:</strong>
                    {executionResult.stderr}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                Click &ldquo;Run C Program&rdquo; to compile and execute <strong>{selectedFile.name}</strong> inside the secure sandbox environment.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LecturerGroupReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Loading lecturer group review console...</p>
        </div>
      }
    >
      <LecturerGroupReviewContent />
    </Suspense>
  );
}

