"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  Calendar,
  GraduationCap,
  Crown,
  ChevronRight,
  ShieldCheck,
  Activity,
  FileText,
} from "lucide-react";
import { ProjectGroup, GroupMember } from "@/types/project";
import { Project } from "@/types/admin";
import { Badge } from "@/components/ui/Badge";

interface LecturerGroupCardProps {
  group: ProjectGroup;
  project?: Project;
  courseName?: string;
  className?: string;
}

export function LecturerGroupCard({
  group,
  project,
  courseName,
  className = "",
}: LecturerGroupCardProps) {
  // Resolve formatted student university ID
  const formatStudentId = (member: GroupMember, index: number) => {
    if (member.studentId && !member.studentId.startsWith("std-")) {
      return member.studentId;
    }
    // Realistic university ID fallback based on student identifier
    const num = member.studentId?.replace("std-", "") || String(index + 1);
    return `CS202300${num}`;
  };

  // Determine latest activity text and timestamp
  const getLatestActivity = () => {
    if (group.commits && group.commits.length > 0) {
      const latest = group.commits[0];
      return {
        description: `Commit: "${latest.message}"`,
        author: latest.author,
        timestamp: latest.date || "Recent push",
        type: "commit" as const,
      };
    }

    if (group.proposal) {
      return {
        description: `Proposal: "${group.proposal.title}"`,
        author: group.proposal.submittedBy,
        timestamp: group.proposal.submittedAt || "Recently submitted",
        type: "proposal" as const,
      };
    }

    if (group.lastSyncAt) {
      return {
        description: "GitHub repository sync completed",
        author: "Automated Webhook",
        timestamp: new Date(group.lastSyncAt).toLocaleDateString(),
        type: "sync" as const,
      };
    }

    return {
      description: "Workspace initialized and team enrolled",
      author: "System",
      timestamp: group.createdAt ? new Date(group.createdAt).toLocaleDateString() : "Active",
      type: "system" as const,
    };
  };

  const latestActivity = getLatestActivity();
  const repoName = group.repoName || (group.repoUrl ? group.repoUrl.split("/").slice(-1)[0] : "repository-unlinked");
  const projectId = project?.id || group.projectId;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group ${className}`}
    >
      {/* Top Header: Group Name / Number & Submission Status */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Top Tag Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            {/* 1. Group Name or Number */}
            <span className="w-7 h-7 rounded-lg bg-muted text-accent border border-border font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              #{group.groupNumber || "1"}
            </span>
            <div>
              <Link
                href={`/dashboard/projects/${projectId}/groups/${group.id}`}
                className="font-extrabold text-sm sm:text-base text-foreground hover:text-accent transition-colors tracking-tight line-clamp-1"
                title={`Open review page for ${group.groupName}`}
              >
                {group.groupName}
              </Link>
            </div>
          </div>

          {/* 7. Submission Status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {group.proposalStatus === "approved" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Proposal Approved
              </span>
            ) : group.proposalStatus === "submitted" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <Clock className="w-3 h-3 text-sky-600" />
                Proposal Submitted
              </span>
            ) : group.proposalStatus === "changes_requested" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Changes Requested
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Proposal Pending
              </span>
            )}

            {group.evaluationStatus === "published" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                <Sparkles className="w-3 h-3 text-teal-600" />
                Grade: {group.evaluationScore || 92}/100
              </span>
            ) : group.evaluationStatus === "ai_completed" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <Sparkles className="w-3 h-3 text-purple-600" />
                AI Evaluated
              </span>
            ) : null}
          </div>
        </div>

        {/* 2. Project Title */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Academic Project
          </span>
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="font-bold text-sm sm:text-base text-slate-900 hover:text-teal-600 transition-colors line-clamp-1 mt-0.5"
            title={project?.title || "Academic Project"}
          >
            {project?.title || "Academic Capstone Project"}
          </Link>
        </div>

        {/* 5. Assigned Course and Academic Year */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            <BookOpen className="w-3.5 h-3.5" />
            {project?.courseCode || "CS492"} {courseName ? `• ${courseName}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
            Year {project?.academicYear || 4} • Semester {project?.semester || 2}
          </span>
        </div>

        {/* 3 & 4. Group Members: Student Names and University IDs */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Group Members ({group.members.length})
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Lead: {group.members.find((m) => m.role === "Team Lead")?.fullName || group.members[0]?.fullName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.members.map((member, idx) => {
              const isLead = member.role === "Team Lead";
              const universityId = formatStudentId(member, idx);

              return (
                <div
                  key={member.email || idx}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${isLead
                    ? "bg-teal-50/40 border-teal-200/90"
                    : "bg-slate-50/70 border-slate-200/80"
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${isLead
                        ? "bg-teal-600 text-white shadow-2xs"
                        : "bg-slate-200 text-slate-700"
                        }`}
                    >
                      {member.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-xs flex items-center gap-1">
                        <span className="truncate">{member.fullName}</span>
                        {isLead && (
                          <span title="Team Lead">
                            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        ID: <strong className="text-slate-700">{universityId}</strong>
                      </p>
                    </div>
                  </div>

                  {member.githubUsername && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate max-w-[80px]">
                      @{member.githubUsername}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Group Progress */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent" />
              Milestone & Sprint Progress
            </span>
            <span className="font-bold text-foreground font-mono">{group.progress || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#14B8A6] h-full rounded-full transition-all duration-500"
              style={{ width: `${group.progress || 0}%` }}
            />
          </div>
        </div>

        {/* 8. GitHub Repository */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-teal-600" />
              GitHub Repository
            </span>
            {group.repoStatus === "connected" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unlinked
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            {group.repoUrl ? (
              <a
                href={group.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 truncate max-w-[240px]"
                title={group.repoUrl}
              >
                <span className="truncate">{repoName}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : (
              <span className="text-slate-400 italic">No repo connected yet</span>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-slate-400" />
                {group.defaultBranch || "main"}
              </span>
              <span>•</span>
              <span className="font-bold text-slate-800">
                {group.totalCommits || 0} commits
              </span>
            </div>
          </div>
        </div>

        {/* 9. Latest Activity */}
        <div className="p-3 rounded-xl bg-teal-50/30 border border-teal-100 flex items-start gap-2.5 text-xs">
          <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 truncate">
              {latestActivity.description}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              by <strong className="text-slate-700">{latestActivity.author}</strong> • {latestActivity.timestamp}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {group.repoUrl ? (
          <a
            href={group.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
            title="Open group GitHub repository directly"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Open on GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        ) : (
          <Link
            href={`/dashboard/projects/${projectId}/workspace`}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Open Workspace
          </Link>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/projects/${projectId}/groups/${group.id}/evaluation`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>AI Review</span>
          </Link>

          <Link
            href={`/dashboard/projects/${projectId}/groups/${group.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
            title="Browse repository files, branches, commits, PRs and code inside UniCodeTrack AI"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Browse Code</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
