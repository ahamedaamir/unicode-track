"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  GitBranch,
  GitCommit,
  BarChart3,
  FileCode2,
  GitPullRequest,
  Activity,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Terminal,
  Play,
  Download,
  Info,
  ChevronRight,
  ShieldCheck,
  Folder,
  FileText,
  Code2,
  Crown,
  Sparkles,
} from "lucide-react";
import { ProjectGroup, GroupMember } from "@/types/project";
import { Project } from "@/types/admin";
import {
  SAMPLE_C_PROJECT_FILES,
  SAMPLE_PULL_REQUESTS,
  RepositoryFileNode,
} from "@/services/github/repositories";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface LecturerRepositoryViewerProps {
  group: ProjectGroup;
  project?: Project;
  defaultTab?: "summary" | "branches" | "commits" | "contributions" | "source_code" | "pull_requests" | "activity";
  className?: string;
  onBrowseCodeClick?: () => void;
}

export function LecturerRepositoryViewer({
  group,
  project,
  defaultTab = "summary",
  className = "",
  onBrowseCodeClick,
}: LecturerRepositoryViewerProps) {
  const [activeTab, setActiveTab] = useState<
    "summary" | "branches" | "commits" | "contributions" | "source_code" | "pull_requests" | "activity"
  >(defaultTab);

  const [selectedBranch, setSelectedBranch] = useState("main");
  const [selectedFile, setSelectedFile] = useState<RepositoryFileNode>(
    SAMPLE_C_PROJECT_FILES[0]?.children?.[0] || SAMPLE_C_PROJECT_FILES[0]
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Branches data
  const branches =
    group.branches && group.branches.length > 0
      ? group.branches
      : [
          {
            name: "main",
            isDefault: true,
            latestCommitHash: "7b4c89a",
            latestCommitMessage: "feat(core): implement circular buffer queue & telemetry verification",
            updatedAt: "2 hours ago",
          },
          {
            name: "feature/telemetry-sensor",
            isDefault: false,
            latestCommitHash: "4e9d12f",
            latestCommitMessage: "fix(sensor): calibration routine for raw ADC temperature telemetry",
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

  // Commits data
  const commits =
    group.commits && group.commits.length > 0
      ? group.commits
      : [
          {
            hash: "7b4c89a24fd5e6718a23d45678901234567890ab",
            shortHash: "7b4c89a",
            message: "feat(core): implement high-throughput circular queue buffer",
            author: group.members[0]?.fullName || "Alex Chen",
            date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            branch: "main",
          },
          {
            hash: "4e9d12f89cde789012345678901234567890abcd",
            shortHash: "4e9d12f",
            message: "feat(telemetry): add multi-sensor packet serialization in C",
            author: group.members[1]?.fullName || "Sarah Lin",
            date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
            branch: "main",
          },
          {
            hash: "a31f78bcde901234567890123456789012345678",
            shortHash: "a31f78b",
            message: "refactor(memory): eliminate pointer leaks in dynamic node cleanup",
            author: group.members[2]?.fullName || "Priya Patel",
            date: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            branch: "dev",
          },
          {
            hash: "8c4d21e012345678901234567890123456789012",
            shortHash: "8c4d21e",
            message: "docs(rubric): update README with compilation instructions & Makefile",
            author: group.members[3]?.fullName || "Liam Davis",
            date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            branch: "main",
          },
        ];

  // Pull Requests data
  const pullRequests =
    group.pullRequests && group.pullRequests.length > 0
      ? group.pullRequests
      : SAMPLE_PULL_REQUESTS;

  // Real-time activity events
  const activityEvents = [
    {
      id: "act-1",
      user: group.members[0]?.fullName || "Alex Chen",
      role: "Team Lead",
      action: "pushed 4 new commits to",
      target: `branch: ${selectedBranch}`,
      time: "25 mins ago",
      icon: "commit" as const,
      detail: 'Latest commit: "feat(core): circular buffer overflow check and CRC16 checksum"',
    },
    {
      id: "act-2",
      user: group.members[2]?.fullName || "Priya Patel",
      role: "Member",
      action: "opened Pull Request #16:",
      target: '"feat(qr): edge sensor anomaly alert routine"',
      time: "2 hours ago",
      icon: "pr" as const,
      detail: "Requested review from Course Supervisor. 2 files changed (+64 / -12).",
    },
    {
      id: "act-3",
      user: project?.lecturerName || "Dr. Evelyn Reed",
      role: "Course Supervisor",
      action: "approved Pull Request #14:",
      target: '"feat(core): implement circular buffer packet enqueue"',
      time: "1 day ago",
      icon: "review" as const,
      detail: "Code review passed: Clean memory bounds checking.",
    },
    {
      id: "act-4",
      user: group.members[1]?.fullName || "Sarah Lin",
      role: "Member",
      action: "pushed DDL schema script to",
      target: "branch: feature/db-schema",
      time: "2 days ago",
      icon: "commit" as const,
      detail: "Relational database schema with attendees, events, and foreign key cascades.",
    },
    {
      id: "act-5",
      user: group.members[0]?.fullName || "Alex Chen",
      role: "Team Lead",
      action: "connected GitHub repository",
      target: group.repoUrl || "https://github.com/unicodetrack-demo/cybernova-event-hub",
      time: "5 days ago",
      icon: "repo" as const,
      detail: "Repository linked with automatic sync webhook active.",
    },
  ];

  const repoUrl =
    group.repoUrl ||
    `https://github.com/${group.repoOwner || "unicodetrack-demo"}/${group.repoName || "project-repository"}`;
  const repoName = group.repoName || "cybernova-event-hub";
  const repoOwner = group.repoOwner || "unicodetrack-demo";

  // Handlers
  const handleCopyCode = () => {
    if (!selectedFile.content) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(repoUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSyncRepo = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  const switchToCodeTab = () => {
    setActiveTab("source_code");
    if (onBrowseCodeClick) onBrowseCodeClick();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER & PRIMARY DIRECT ACTIONS                   */}
      {/* ============================================================== */}
      <div className="bg-card text-foreground rounded-[16px] p-6 sm:p-7 shadow-md border border-border space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <FolderGit2 className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs text-teal-400 font-bold tracking-wide">
                {repoOwner} /
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-mono">
                {repoName}
              </h2>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Active
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans max-w-2xl">
              Connected student group repository for <strong className="text-white">{group.groupName}</strong>.
              Supervising lecturers can view repository metadata, available branches, commit streams, team member contribution velocity, source code files, pull request reviews, and real-time activity updates.
            </p>
          </div>

          {/* TWO PRIMARY ACTIONS: Open directly on GitHub OR Browse code inside UniCodeTrack AI */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* ACTION 1: The lecturer can open the repository directly */}
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-700"
              title="Open repository directly on GitHub in a new tab"
            >
              <FolderGit2 className="w-4 h-4 text-teal-400" />
              <span>Open on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* ACTION 2: The lecturer can browse its code inside UniCodeTrack AI */}
            <button
              type="button"
              onClick={switchToCodeTab}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-600/30"
              title="Browse files and syntax-highlighted code inside UniCodeTrack AI"
            >
              <FileCode2 className="w-4 h-4" />
              <span>Browse Code inside UniCodeTrack AI</span>
            </button>
          </div>
        </div>

        {/* Quick Telemetry Pill Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-teal-400" />
              Default Branch: <strong className="text-slate-200">main</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-teal-400" />
              Commits: <strong className="text-slate-200">{group.totalCommits || commits.length}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-teal-400" />
              Pull Requests: <strong className="text-slate-200">{pullRequests.length}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              Contributors: <strong className="text-slate-200">{group.members.length} students</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <button
              onClick={handleCopyUrl}
              className="hover:text-teal-400 transition-colors flex items-center gap-1 font-mono"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">URL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Repo URL</span>
                </>
              )}
            </button>
            <span>•</span>
            <button
              onClick={handleSyncRepo}
              disabled={isSyncing}
              className="hover:text-teal-400 transition-colors flex items-center gap-1 font-mono"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-teal-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Webhook"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TAB NAVIGATION (All 7 Information Categories)               */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-2xs flex flex-wrap items-center gap-1">
        {[
          { id: "summary", label: "Overview Checklist", icon: ShieldCheck, count: null },
          { id: "branches", label: "Branches", icon: GitBranch, count: branches.length },
          { id: "commits", label: "Commits", icon: GitCommit, count: group.totalCommits || commits.length },
          { id: "contributions", label: "Contributions", icon: BarChart3, count: group.members.length },
          { id: "source_code", label: "Source Code", icon: FileCode2, count: null },
          { id: "pull_requests", label: "Pull Requests", icon: GitPullRequest, count: pullRequests.length },
          { id: "activity", label: "Latest Activity", icon: Activity, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? "bg-teal-500/20 text-teal-300 border border-teal-400/20" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SUMMARY SPECIFICATION TABLE (Image 2 Match)              */}
      {/* ============================================================== */}
      {activeTab === "summary" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-teal-600" />
                When students connect their group&apos;s GitHub repository, the lecturer can view:
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full 7-point academic inspection matrix for <strong className="text-slate-700">{group.groupName}</strong> ({group.repoName})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all"
              >
                <span>Open Directly</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={switchToCodeTab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold transition-all"
              >
                <FileCode2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Browse Code</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold text-slate-700 w-44">Information</th>
                  <th className="py-3 px-4 font-bold text-slate-700">What the lecturer sees</th>
                  <th className="py-3 px-4 font-bold text-slate-700 text-right w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {/* 1. Repository */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Repository</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-slate-900 text-xs">{repoName}</div>
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                      >
                        {repoUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-foreground hover:bg-foreground/90 text-background rounded-[10px] text-xs font-bold transition-all shadow-2xs"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>

                {/* 2. Branches */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Branches</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">{branches.length} Available branches:</span>{" "}
                      <span className="font-mono text-slate-700">
                        {branches.map((b) => b.name).join(", ")}
                      </span>{" "}
                      (Default: <strong className="text-teal-700 font-mono">main</strong>)
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab("branches")}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      View Branches &rarr;
                    </button>
                  </td>
                </tr>

                {/* 3. Commits */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Commits</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">{group.totalCommits || commits.length} commits</span>.
                      Latest: &ldquo;{commits[0]?.message}&rdquo; by{" "}
                      <strong className="text-slate-900">{commits[0]?.author}</strong> (
                      <span className="font-mono text-teal-700 font-bold">{commits[0]?.shortHash}</span>)
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab("commits")}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      View Commits &rarr;
                    </button>
                  </td>
                </tr>

                {/* 4. Contributions */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Contributions</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>
                      Activity by group member:{" "}
                      <span className="font-medium text-slate-800">
                        {group.members.map((m) => `${m.fullName} (${m.commitsCount} commits)`).join(", ")}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab("contributions")}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      Breakdown &rarr;
                    </button>
                  </td>
                </tr>

                {/* 5. Source code */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Source code</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>
                      Repository files and code: browsable file tree with syntax-highlighted editor, headers, DDL schemas, and live execution
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={switchToCodeTab}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                    >
                      <span>Browse Code</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>

                {/* 6. Pull requests */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Pull requests</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">{pullRequests.length} pull requests</span> —
                      Submitted changes, code review approvals, source/target branches, and review status
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab("pull_requests")}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      Inspect PRs &rarr;
                    </button>
                  </td>
                </tr>

                {/* 7. Activity */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Activity</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>
                      Latest repository updates:{" "}
                      <strong className="text-slate-900">{activityEvents[0]?.user}</strong>{" "}
                      {activityEvents[0]?.action} <span className="font-mono">{activityEvents[0]?.target}</span> ({activityEvents[0]?.time})
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab("activity")}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      Activity Log &rarr;
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>The lecturer can open the repository directly or browse its code inside UniCodeTrack AI.</span>
            </span>
            <span className="font-mono text-teal-700 font-bold">Automated Webhooks Synchronized</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BRANCHES (Available Branches)                           */}
      {/* ============================================================== */}
      {activeTab === "branches" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-teal-600" />
                Available Branches ({branches.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect available development branches, switch active code views, or open branch trees on GitHub.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`${repoUrl}/branches`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                <span>View Branches on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => {
              const isSelected = selectedBranch === b.name;
              return (
                <div
                  key={b.name}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? "border-teal-500 bg-teal-50/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-mono font-bold text-slate-900 text-sm truncate">{b.name}</span>
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

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Commit</div>
                      <p className="font-medium text-slate-800 line-clamp-2">{b.latestCommitMessage}</p>
                      <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="text-teal-700 font-semibold">{b.latestCommitHash}</span>
                        <span>{b.updatedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranch(b.name);
                        switchToCodeTab();
                      }}
                      className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors text-center"
                    >
                      Browse Code in {b.name}
                    </button>
                    <a
                      href={`${repoUrl}/tree/${b.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                      title="Open branch on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: COMMITS (Commit messages, dates, authors)                */}
      {/* ============================================================== */}
      {activeTab === "commits" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-teal-600" />
                Commit Stream ({commits.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect commit messages, commit dates, author identity, and cryptographic short hashes.
              </p>
            </div>

            <a
              href={`${repoUrl}/commits/${selectedBranch}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all self-start"
            >
              <span>View Full Git Log on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            {commits.map((c) => (
              <div
                key={c.hash}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.shortHash}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                      {c.branch}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3" />
                      {new Date(c.date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 text-sm">{c.message}</p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-sans">
                    <span>Committed by:</span>
                    <strong className="text-slate-900 font-semibold">{c.author}</strong>
                    {c.authorEmail && <span className="text-slate-400 font-mono">({c.authorEmail})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(c.hash);
                      alert(`Copied commit SHA: ${c.hash}`);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono transition-colors"
                    title="Copy full SHA"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`${repoUrl}/commit/${c.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-foreground hover:bg-foreground/90 text-background rounded-[10px] text-xs font-bold transition-all shadow-2xs"
                  >
                    <span>Diff</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CONTRIBUTIONS (Activity by group member)                */}
      {/* ============================================================== */}
      {activeTab === "contributions" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Activity by Group Member ({group.members.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation metrics on team collaboration velocity, commit volume distribution, and individual participation.
              </p>
            </div>

            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Total Commits: {group.totalCommits || commits.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.members.map((member, idx) => {
              const total = group.totalCommits || commits.length || 1;
              const pct = Math.min(100, Math.round((member.commitsCount / total) * 100));
              const isLead = member.role === "Team Lead";

              return (
                <div
                  key={member.email || idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                          isLead ? "bg-teal-600 text-white shadow-2xs" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {member.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{member.fullName}</h4>
                          {isLead && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <p className="text-xs text-slate-500">{member.email}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          ID: <strong className="text-slate-700">{member.studentId || `CS202300${idx + 1}`}</strong>
                          {member.githubUsername && ` • @${member.githubUsername}`}
                        </p>
                      </div>
                    </div>

                    <Badge variant={isLead ? "teal" : "default"} size="sm">
                      {member.role}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Commit Contribution Velocity</span>
                      <span className="font-mono text-teal-700 font-bold">
                        {member.commitsCount} commits ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Department: {member.department ? member.department.replace("Department of ", "") : "Computing"}</span>
                    <a
                      href={`${repoUrl}/commits?author=${member.githubUsername || member.fullName.toLowerCase().replace(/\s+/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline inline-flex items-center gap-1 font-sans font-semibold"
                    >
                      Member commits <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Academic Advisory:</strong> Git contribution metrics provide transparency on participation and development cadence. Lecturers are encouraged to holistically evaluate viva voce, architecture design, and final reports alongside raw commit counts.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: SOURCE CODE (Repository files and code)                 */}
      {/* ============================================================== */}
      {activeTab === "source_code" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-teal-600" />
                Browse Code inside UniCodeTrack AI
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse repository files, inspection of C source code, telemetry headers, Makefiles, and database DDL schemas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">
                Branch: <strong className="text-slate-900">{selectedBranch}</strong>
              </span>
              <a
                href={`${repoUrl}/tree/${selectedBranch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                <span>Open on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Interactive Code Browser Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left: File Tree Explorer */}
            <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-teal-600" />
                  Repository Files
                </span>
                <span className="text-[10px] font-mono text-slate-400">Tree View</span>
              </div>

              <div className="space-y-1 text-xs font-mono">
                {SAMPLE_C_PROJECT_FILES.map((node) => {
                  if (node.type === "dir") {
                    return (
                      <div key={node.path} className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 py-1 px-2 rounded hover:bg-slate-200/60">
                          <Folder className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{node.name}/</span>
                        </div>
                        <div className="pl-4 space-y-1 border-l border-slate-200 ml-2">
                          {node.children?.map((child) => (
                            <button
                              key={child.path}
                              type="button"
                              onClick={() => setSelectedFile(child)}
                              className={`w-full text-left py-1 px-2 rounded flex items-center gap-1.5 transition-colors ${
                                selectedFile.path === child.path
                                  ? "bg-teal-600 text-white font-bold"
                                  : "text-slate-700 hover:bg-slate-200/70"
                              }`}
                            >
                              <FileText className="w-3 h-3 shrink-0" />
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
                      type="button"
                      onClick={() => setSelectedFile(node)}
                      className={`w-full text-left py-1.5 px-2 rounded flex items-center gap-1.5 transition-colors ${
                        selectedFile.path === node.path
                          ? "bg-teal-600 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{node.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Monaco-styled Code Viewer */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-card rounded-[16px] overflow-hidden border border-border shadow-md">
                {/* File Header Tab */}
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="ml-2 font-mono text-slate-300 font-bold flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-teal-400" />
                      {selectedFile.path}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                      {selectedFile.language?.toUpperCase() || "C"} • {selectedFile.size || 1024} bytes
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`${repoUrl}/blob/${selectedBranch}/${selectedFile.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-teal-400 text-slate-400 transition-colors"
                      title="View file on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Code Content with Line Numbers */}
                <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
                  <pre className="grid grid-cols-[auto_1fr] gap-4">
                    <code className="text-slate-600 select-none text-right pr-2 border-r border-slate-800">
                      {selectedFile.content
                        ? selectedFile.content.split("\n").map((_, i) => `${i + 1}\n`)
                        : "1"}
                    </code>
                    <code>{selectedFile.content || "// Select a file from the explorer tree to view code"}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: PULL REQUESTS (Submitted changes and review status)     */}
      {/* ============================================================== */}
      {activeTab === "pull_requests" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-teal-600" />
                Submitted Pull Requests ({pullRequests.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted code changes, peer review statuses, approvals, and branches.
              </p>
            </div>

            <a
              href={`${repoUrl}/pulls`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <span>View PRs on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-4">
            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                        #{pr.number}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{pr.title}</h4>
                      <Badge
                        variant={pr.status === "merged" ? "teal" : pr.status === "open" ? "warning" : "default"}
                        size="sm"
                      >
                        {pr.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600">{pr.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        pr.reviewStatus === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : pr.reviewStatus === "changes_requested"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {pr.reviewStatus === "approved" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved</span>
                        </>
                      ) : pr.reviewStatus === "changes_requested" ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Changes Requested</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending Review</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-3">
                    <span>Author: <strong className="text-slate-800">{pr.author}</strong></span>
                    <span>•</span>
                    <span>Branch: <span className="text-teal-700 font-semibold">{pr.sourceBranch}</span> &rarr; {pr.targetBranch}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">+{pr.additions}</span>
                    <span className="text-rose-600 font-bold">-{pr.deletions}</span>
                  </div>

                  {pr.reviewComments && (
                    <div className="text-[11px] text-slate-600 font-sans italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      Supervisor Note: &ldquo;{pr.reviewComments}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: ACTIVITY (Latest repository updates)                    */}
      {/* ============================================================== */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Latest Repository Updates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time chronological timeline of commits, PR submissions, reviews, and repository synchronizations.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Webhook Live
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activityEvents.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-teal-600 group-hover:scale-125 transition-transform" />
                <div className="bg-slate-50 hover:bg-slate-100/70 p-4 rounded-xl border border-slate-200 transition-all space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900 font-bold">{act.user}</strong>
                      <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        {act.role}
                      </span>
                      <span className="text-slate-600">{act.action}</span>
                      <span className="font-mono font-bold text-slate-900">{act.target}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
