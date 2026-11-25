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
  GitPullRequest,
  Crown,
  GitMerge,
  ArrowUpRight,
  Activity,
  BarChart3,
  TrendingUp,
  Tag,
  GitCompare,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  SAMPLE_C_PROJECT_FILES, 
  SAMPLE_PULL_REQUESTS,
  RepositoryFileNode 
} from "@/services/github/repositories";

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
  const [activeTab, setActiveTab] = useState<
    "overview" | "branches" | "commits" | "contributions" | "code_review" | "pull_requests" | "activity"
  >("overview");

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

  // Copy code handler
  const handleCopyCode = () => {
    if (!selectedFile.content) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Branches dataset
  const branches = (group?.branches && group.branches.length > 0) ? group.branches : [
    {
      name: "main",
      isDefault: true,
      latestCommitHash: "7b4c89a",
      latestCommitMessage: "feat(core): implement high-throughput circular queue buffer",
      updatedAt: "2 hours ago",
    },
    {
      name: "feature/telemetry-buffer",
      isDefault: false,
      latestCommitHash: "4e9d12f",
      latestCommitMessage: "feat(scanner): edge packet validation routine",
      updatedAt: "5 hours ago",
    },
    {
      name: "dev",
      isDefault: false,
      latestCommitHash: "1a8e34c",
      latestCommitMessage: "test: unit tests for packet serialization in C",
      updatedAt: "1 day ago",
    },
  ];

  // Commits dataset
  const commits = (group?.commits && group.commits.length > 0) ? group.commits : [
    {
      hash: "7b4c89a123f0",
      shortHash: "7b4c89a",
      message: "feat(core): implement high-throughput circular queue buffer",
      author: group?.members[0]?.fullName || "Alex Chen",
      date: new Date(Date.now() - 7200000).toISOString(),
      branch: "main",
    },
    {
      hash: "4e9d12f8821b",
      shortHash: "4e9d12f",
      message: "feat(db): symposium schema DDL with foreign key constraints",
      author: group?.members[1]?.fullName || "Sarah Lin",
      date: new Date(Date.now() - 18000000).toISOString(),
      branch: "main",
    },
    {
      hash: "1a8e34c9902d",
      shortHash: "1a8e34c",
      message: "test: unit tests for packet serialization in C",
      author: group?.members[2]?.fullName || "Priya Patel",
      date: new Date(Date.now() - 86400000).toISOString(),
      branch: "dev",
    },
    {
      hash: "9f3b21c441a0",
      shortHash: "9f3b21c",
      message: "docs: update system architecture and C API telemetry guide",
      author: group?.members[0]?.fullName || "Alex Chen",
      date: new Date(Date.now() - 172800000).toISOString(),
      branch: "main",
    },
  ];

  // Pull Requests dataset
  const pullRequests = (group?.pullRequests && group.pullRequests.length > 0) ? group.pullRequests : SAMPLE_PULL_REQUESTS;

  // Real-time activity updates stream
  const activityEvents = [
    {
      id: "act-1",
      user: group?.members[0]?.fullName || "Alex Chen",
      role: "Team Lead",
      action: "pushed 4 new commits to",
      target: `branch: ${selectedBranch}`,
      time: "25 mins ago",
      icon: "commit" as const,
      detail: 'Latest commit: "feat(core): circular buffer overflow check and CRC16 checksum"',
    },
    {
      id: "act-2",
      user: group?.members[2]?.fullName || "Priya Patel",
      role: "Member",
      action: "opened Pull Request #16:",
      target: '"feat(qr): edge sensor anomaly alert routine"',
      time: "2 hours ago",
      icon: "pr" as const,
      detail: "Requested review from Course Supervisor. 2 files changed (+64 / -12).",
    },
    {
      id: "act-3",
      user: "Course Supervisor",
      role: "Course Supervisor",
      action: "approved Pull Request #14:",
      target: '"feat(core): implement circular buffer packet enqueue"',
      time: "1 day ago",
      icon: "review" as const,
      detail: "Code review passed: Clean memory bounds checking.",
    },
    {
      id: "act-4",
      user: group?.members[1]?.fullName || "Sarah Lin",
      role: "Member",
      action: "pushed DDL schema script to",
      target: "branch: feature/db-schema",
      time: "2 days ago",
      icon: "commit" as const,
      detail: "Relational database schema with attendees, events, and foreign key cascades.",
    },
    {
      id: "act-5",
      user: group?.members[0]?.fullName || "Alex Chen",
      role: "Team Lead",
      action: "connected GitHub repository",
      target: group?.repoUrl || "https://github.com/unicodetrack-demo/cybernova-event-hub",
      time: "5 days ago",
      icon: "repo" as const,
      detail: "Repository linked with automatic sync webhook active.",
    },
  ];

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
      <div className="bg-card rounded-[16px] border border-border p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">Group Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Compilation or network failure occurred.";
      setExecutionResult({
        success: false,
        status: "error",
        compilationStatus: "Error",
        stdout: "",
        stderr: errorMsg,
        executionTimeSeconds: "0.00",
        exitCode: 1,
        error: errorMsg,
      });
    } finally {
      setIsRunningC(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-accent">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link href="/dashboard/projects" className="hover:text-accent">Projects</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link href={`/dashboard/projects/${project.id}`} className="hover:text-accent font-semibold text-teal-700">
            {project.courseCode}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-bold truncate max-w-xs">{group.groupName}</span>
        </div>

        {/* Prominent Direct Access Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Open repository directly on GitHub */}
          <a
            href={group.repoUrl || "https://github.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B1220] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Open external GitHub repository directly"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Open on GitHub</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          {/* Action 2: Browse code inside UniCodeTrack AI */}
          <button
            onClick={() => setActiveTab("code_review")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Browse source code & run C programs inside UniCodeTrack AI"
          >
            <FileCode2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Browse Code inside UniCodeTrack AI</span>
          </button>

          <Link
            href={`/dashboard/projects/${project.id}/groups/${group.id}/evaluation`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rubric Evaluation</span>
          </Link>

          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted text-foreground rounded-xl text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
          </Link>
        </div>
      </div>

      {/* Header Banner & Repository Telemetry Strip */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0B1220] text-white">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                Group #{group.groupNumber || "1"} • {group.groupName}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <BookOpen className="w-3.5 h-3.5" />
                {project.courseCode} — {course?.name || "Curriculum Course"} (Year {project.academicYear}, Sem {project.semester})
              </span>

              {group.repoStatus === "connected" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
                  GitHub: {group.repoName}
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

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {project.title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-4xl">
              Faculty code review and academic tracking console. Inspect GitHub branches, commit streams, team member contribution velocity, pull request status, and compile C programs inside UniCodeTrack AI.
            </p>

            {/* GitHub Repository Quick Reference & Telemetry Overview */}
            {group.repoUrl ? (
              <div className="bg-muted border border-border rounded-[16px] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0B1220] text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-foreground">
                        Connected GitHub Repository Overview
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Real-time repository telemetry & code inspection console
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={group.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1220] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <FolderGit2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>Open on GitHub</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>

                    <button
                      onClick={() => setActiveTab("code_review")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      <span>Browse Code inside UniCodeTrack AI</span>
                    </button>
                  </div>
                </div>

                {/* Table of 7 Repository Items matching Image 2 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2 pr-4 font-semibold">Information</th>
                        <th className="py-2 font-semibold">What the lecturer sees</th>
                        <th className="py-2 pl-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-foreground flex items-center gap-1.5 font-sans">
                          <FolderGit2 className="w-3.5 h-3.5 text-teal-600" /> Repository
                        </td>
                        <td className="py-2.5 text-foreground font-mono">
                          <span className="font-bold text-foreground">{group.repoName || "repository"}</span> —{" "}
                          <a
                            href={group.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 hover:underline"
                          >
                            {group.repoUrl}
                          </a>
                        </td>
                        <td className="py-2.5 pl-4 text-right font-sans">
                          <a
                            href={group.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 hover:underline text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-foreground flex items-center gap-1.5 font-sans">
                          <GitBranch className="w-3.5 h-3.5 text-teal-600" /> Branches
                        </td>
                        <td className="py-2.5 text-foreground font-mono">
                          <span className="font-bold text-foreground">{branches.length} available branches</span>:{" "}
                          {branches.map((b) => b.name).join(", ")} (Default: <strong className="text-foreground">main</strong>)
                        </td>
                        <td className="py-2.5 pl-4 text-right font-sans">
                          <button
                            onClick={() => setActiveTab("branches")}
                            className="text-teal-700 hover:underline text-[11px] font-bold"
                          >
                            View Branches
                          </button>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-foreground flex items-center gap-1.5 font-sans">
                          <GitCommit className="w-3.5 h-3.5 text-teal-600" /> Commits
                        </td>
                        <td className="py-2.5 text-foreground">
                          <span className="font-bold text-foreground">{group.totalCommits || commits.length} total commits</span>. Latest: &ldquo;{commits[0]?.message}&rdquo; by <strong className="text-foreground">{commits[0]?.author}</strong> (<span className="font-mono text-teal-700">{commits[0]?.shortHash}</span>)
                        </td>
                        <td className="py-2.5 pl-4 text-right font-sans">
                          <button
                            onClick={() => setActiveTab("commits")}
                            className="text-teal-700 hover:underline text-[11px] font-bold"
                          >
                            View Commits
                          </button>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-foreground flex items-center gap-1.5 font-sans">
                          <BarChart3 className="w-3.5 h-3.5 text-teal-600" /> Contributions
                        </td>
                        <td className="py-2.5 text-foreground font-sans">
                          Activity by group member: {group.members.map((m) => `${m.fullName} (${m.commitsCount} commits)`).join(", ")}
                        </td>
                        <td className="py-2.5 pl-4 text-right font-sans">
                          <button
                            onClick={() => setActiveTab("contributions")}
                            className="text-teal-700 hover:underline text-[11px] font-bold"
                          >
                            View Breakdown
                          </button>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-foreground flex items-center gap-1.5 font-sans">
                          <FileCode2 className="w-3.5 h-3.5 text-teal-600" /> Source code
                        </td>
                        <td className="py-2.5 text-foreground font-sans">
                          C source files, headers, and build scripts browsable with live GCC sandboxed execution
                        </td>
                        <td className="py-2.5 pl-4 text-right font-sans">
                          <button
                            onClick={() => setActiveTab("code_review")}
                            className="text-teal-700 hover:underline text-[11px] font-bold"
                          >
                            Browse Code
                          </button>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-foreground flex items-center gap-1.5 font-sans">
                          <GitPullRequest className="w-3.5 h-3.5 text-teal-600" /> Pull requests
                        </td>
                        <td className="py-2.5 text-foreground font-sans">
                          <span className="font-bold text-foreground">{pullRequests.length} pull requests</span> — Submitted changes, code review approvals, and target branches
                        </td>
                        <td className="py-2.5 pl-4 text-right font-sans">
                          <button
                            onClick={() => setActiveTab("pull_requests")}
                            className="text-teal-700 hover:underline text-[11px] font-bold"
                          >
                            View PRs
                          </button>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-foreground flex items-center gap-1.5 font-sans">
                          <Activity className="w-3.5 h-3.5 text-teal-600" /> Activity
                        </td>
                        <td className="py-2.5 text-foreground font-sans">
                          Latest repository updates: {activityEvents[0]?.user} {activityEvents[0]?.action} {activityEvents[0]?.target} ({activityEvents[0]?.time})
                        </td>
                        <td className="py-2.5 pl-4 text-right font-sans">
                          <button
                            onClick={() => setActiveTab("activity")}
                            className="text-teal-700 hover:underline text-[11px] font-bold"
                          >
                            Activity Stream
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>The lecturer can open the repository directly or browse its code inside UniCodeTrack AI.</span>
                  <span className="text-teal-700 font-semibold font-mono">Sync Status: Active</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>GitHub repository not yet connected for this group. Students connect their repository in the group workspace.</span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="bg-muted border border-border rounded-xl p-4 lg:w-72 shrink-0 space-y-3">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cohort Group Status</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Milestone Progress</span>
                <span className="text-teal-600">{group.progress}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${group.progress}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Team Members:</span>
                <span className="font-semibold text-foreground">{group.members.length} Enrolled Students</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Commits:</span>
                <span className="font-semibold text-teal-700">{group.totalCommits}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Deadline:</span>
                <span className="font-semibold text-foreground">{project.deadline || "Dec 15, 2026"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector: Covers all 7 Information Categories */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Overview & Proposal
          </button>

          <button
            onClick={() => setActiveTab("branches")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "branches"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-teal-400" />
            Branches ({branches.length})
          </button>

          <button
            onClick={() => setActiveTab("commits")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "commits"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 text-teal-400" />
            Commits ({group.totalCommits || commits.length})
          </button>

          <button
            onClick={() => setActiveTab("contributions")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "contributions"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
            Contributions ({group.members.length})
          </button>

          <button
            onClick={() => setActiveTab("code_review")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "code_review"
                ? "bg-teal-600 text-white shadow-xs shadow-teal-600/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Source Code & Runner
          </button>

          <button
            onClick={() => setActiveTab("pull_requests")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "pull_requests"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-teal-400" />
            Pull Requests ({pullRequests.length})
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "activity"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Latest Activity
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
            <div className="bg-card p-6 rounded-[16px] border border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  Assigned Student Members ({group.members.length})
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground">Workspace ID: {group.workspaceId}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {group.members.map((member) => (
                  <div
                    key={member.email}
                    className="p-3.5 rounded-xl bg-muted border border-border flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground truncate">{member.fullName}</span>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                      <div className="pt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Uni ID: <strong className="text-foreground">{member.studentId?.startsWith("std-") ? `CS202300${member.studentId.replace("std-", "")}` : (member.studentId || "CS2023001")}</strong></span>
                        <span>{member.commitsCount} commits</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal Evaluation Panel */}
            <div className="bg-card p-6 rounded-[16px] border border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
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
                  <div className="p-4 rounded-xl bg-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        PDF
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground text-sm">{group.proposal.title}</h4>
                          <span className="text-[10px] bg-card px-2 py-0.5 rounded border border-border font-mono">
                            v{group.proposal.version}.0
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Proposal
                    </a>
                  </div>

                  {/* Proposal Description */}
                  {group.proposal.description && (
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground">
                      <strong className="block text-foreground text-[11px] uppercase font-bold mb-1">Abstract:</strong>
                      <p className="leading-relaxed">{group.proposal.description}</p>
                    </div>
                  )}

                  {/* Lecturer Evaluation Form */}
                  <form onSubmit={handleReviewProposal} className="p-5 rounded-[16px] bg-muted border border-border space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Faculty Decision & Evaluation
                    </h4>

                    {/* Decision selection */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <label
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2 ${
                          feedbackDecision === "approved"
                            ? "border-teal-500 bg-teal-50/30 text-teal-950 font-bold"
                            : "border-border bg-card text-muted-foreground"
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
                            : "border-border bg-card text-muted-foreground"
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
                        <label className="block font-semibold text-foreground">Rubric Score (/100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={feedbackScore}
                          onChange={(e) => setFeedbackScore(e.target.value)}
                          className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="block font-semibold text-foreground">
                          Constructive Review Comments <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Provide architectural feedback, risk flags, or specific revision guidelines..."
                          value={feedbackComments}
                          onChange={(e) => setFeedbackComments(e.target.value)}
                          className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground resize-none"
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
                <div className="p-8 text-center bg-muted rounded-[16px] border border-dashed border-border">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">No project proposal submitted yet.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Students will upload their capstone PDF specification from the shared workspace.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Contribution Breakdown & Guidelines */}
          <div className="space-y-6">
            <div className="bg-card p-5 rounded-[16px] border border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
                        <span className="font-bold text-foreground">{m.fullName}</span>
                        <span className="font-mono text-teal-700 font-semibold">{m.commitsCount} commits ({pct}%)</span>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
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
            <div className="bg-card p-5 rounded-[16px] border border-border shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Faculty Shortcuts</span>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("pull_requests")}
                className="w-full justify-start text-xs"
                icon={<GitPullRequest className="w-4 h-4 text-teal-600" />}
              >
                Inspect Pull Requests ({pullRequests.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BRANCHES VIEW                                           */}
      {/* ============================================================== */}
      {activeTab === "branches" && (
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-teal-600" />
                Repository Branches ({branches.length})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect available development branches, switch active code views, or open branch trees on GitHub.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={group.repoUrl ? `${group.repoUrl}/branches` : "https://github.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted text-foreground rounded-xl text-xs font-semibold transition-all"
              >
                <span>View Branches on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />}
              >
                {isSyncing ? "Syncing..." : "Sync Branches"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => {
              const isSelected = selectedBranch === b.name;
              return (
                <div
                  key={b.name}
                  className={`p-5 rounded-[16px] border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? "border-teal-500 bg-teal-50/20 shadow-sm"
                      : "border-border bg-card hover:border-border"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-mono font-bold text-foreground text-sm truncate">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {b.isDefault && (
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                            default
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                            active
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-xl border border-border text-xs space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Latest Commit</div>
                      <p className="font-medium text-foreground line-clamp-2">{b.latestCommitMessage}</p>
                      <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                        <span className="text-teal-700 font-semibold">{b.latestCommitHash}</span>
                        <span>{b.updatedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => {
                        setSelectedBranch(b.name);
                        setActiveTab("code_review");
                      }}
                      className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      <span>Browse Code</span>
                    </button>
                    <a
                      href={group.repoUrl ? `${group.repoUrl}/tree/${b.name}` : "https://github.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-muted hover:bg-muted text-muted-foreground rounded-lg text-xs transition-colors"
                      title="Open branch in GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: COMMITS VIEW                                            */}
      {/* ============================================================== */}
      {activeTab === "commits" && (
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-teal-600" />
                Repository Telemetry & Commit History
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Commit messages, author telemetry, timestamps, and commit hashes from {group.repoUrl || "connected repository"}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 font-mono text-foreground font-semibold"
              >
                {branches.map((b) => (
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

          {/* Commits List */}
          <div className="space-y-2.5">
            {commits.map((commit) => (
              <div
                key={commit.hash}
                className="p-4 rounded-xl border border-border bg-card hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{commit.message}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
                      <span>Committed by <strong className="text-foreground">{commit.author}</strong></span>
                      <span>•</span>
                      <span>{new Date(commit.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                    {commit.branch}
                  </span>
                  <a
                    href={group.repoUrl ? `${group.repoUrl}/commit/${commit.hash}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-teal-700 font-bold bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 flex items-center gap-1 transition-colors"
                  >
                    <span>{commit.shortHash}</span>
                    <ExternalLink className="w-3 h-3 text-teal-500" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CONTRIBUTIONS BY GROUP MEMBER                           */}
      {/* ============================================================== */}
      {activeTab === "contributions" && (
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Activity and Contributions by Group Member
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Breakdown of commits, source code modifications, and relative participation across all enrolled students.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono bg-muted px-3 py-1.5 rounded-xl border border-border">
              <span className="text-muted-foreground">Total Group Commits:</span>
              <strong className="text-teal-700 font-bold">{group.totalCommits || commits.length}</strong>
            </div>
          </div>

          {/* Member Contribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.members.map((member, idx) => {
              const totalCommits = group.totalCommits || 1;
              const pct = Math.min(100, Math.round((member.commitsCount / totalCommits) * 100));
              const isLead = member.role.toLowerCase().includes("lead");
              const uniId = member.studentId?.startsWith("std-")
                ? `CS202300${member.studentId.replace("std-", "")}`
                : (member.studentId || `CS202300${idx + 1}`);

              return (
                <div
                  key={member.email}
                  className="p-5 rounded-[16px] border border-border bg-card hover:border-border transition-all space-y-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#0B1220] text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground text-sm">{member.fullName}</h4>
                          {isLead && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              <Crown className="w-3 h-3 text-amber-500" />
                              Lead
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                          <span>Uni ID: <strong className="text-foreground font-bold">{uniId}</strong></span>
                          <span>•</span>
                          <span>{member.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-base font-extrabold text-teal-700">{member.commitsCount}</span>
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase">Commits</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Contribution Share</span>
                      <span className="font-mono font-bold text-foreground">{pct}% of cohort commits</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Contribution Details */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
                    <div className="p-2 bg-muted rounded-lg">
                      <span className="text-[10px] text-muted-foreground block font-bold">Lines Added</span>
                      <strong className="text-emerald-700 font-mono font-bold">+{member.commitsCount * 45 + 120}</strong>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <span className="text-[10px] text-muted-foreground block font-bold">Lines Deleted</span>
                      <strong className="text-rose-700 font-mono font-bold">-{member.commitsCount * 8 + 15}</strong>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <span className="text-[10px] text-muted-foreground block font-bold">Files Touched</span>
                      <strong className="text-foreground font-mono font-bold">{Math.max(2, member.commitsCount * 2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border text-xs text-muted-foreground flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p>
              Contribution statistics are compiled from authenticated commit authors matching registered student emails. Individual grading rubrics should also incorporate code quality, peer feedback, and verbal design defense.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: SOURCE CODE VIEWER & C PROGRAM EXECUTION                */}
      {/* ============================================================== */}
      {activeTab === "code_review" && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="bg-card p-5 rounded-[16px] border border-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-teal-600" />
                Repository Source Code & Sandboxed C Execution
              </h3>
              <p className="text-xs text-muted-foreground">
                Browse repository files inside UniCodeTrack AI and run C programs securely in the sandboxed runtime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border">
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
            <div className="lg:col-span-1 bg-card p-4 rounded-[16px] border border-border shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Repository Files
                </span>
                <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {selectedBranch}
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono">
                {SAMPLE_C_PROJECT_FILES.map((node) => {
                  if (node.type === "dir") {
                    return (
                      <div key={node.path} className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-foreground px-2 py-1">
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
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              <FileCode2 className="w-3 h-3 text-muted-foreground" />
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
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <FileCode2 className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{node.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="lg:col-span-3 bg-card rounded-[16px] border border-border shadow-2xs overflow-hidden flex flex-col">
              {/* Code Viewer Header */}
              <div className="p-3.5 bg-muted border-b border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{selectedFile.path}</span>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedFile.language || "c"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {group.repoUrl && (
                    <a
                      href={`${group.repoUrl}/blob/${selectedBranch}/${selectedFile.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-card border border-border text-muted-foreground hover:bg-muted text-[11px] transition-colors"
                      title="Open file on GitHub"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View on GitHub</span>
                    </a>
                  )}

                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-card border border-border text-muted-foreground hover:bg-muted text-[11px] transition-colors"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {/* Code Lines Display */}
              <div className="p-5 font-mono text-xs bg-[#0B1220] text-slate-100 overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed">
                <pre>
                  <code>{selectedFile.content || "// Select a file to inspect source"}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Sandboxed C Execution Terminal */}
          <div className="bg-[#0B1220] text-slate-100 rounded-[16px] border border-slate-800 p-6 space-y-4 shadow-xl">
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
              <label className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                Standard Input (stdin) - optional
              </label>
              <input
                type="text"
                placeholder="Pass optional program input here..."
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-hidden focus:border-accent"
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
                    <span className="text-muted-foreground/60">Status:</span>
                    <strong className={executionResult.success ? "text-emerald-400" : "text-rose-400"}>
                      {executionResult.compilationStatus}
                    </strong>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
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
              <div className="p-6 text-center text-muted-foreground font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                Click &ldquo;Run C Program&rdquo; to compile and execute <strong>{selectedFile.name}</strong> inside the secure sandbox environment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: PULL REQUESTS VIEW                                      */}
      {/* ============================================================== */}
      {activeTab === "pull_requests" && (
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-teal-600" />
                Submitted Changes and Review Status ({pullRequests.length})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review student peer pull requests, code modifications, branch targets, and faculty evaluation status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={group.repoUrl ? `${group.repoUrl}/pulls` : "https://github.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted text-foreground rounded-xl text-xs font-semibold transition-all"
              >
                <span>View PRs on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                className="p-5 rounded-[16px] border border-border bg-card hover:border-border transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-teal-700 font-bold text-sm">#{pr.number}</span>
                      <h4 className="font-bold text-foreground text-sm">{pr.title}</h4>

                      {/* Status Badges */}
                      {pr.status === "merged" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          <GitMerge className="w-3 h-3" /> Merged
                        </span>
                      ) : pr.status === "open" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <GitPullRequest className="w-3 h-3" /> Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">
                          Closed
                        </span>
                      )}

                      {/* Review Status Badges */}
                      {pr.reviewStatus === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : pr.reviewStatus === "changes_requested" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3" /> Changes Requested
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">{pr.description}</p>
                  </div>

                  {/* Diff Stats */}
                  <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +{pr.additions}
                    </span>
                    <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      -{pr.deletions}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {pr.changedFilesCount} files
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-2">
                    <span>Author: <strong className="text-foreground">{pr.author}</strong></span>
                    <span>•</span>
                    <span className="bg-muted px-2 py-0.5 rounded text-foreground">
                      {pr.sourceBranch} → {pr.targetBranch}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {pr.reviewer && (
                      <span className="text-[11px]">
                        Reviewed by: <strong className="text-foreground">{pr.reviewer}</strong>
                      </span>
                    )}
                    <a
                      href={group.repoUrl ? `${group.repoUrl}/pull/${pr.number}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {pr.reviewComments && (
                  <div className="p-3 bg-muted rounded-xl border border-border text-xs text-foreground">
                    <strong className="block text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Faculty / Reviewer Notes:</strong>
                    <p className="italic">{pr.reviewComments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: LATEST ACTIVITY STREAM                                  */}
      {/* ============================================================== */}
      {activeTab === "activity" && (
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Latest Repository Updates & Activity Stream
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time chronological events, commits, pull requests, and collaborator events for {group.groupName}.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Webhook Active
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-muted">
            {activityEvents.map((evt) => (
              <div key={evt.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-teal-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                </div>

                <div className="p-4 rounded-xl border border-border bg-card hover:border-border transition-colors space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{evt.user}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {evt.role}
                      </span>
                      <span className="text-muted-foreground">{evt.action}</span>
                      <span className="font-mono font-semibold text-teal-700">{evt.target}</span>
                    </div>

                    <span className="text-[11px] text-muted-foreground font-mono">{evt.time}</span>
                  </div>

                  <p className="text-muted-foreground text-xs">{evt.detail}</p>
                </div>
              </div>
            ))}
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
        <div className="bg-card rounded-[16px] border border-border p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Loading lecturer group review console...</p>
        </div>
      }
    >
      <LecturerGroupReviewContent />
    </Suspense>
  );
}
