"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  FolderGit2,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronRight,
  BookOpen,
  User,
  Sparkles,
  Info,
  Layers,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProposalSubmission } from "@/types/project";

function GroupWorkspaceContent() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const {
    projects,
    courses,
    lecturers,
    groups,
    connectRepoToGroup,
    syncGroupRepo,
    submitProposal,
    activeRole,
    activeStudentEmail,
  } = useAdminData();

  // Find project
  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;
  const lecturer = project ? lecturers.find((l) => l.id === project.lecturerId || l.name === project.lecturerName) : null;

  // Find the user's group for this project (or first group if in lecturer mode)
  const group = groups.find(
    (g) =>
      g.projectId === projectId &&
      g.members.some((m) => m.email.toLowerCase() === activeStudentEmail.toLowerCase())
  ) || groups.find((g) => g.projectId === projectId) || groups[0];

  // GitHub repo connection state
  const [repoInputUrl, setRepoInputUrl] = useState("");
  const [isConnectingRepo, setIsConnectingRepo] = useState(false);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);
  const [repoError, setRepoError] = useState("");

  // Proposal upload state
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalFileName, setProposalFileName] = useState("");
  const [proposalFileSize, setProposalFileSize] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "repo" | "proposal" | "activity">("overview");

  if (!project) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The project ID <span className="font-mono text-slate-700">{projectId}</span> does not exist or has been removed.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  // Handle repository connection
  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepoError("");
    if (!repoInputUrl.trim()) {
      setRepoError("Please enter a valid GitHub repository URL.");
      return;
    }

    setIsConnectingRepo(true);
    const result = await connectRepoToGroup(group.id, repoInputUrl.trim());
    setIsConnectingRepo(false);

    if (result.success) {
      setRepoInputUrl("");
    } else {
      setRepoError(result.error || "Failed to connect repository.");
    }
  };

  // Handle repository sync
  const handleSyncRepo = async () => {
    setIsSyncingRepo(true);
    await syncGroupRepo(group.id);
    setIsSyncingRepo(false);
  };

  // Handle proposal submission
  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setProposalError("");

    if (!proposalTitle.trim()) {
      setProposalError("Proposal Title is required.");
      return;
    }
    if (!proposalFileName) {
      setProposalError("Please upload the project proposal PDF document.");
      return;
    }

    setIsSubmittingProposal(true);
    const result = submitProposal(group.id, {
      title: proposalTitle,
      description: proposalDescription,
      fileName: proposalFileName,
      fileSize: proposalFileSize || "1.5 MB",
      submittedBy: activeRole === "student" ? "Alex Chen" : "Student Lead",
      submittedByEmail: activeStudentEmail,
    });
    setIsSubmittingProposal(false);

    if (result.success) {
      setProposalTitle("");
      setProposalDescription("");
      setProposalFileName("");
      setProposalFileSize("");
      setShowRevisionForm(false);
    }
  };

  // Handle mock PDF file selection for proposal
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setProposalError("Only PDF documents (.pdf) are accepted.");
        return;
      }
      setProposalFileName(file.name);
      setProposalFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-teal-700">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/dashboard/projects" className="hover:text-teal-700">Projects</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-teal-700">{project.courseCode}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{group?.groupName || "Group Workspace"}</span>
        </div>

        {/* Role Notice */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Viewing as:</span>
          <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            {activeRole === "student" ? "Student Member" : "Course Lecturer"}
          </span>
        </div>
      </div>

      {/* Hero Workspace Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0B1220] text-white">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                {group?.groupName || "Academic Group Workspace"}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <BookOpen className="w-3.5 h-3.5" />
                {project.courseCode} — {course?.name || "Curriculum Course"}
              </span>

              {group?.repoStatus === "connected" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
                  GitHub Connected ({group.totalCommits} commits)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-600" />
                  Repository Unlinked
                </span>
              )}

              {group?.proposalStatus === "approved" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Proposal Approved
                </span>
              ) : group?.proposalStatus === "submitted" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Proposal Under Review
                </span>
              ) : group?.proposalStatus === "changes_requested" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Revision Requested
                </span>
              ) : null}
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] tracking-tight">
              {project.title}
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed max-w-4xl">
              {project.description}
            </p>

            {/* Shared Workspace Indicator Notice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Shared Group Workspace:</strong> All {group?.members.length || 4} assigned students collaborate in this single shared environment. Repository commits, proposal revisions, and faculty evaluations are synchronized live for the team.
              </p>
            </div>
          </div>

          {/* Quick Meta Widget */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 lg:w-72 shrink-0 space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group Progress</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Milestone Completion</span>
                <span className="text-teal-600">{group?.progress || 0}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${group?.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Supervisor:</span>
                <span className="font-semibold text-slate-900">{project.lecturerName || lecturer?.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Deadline:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Dec 15, 2026"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Project Overview
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "members"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Group Members ({group?.members.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("repo")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "repo"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            GitHub Repository
          </button>

          <button
            onClick={() => setActiveTab("proposal")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "proposal"
                ? "bg-teal-600 text-white shadow-xs shadow-teal-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Proposal Submission
            {group?.proposal && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "activity"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            Activity & Commits
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB A: PROJECT OVERVIEW                                        */}
      {/* ============================================================== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Assignment Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Course & Capstone Scope
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Course Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{course?.name || "Capstone Project"}</span>
                  <span className="font-mono text-teal-700 font-semibold">{project.courseCode}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Academic Cohort</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">Year {project.academicYear}, Semester {project.semester}</span>
                  <span className="text-slate-500">Group Collaboration (Max 4 students)</span>
                </div>
              </div>

              {/* Requirements document pill */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {project.requirementsPdfName || "CS492_Academic_Requirements_Specification.pdf"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Official requirements document uploaded by course supervisor
                    </p>
                  </div>
                </div>

                <a
                  href="#download"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading course rubric: ${project.requirementsPdfName || "specification.pdf"}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>

            {/* Milestone Roadmap */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Submission Milestones
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    M1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Project Proposal & Architecture</h4>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                        {group?.proposalStatus === "approved" ? "Completed ✓" : "In Progress"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Submit official PDF proposal with data model, system context diagrams, and team task allocation.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                    M2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Working Prototype & Git Activity</h4>
                      <span className="text-[11px] font-medium text-slate-500">Mid-term evaluation</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Functional microservices/C pipelines, GitHub feature branch integration, and peer PR reviews.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                    M3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Final Defense & Code Review</h4>
                      <span className="text-[11px] font-medium text-slate-500">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Final cycle"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Oral defense presentation, automated AI code review report, and live demonstration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Supervisor & Repository Summary */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Supervisor</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-200 shrink-0">
                  {project.lecturerName ? project.lecturerName.split(" ").map((n) => n[0]).slice(0, 2).join("") : "ER"}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{project.lecturerName || "Dr. Evelyn Reed"}</h4>
                  <p className="text-[11px] text-slate-500">{lecturer?.email || "evelyn.reed@university.edu"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repository Status</span>
              {group?.repoStatus === "connected" ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-mono font-bold">
                    <FolderGit2 className="w-4 h-4 text-teal-600" />
                    <span className="truncate">{group.repoName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{group.repoUrl}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Default branch:</span>
                    <span className="font-mono font-semibold text-slate-800">{group.defaultBranch || "main"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Total Commits:</span>
                    <span className="font-bold text-teal-700">{group.totalCommits}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 space-y-2">
                  <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600">No repository connected yet.</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("repo")}>
                    Connect GitHub Repo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB B: GROUP MEMBERS                                           */}
      {/* ============================================================== */}
      {activeTab === "members" && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Assigned Team Members ({group?.members.length || 0})
              </h3>
              <p className="text-xs text-slate-500">
                Official students enrolled in {group?.groupName}. All members access this single shared workspace.
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Assigned by Faculty Supervisor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group?.members.map((member) => (
              <div
                key={member.email}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all flex items-start gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                  {member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {member.fullName}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.role === "Team Lead"
                          ? "bg-teal-100 text-teal-800 border border-teal-200"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate">{member.email}</p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      ID: {member.studentId}
                    </span>
                    {member.githubUsername && (
                      <span className="flex items-center gap-1 font-mono text-teal-700">
                        <FolderGit2 className="w-3 h-3" />
                        @{member.githubUsername}
                      </span>
                    )}
                    <span className="text-slate-400">
                      {member.commitsCount} commits
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB C: GITHUB REPOSITORY CONNECTION                            */}
      {/* ============================================================== */}
      {activeTab === "repo" && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-teal-600" />
                Shared Group GitHub Repository
              </h3>
              <p className="text-xs text-slate-500">
                Only one repository connects to this group workspace. All members and supervisors access this repository.
              </p>
            </div>
            {group?.repoStatus === "connected" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncRepo}
                disabled={isSyncingRepo}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingRepo ? "animate-spin" : ""}`} />}
              >
                {isSyncingRepo ? "Syncing..." : "Sync Repository"}
              </Button>
            )}
          </div>

          {/* Connected Repo Card */}
          {group?.repoStatus === "connected" ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <FolderGit2 className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{group.repoName}</h4>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Connected & Active
                      </span>
                    </div>
                    <a
                      href={group.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-700 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>{group.repoUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>Last synchronized:</p>
                  <p className="font-medium text-slate-800">
                    {group.lastSyncAt ? new Date(group.lastSyncAt).toLocaleTimeString() : "Just now"}
                  </p>
                </div>
              </div>

              {/* Quick Branch and Commit stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/70 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Default Branch</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                    {group.defaultBranch || "main"}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Commits</span>
                  <span className="font-mono font-bold text-teal-700 text-sm mt-0.5 block">
                    {group.totalCommits}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Branches</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                    {group.branches?.length || 3}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Telemetry Status</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Check className="w-3.5 h-3.5" /> Healthy
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Repository Connect Form */
            <form onSubmit={handleConnectRepo} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <h4 className="font-bold text-xs text-slate-900">Connect Group GitHub Repository</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste the repository URL. Any group member can link the repository once for the entire workspace.
                </p>
              </div>

              {repoError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{repoError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  GitHub Repository URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <FolderGit2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="https://github.com/organization/repository-name"
                      value={repoInputUrl}
                      onChange={(e) => setRepoInputUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isConnectingRepo}
                    icon={isConnectingRepo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  >
                    {isConnectingRepo ? "Connecting..." : "Connect Repository"}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Example: <code>https://github.com/unicodetrack-demo/cybernova-event-hub</code>
                </p>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB D: PROPOSAL SUBMISSION & FEEDBACK                          */}
      {/* ============================================================== */}
      {activeTab === "proposal" && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Project Proposal Submission
              </h3>
              <p className="text-xs text-slate-500">
                Upload your group's capstone proposal PDF for faculty review and approval.
              </p>
            </div>

            {group?.proposal && group.proposalStatus === "changes_requested" && !showRevisionForm && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowRevisionForm(true)}
                icon={<UploadCloud className="w-3.5 h-3.5" />}
              >
                Submit Revised Proposal (v{(group.proposal.version || 1) + 1}.0)
              </Button>
            )}
          </div>

          {/* Current Submitted Proposal Card */}
          {group?.proposal && !showRevisionForm ? (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      PDF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{group.proposal.title}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          v{group.proposal.version}.0
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                        {group.proposal.description}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-2">
                        File: <strong>{group.proposal.fileName}</strong> ({group.proposal.fileSize}) • Submitted by {group.proposal.submittedBy}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {group.proposal.status === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Approved by Faculty
                      </span>
                    ) : group.proposal.status === "changes_requested" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Changes Requested
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        Awaiting Faculty Review
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Submitted: {new Date(group.proposal.submittedAt).toLocaleDateString()}
                  </span>
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Downloading proposal document: ${group.proposal?.fileName}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" /> Download Document
                  </a>
                </div>
              </div>

              {/* Faculty Feedback Display */}
              {group.proposal.feedback && (
                <div
                  className={`p-5 rounded-2xl border ${
                    group.proposal.feedback.decision === "approved"
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : "bg-rose-50/60 border-rose-200 text-rose-950"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">
                        Faculty Feedback from {group.proposal.feedback.lecturerName}
                      </span>
                      {group.proposal.feedback.rubricScore && (
                        <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-white/80 border border-emerald-300">
                          Rubric Score: {group.proposal.feedback.rubricScore}/100
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] opacity-75">
                      Reviewed on {new Date(group.proposal.feedback.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed font-medium bg-white/70 p-3.5 rounded-xl border border-emerald-200/60">
                    "{group.proposal.feedback.comments}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Proposal Submission Form */
            <form onSubmit={handleSubmitProposal} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <h4 className="font-bold text-xs text-slate-900">
                  {showRevisionForm ? "Submit Proposal Revision" : "New Proposal Submission"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach your group's capstone specification document in PDF format.
                </p>
              </div>

              {proposalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{proposalError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Proposal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Sensor Telemetry & Queue Pipeline"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Executive Summary & Approach
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core technical solution and division of responsibilities..."
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                />
              </div>

              {/* PDF Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "application/pdf,.pdf";
                  input.onchange = (e: any) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setProposalFileName(f.name);
                      setProposalFileSize((f.size / (1024 * 1024)).toFixed(2) + " MB");
                    }
                  };
                  input.click();
                }}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white p-6 rounded-2xl text-center cursor-pointer transition-colors space-y-2"
              >
                <UploadCloud className="w-8 h-8 text-teal-600 mx-auto" />
                <p className="text-xs font-bold text-slate-900">
                  {proposalFileName ? proposalFileName : "Drag and drop your Proposal PDF here, or click to browse"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {proposalFileSize ? `File size: ${proposalFileSize}` : "Accepts PDF files up to 15 MB"}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {showRevisionForm && (
                  <Button type="button" variant="outline" size="md" onClick={() => setShowRevisionForm(false)}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmittingProposal}
                  icon={isSubmittingProposal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                >
                  {isSubmittingProposal ? "Submitting..." : "Submit Proposal to Supervisor"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB E: GITHUB ACTIVITY & COMMIT TELEMETRY                      */}
      {/* ============================================================== */}
      {activeTab === "activity" && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-teal-600" />
                Recent Git Commit Activity
              </h3>
              <p className="text-xs text-slate-500">
                Real-time commit telemetry from the linked repository branch ({group?.defaultBranch || "main"}).
              </p>
            </div>
            {group?.repoStatus === "connected" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncRepo}
                disabled={isSyncingRepo}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingRepo ? "animate-spin" : ""}`} />}
              >
                {isSyncingRepo ? "Syncing..." : "Sync Commits"}
              </Button>
            )}
          </div>

          {/* Member contribution breakdown bars */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Contribution Distribution by Student Member
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {group?.members.map((m) => {
                const total = group.totalCommits || 1;
                const pct = Math.min(100, Math.round((m.commitsCount / total) * 100));

                return (
                  <div key={m.email} className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 truncate">{m.fullName.split(" ")[0]}</span>
                      <span className="font-mono text-teal-700 font-semibold">{m.commitsCount} commits</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{pct}% of repository activity</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commits List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Commit Stream ({group?.commits?.length || 0} commits recorded)
            </span>
            <div className="space-y-2">
              {(group?.commits || []).map((c) => (
                <div
                  key={c.hash}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <GitCommit className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">{c.message}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Author: <strong>{c.author}</strong> • {new Date(c.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center font-mono">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                      {c.branch}
                    </span>
                    <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {c.shortHash}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Caveat Notice */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Academic Integrity Notice:</strong> Commit counts and volume statistics serve as collaboration indicators. Individual student marks are evaluated comprehensively through architectural quality, unit tests, and viva voce defense.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Loading shared group workspace...</p>
        </div>
      }
    >
      <GroupWorkspaceContent />
    </Suspense>
  );
}

