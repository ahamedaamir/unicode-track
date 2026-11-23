"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  GitBranch, 
  GitCommit, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  FolderGit2, 
  ChevronRight
} from "lucide-react";

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<"overview" | "git" | "ai">("overview");

  const teamContributors = [
    { name: "Alex Chen", role: "Team Lead", commits: 46, percent: 34, color: "bg-teal-500", initials: "AC" },
    { name: "Sarah Lin", role: "ML Engineer", commits: 38, percent: 28, color: "bg-indigo-500", initials: "SL" },
    { name: "Marcus Doe", role: "Backend Dev", commits: 28, percent: 21, color: "bg-sky-500", initials: "MD" },
    { name: "Priya Patel", role: "QA & DevOps", commits: 23, percent: 17, color: "bg-emerald-500", initials: "PP" },
  ];

  const recentActivities = [
    {
      id: 1,
      user: "Sarah Lin",
      action: "pushed 4 commits to",
      target: "feature/telemetry-fusion",
      time: "8m ago",
      icon: <GitCommit className="w-3.5 h-3.5 text-teal-600" />,
      badge: "Commit",
    },
    {
      id: 2,
      user: "Dr. Evelyn Reed",
      action: "reviewed milestone",
      target: "Sprint 3: System Architecture",
      time: "42m ago",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      badge: "Approval",
    },
    {
      id: 3,
      user: "UniCodeTrack AI",
      action: "generated rubric score for",
      target: "Milestone 3 Deliverables",
      time: "2h ago",
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
      badge: "AI Review",
    },
  ];

  return (
    <div className="relative mx-auto w-full rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden font-sans">
      {/* Top OS Window Chrome */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 inline-block" />
          </div>
          <div className="ml-2 hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>app.unicodetrack.edu/workspace/capstone-2026</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            Live Sync
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-600 font-medium hidden sm:inline">Fall 2026</span>
        </div>
      </div>

      {/* Internal Sub-navigation / App Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50/60 to-white border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                CS-492
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#0B1220] tracking-tight">
                Senior Capstone & Innovation Lab
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project: <span className="font-medium text-slate-700">Autonomous Drone Navigation & Obstacle Detection</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("git")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === "git"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              GitHub Sync
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                activeTab === "ai"
                  ? "bg-white text-teal-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3 h-3 text-teal-600" />
              AI Review
            </button>
          </div>
        </div>

        {/* Top 3 High-Impact Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {/* Metric 1 */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Project Completion</span>
              <span className="text-teal-600 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B1220]">84%</span>
              <span className="text-xs text-slate-500">4 of 5 milestones</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-[#14B8A6] h-full rounded-full transition-all duration-500" style={{ width: "84%" }} />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Active Projects</span>
              <span className="text-slate-400 text-[11px]">CS Dept</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B1220]">12</span>
              <span className="text-xs text-emerald-600 font-medium">100% on schedule</span>
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>48 enrolled students</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Next Milestone Deadline</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold">
                Due in 5d
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-[#0B1220] truncate">Field Telemetry Review</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Nov 28, 2026 • 23:59 UTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#F8FAFC]/50">
        {/* Left Column: Team GitHub Contribution (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Team SkyGrid • GitHub Activity
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                  <GitBranch className="w-3 h-3 text-teal-600" /> main
                </span>
                <span className="text-[11px]">135 commits total</span>
              </div>
            </div>

            {/* Contribution distribution bars */}
            <div className="space-y-3 pt-3">
              {teamContributors.map((member) => (
                <div key={member.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {member.initials}
                      </span>
                      <span className="font-semibold text-slate-800">{member.name}</span>
                      <span className="text-slate-400 text-[11px]">({member.role})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[11px]">{member.commits} commits</span>
                      <span className="font-semibold text-slate-700 w-8 text-right">{member.percent}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${member.color}`}
                      style={{ width: `${member.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-2.5 bg-teal-50/60 rounded-lg border border-teal-100/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">
                  AI Git Audit: Balanced workload detected (Equity Index: 94/100)
                </span>
              </div>
              <span className="text-teal-700 font-semibold text-[11px] hidden sm:inline">Healthy</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Evaluation & Live Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI Evaluation Snapshot */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-teal-50 text-teal-600">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  AI Evaluation Preview
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                92 / 100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600">Code Architecture & Modularity</span>
                <span className="font-semibold text-slate-800">28 / 30</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600">Milestone Deliverables & Tests</span>
                <span className="font-semibold text-slate-800">24 / 25</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600">Git Regularity & Teamwork</span>
                <span className="font-semibold text-slate-800">20 / 20</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Technical Documentation</span>
                <span className="font-semibold text-slate-800">20 / 25</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ready for Lecturer Review</span>
              </div>
              <span className="text-teal-700 font-medium text-[11px] hover:underline cursor-pointer flex items-center">
                Details <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Team Activity
              </span>
              <span className="text-[11px] text-slate-400">Live feed</span>
            </div>

            <div className="space-y-2.5">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="p-1 rounded bg-slate-50 border border-slate-200/70 mt-0.5 shrink-0">
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 leading-tight">
                      <span className="font-semibold text-slate-900">{act.user}</span>{" "}
                      <span className="text-slate-500">{act.action}</span>{" "}
                      <span className="font-medium text-slate-800">{act.target}</span>
                    </p>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Bottom Bar */}
      <div className="px-5 py-2.5 bg-slate-900 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium text-[11px]">System Status: All services operational</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Supervisor: Dr. Evelyn Reed</span>
          <span>•</span>
          <span className="text-teal-400 font-medium">Demo Workspace Preview</span>
        </div>
      </div>
    </div>
  );
}
