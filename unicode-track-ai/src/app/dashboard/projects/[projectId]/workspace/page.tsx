"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
  ShieldAlert,
  Check,
  ChevronRight,
  BookOpen,
  User,
  Sparkles,
  Info,
  Layers,
  Database,
  Image,
  Bell,
  Code2,
  FileCheck,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProposalSubmission, ProjectGroup, ProjectStudentAssignment } from "@/types/project";
import { LecturerRepositoryViewer } from "@/components/github/LecturerRepositoryViewer";

function GroupWorkspaceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const urlGroupId = searchParams ? searchParams.get("groupId") : null;

  const {
    projects,
    courses,
    lecturers,
    groups,
    studentAssignments,
    timelineActivities,
    connectRepoToGroup,
    syncGroupRepo,
    submitProposal,
    activeRole,
    activeStudentEmail,
    getEvaluationForGroup,
    getERSubmissionForGroup,
    submitERDiagram,
  } = useAdminData();

  // Find project
  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;
  const lecturer = project ? lecturers.find((l) => l.id === project.lecturerId || l.name === project.lecturerName) : null;
  const isIndividual = project?.projectType === "individual" || project?.type === "Individual Project";

  // All groups and individual student assignments for this project
  const projectGroups = groups.filter((g) => g.projectId === projectId);
  const projectAssignments = studentAssignments.filter((a) => a.projectId === projectId);

  // Check student membership in group project
  const studentAssignedGroup = projectGroups.find((g) =>
    g.members.some((m) => m.email.toLowerCase() === activeStudentEmail.toLowerCase())
  );

  // Check student assignment in individual project
  const studentAssignedIndividual = projectAssignments.find(
    (a) => a.studentEmail.toLowerCase() === activeStudentEmail.toLowerCase()
  );

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const fallbackGroup: ProjectGroup = {
    id: `grp-${projectId}-1`,
    projectId: projectId,
    groupNumber: 1,
    groupName: isIndividual ? "Personal Project Workspace" : "Group 01 — Academic Workspace",
    workspaceId: isIndividual ? `ws-ind-${projectId}-default` : `ws-${projectId}-1`,
    members: [
      {
        studentId: "tg/2004/2004",
        fullName: activeRole === "student" ? "Alex Chen" : "Alex Chen (Lead)",
        email: activeStudentEmail,
        department: "Computer Science & Engineering",
        academicYear: 4,
        semester: 2,
        role: "Team Lead",
        commitsCount: 16,
      },
      {
        studentId: "tg/2004/2005",
        fullName: "Sarah Lin",
        email: "sarah.lin@university.edu",
        department: "Computer Science & Engineering",
        academicYear: 4,
        semester: 2,
        role: "Member",
        commitsCount: 9,
      },
      {
        studentId: "tg/2004/2006",
        fullName: "Priya Patel",
        email: "priya.patel@university.edu",
        department: "Computer Science & Engineering",
        academicYear: 4,
        semester: 2,
        role: "Member",
        commitsCount: 7,
      },
    ],
    repoStatus: "connected",
    repoName: "unicodetrack-demo/cybernova-embedded-c",
    repoUrl: "https://github.com/unicodetrack-demo/cybernova-embedded-c",
    defaultBranch: "main",
    totalCommits: 32,
    status: "active",
    progress: 75,
    proposalStatus: "approved",
    proposal: {
      id: "prop-demo-1",
      groupId: `grp-${projectId}-1`,
      title: "Real-Time Embedded Telemetry Pipeline in C",
      description: "High-throughput circular buffer queue, CRC16 verification, and relational database logging.",
      fileName: "CS492_Group01_Proposal.pdf",
      fileSize: "1.4 MB",
      submittedBy: "Alex Chen",
      submittedByEmail: "alex.chen@university.edu",
      submittedAt: "Nov 18, 2026",
      status: "approved",
      version: 1,
    },
    createdAt: new Date().toISOString(),
  };

  const mapAssignmentToGroup = (a: ProjectStudentAssignment): ProjectGroup => ({
    id: a.id,
    projectId: a.projectId,
    groupNumber: 1,
    groupName: `${a.studentName} — Personal Workspace`,
    workspaceId: a.workspaceId,
    members: [
      {
        studentId: a.studentId || "tg/2004/2004",
        fullName: a.studentName,
        email: a.studentEmail,
        department: a.departmentId || "Faculty of Computing",
        academicYear: a.academicYear || 4,
        semester: a.semester || 1,
        role: "Team Lead",
        commitsCount: a.totalCommits || 18,
      },
    ],
    repoStatus: a.repoStatus && a.repoStatus !== "disconnected" ? a.repoStatus : "connected",
    repoUrl: a.repoUrl || "https://github.com/unicodetrack-demo/cybernova-embedded-c",
    repoName: a.repoName || "unicodetrack-demo/cybernova-embedded-c",
    defaultBranch: a.defaultBranch || "main",
    totalCommits: a.totalCommits || 18,
    status: a.status || "active",
    progress: a.progress || 70,
    proposalStatus: a.proposalStatus || "approved",
    proposal: a.proposal || {
      id: `prop-ind-${a.id}`,
      groupId: a.id,
      title: "Individual Telemetry and Architecture Proposal",
      description: "Personal implementation of real-time C buffers and normalized database tables.",
      fileName: "Individual_Proposal_v1.pdf",
      fileSize: "1.1 MB",
      submittedBy: a.studentName,
      submittedByEmail: a.studentEmail,
      submittedAt: "Nov 18, 2026",
      status: "approved",
      version: 1,
    },
    evaluationScore: a.evaluationScore,
    createdAt: a.createdAt,
  });

  // Determine active group/workspace and enforce strict student workspace security
  let group: ProjectGroup;
  let isStudentAccessDenied = false;

  if (activeRole === "student") {
    if (isIndividual) {
      // Individual Project Workflow: Student accesses ONLY their personal workspace
      if (studentAssignedIndividual) {
        group = mapAssignmentToGroup(studentAssignedIndividual);
        // If student manually attempts to view a different student's workspace via URL
        if (
          urlGroupId &&
          urlGroupId !== studentAssignedIndividual.id &&
          urlGroupId !== studentAssignedIndividual.workspaceId
        ) {
          isStudentAccessDenied = true;
        }
      } else {
        if (projectAssignments.length > 0) {
          isStudentAccessDenied = true;
          group = fallbackGroup;
        } else {
          group = fallbackGroup;
        }
      }
    } else {
      // Group Project Workflow: Student accesses ONLY their own group workspace
      if (studentAssignedGroup) {
        group = studentAssignedGroup;
        // If student manually attempts to view a different group via URL
        if (
          urlGroupId &&
          urlGroupId !== studentAssignedGroup.id &&
          urlGroupId !== studentAssignedGroup.workspaceId
        ) {
          isStudentAccessDenied = true;
        }
      } else {
        if (projectGroups.length > 0) {
          isStudentAccessDenied = true;
          group = fallbackGroup;
        } else {
          group = fallbackGroup;
        }
      }
    }
  } else {
    // Lecturer / Admin supervisor view: can select and supervise any group/student workspace
    if (isIndividual) {
      const foundAssignment =
        projectAssignments.find(
          (a) => a.id === (selectedGroupId || urlGroupId) || a.workspaceId === (selectedGroupId || urlGroupId)
        ) || projectAssignments[0];

      group = foundAssignment ? mapAssignmentToGroup(foundAssignment) : fallbackGroup;
    } else {
      const foundGroup =
        projectGroups.find((g) => g.id === (selectedGroupId || urlGroupId)) ||
        projectGroups.find((g) => g.workspaceId === (selectedGroupId || urlGroupId)) ||
        projectGroups[0];

      group = foundGroup || fallbackGroup;
    }
  }

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
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "repo" | "proposal" | "activity" | "evaluation" | "database">("overview");

  // Project evaluation for this group
  const evaluation = group ? getEvaluationForGroup(group.id) : undefined;
  // ER Diagram submission for this group
  const erSubmission = group ? getERSubmissionForGroup(group.id) : undefined;

  // ER Diagram upload form state
  const [erFileName, setErFileName] = useState("");
  const [erFileSize, setErFileSize] = useState("");
  const [erFileType, setErFileType] = useState<"pdf" | "png" | "jpg" | "jpeg">("pdf");
  const [erVersionNote, setErVersionNote] = useState("");
  const [isSubmittingER, setIsSubmittingER] = useState(false);
  const [erError, setErError] = useState("");
  const [showERUploadModal, setShowERUploadModal] = useState(false);

  if (!project) {
    return (
      <div className="bg-card rounded-[16px] border border-border p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          The project ID <span className="font-mono text-foreground">{projectId}</span> does not exist or has been removed.
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

  // Enforce student access isolation
  if (isStudentAccessDenied) {
    return (
      <div className="bg-card rounded-[16px] border border-rose-200 p-8 sm:p-12 text-center max-w-xl mx-auto mt-8 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">
          Student Access Isolation — Access Restricted
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          UniCodeTrack AI enforces strict student workspace boundaries. Students are only authorized to access the shared workspace of their own assigned group.
        </p>
        <div className="p-4 bg-muted border border-border rounded-xl text-left text-xs space-y-1.5 text-foreground max-w-md mx-auto">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Student Identity:</span>
            <span className="font-semibold text-foreground">{activeStudentEmail}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Project / Course:</span>
            <span className="font-semibold text-foreground">{project.courseCode} — {project.title}</span>
          </p>
          <p className="flex justify-between border-t border-border pt-1 text-rose-600 font-semibold">
            <span>Assignment Status:</span>
            <span>
              {isIndividual
                ? studentAssignedIndividual
                  ? `Assigned personal workspace (${studentAssignedIndividual.workspaceId})`
                  : "Not yet assigned to this individual project"
                : studentAssignedGroup
                ? `Assigned to ${studentAssignedGroup.groupName}`
                : "Not yet assigned to a group"}
            </span>
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isIndividual && studentAssignedIndividual ? (
            <Button
              variant="primary"
              onClick={() => setSelectedGroupId(studentAssignedIndividual.id)}
            >
              Go to My Personal Workspace
            </Button>
          ) : !isIndividual && studentAssignedGroup ? (
            <Button
              variant="primary"
              onClick={() => setSelectedGroupId(studentAssignedGroup.id)}
            >
              Go to My Group ({studentAssignedGroup.groupName})
            </Button>
          ) : (
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Projects
            </Link>
          )}
        </div>
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
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-accent">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link href="/dashboard/projects" className="hover:text-accent">Projects</Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="font-semibold text-teal-700">{project.courseCode}</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-bold truncate max-w-xs">{group?.groupName || "Group Workspace"}</span>
        </div>

        {/* Role Notice */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Viewing as:</span>
          <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            {activeRole === "student" ? "Student Member" : "Course Lecturer"}
          </span>
        </div>
      </div>

      {/* Hero Workspace Header Card */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-6 sm:p-8 space-y-6">
        {/* Supervisor Switcher (Lecturer & Admin) */}
        {activeRole !== "student" && projectGroups.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isIndividual ? "Supervisor Student Switcher" : "Supervisor Workspace Switcher"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {isIndividual
                    ? `Select student to evaluate (${projectGroups.length} assigned students)`
                    : `Select group to supervise and evaluate (${projectGroups.length} total groups)`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={group.id}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-xs focus:ring-2 focus:ring-accent focus:border-accent focus:outline-hidden cursor-pointer"
              >
                {projectGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isIndividual && g.members[0]
                      ? `${g.members[0].fullName} (${g.members[0].studentId}) • ${g.workspaceId}`
                      : `${g.groupName} (${g.members.length} members) • ${g.workspaceId}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0B1220] text-white">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                {isIndividual
                  ? (group.members[0]?.fullName ? `${group.members[0].fullName}'s Personal Workspace` : "Personal Project Workspace")
                  : (group?.groupName || "Academic Group Workspace")}
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {project.title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-4xl">
              {project.description}
            </p>

            {/* Workspace Access Notice */}
            <div className="p-3 rounded-xl bg-muted border border-border text-xs text-muted-foreground flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isIndividual ? (
                  <>
                    <strong>Personal Workspace Isolation:</strong> This workspace is dedicated exclusively to{" "}
                    <strong>{group.members[0]?.fullName || "the assigned student"}</strong> (<code>{group.workspaceId}</code>). Students cannot view or access other students&apos; personal workspaces. Faculty supervisors evaluate each student independently.
                  </>
                ) : (
                  <>
                    <strong>Shared Group Workspace:</strong> All {group?.members.length || 4} assigned students collaborate in this single shared environment. Repository commits, proposal revisions, and faculty evaluations are synchronized live for the team.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Meta Widget */}
          <div className="bg-muted border border-border rounded-xl p-4 lg:w-72 shrink-0 space-y-3">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Group Progress</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Milestone Completion</span>
                <span className="text-teal-600">{group?.progress || 0}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${group?.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Supervisor:</span>
                <span className="font-semibold text-foreground">{project.lecturerName || lecturer?.name}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Deadline:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Dec 15, 2026"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables & Uploaded Reports Status Strip */}
        <div className="bg-muted border border-border rounded-[16px] p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 inline-flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Uploaded Deliverables & Reports Status
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Click any report below to navigate to the full reports console to download artifacts, run C code, and conduct AI evaluations.
              </p>
            </div>

            <Link
              href={`/dashboard/projects/${projectId}/groups/${group.id}/reports`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              <span>Open Reports & AI Evaluation Console &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Project Proposal */}
            <Link
              href={`/dashboard/projects/${projectId}/groups/${group.id}/reports?tab=proposal`}
              className="p-3.5 rounded-xl border bg-card hover:border-teal-400 hover:shadow-xs transition-all flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-500/20">
                PDF
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Project Proposal</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Uploaded ✓
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {group.proposal?.fileName || "CS492_Group_Proposal_v1.pdf"}
                </p>
              </div>
            </Link>

            {/* 2. ER Diagram */}
            <Link
              href={`/dashboard/projects/${projectId}/groups/${group.id}/reports?tab=er_diagram`}
              className="p-3.5 rounded-xl border bg-card hover:border-teal-400 hover:shadow-xs transition-all flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-500/20">
                ERD
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">ER Diagram</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Uploaded ✓
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  3NF Relational Model & DDL Schema
                </p>
              </div>
            </Link>

            {/* 3. Final Report */}
            <Link
              href={`/dashboard/projects/${projectId}/groups/${group.id}/reports?tab=final_report`}
              className="p-3.5 rounded-xl border bg-card hover:border-teal-400 hover:shadow-xs transition-all flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-500/20">
                DOC
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Final Report</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Uploaded ✓
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  Capstone Defense & Implementation Spec
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Project Overview
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "members"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {isIndividual ? "Student Information" : `Group Members (${group?.members.length || 0})`}
          </button>

          <button
            onClick={() => setActiveTab("repo")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "repo"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications & Activity
          </button>

          <button
            onClick={() => setActiveTab("evaluation")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "evaluation"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Evaluation & Grades
            {evaluation?.status === "published" && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("database")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "database"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            Database Design
            {erSubmission && (
              <span
                className={`w-2 h-2 rounded-full ${
                  erSubmission.status === "published"
                    ? "bg-emerald-400"
                    : erSubmission.status === "resubmission_requested"
                    ? "bg-rose-400"
                    : "bg-sky-400"
                }`}
              />
            )}
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
            <div className="bg-card p-6 rounded-[16px] border border-border shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Course & Capstone Scope
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-muted border border-border/70">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Course Name</span>
                  <span className="font-bold text-foreground text-sm mt-0.5 block">{course?.name || "Capstone Project"}</span>
                  <span className="font-mono text-teal-700 font-semibold">{project.courseCode}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted border border-border/70">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Academic Cohort</span>
                  <span className="font-bold text-foreground text-sm mt-0.5 block">Year {project.academicYear}, Semester {project.semester}</span>
                  <span className="text-muted-foreground">Group Collaboration (Max 4 students)</span>
                </div>
              </div>

              {/* Requirements document pill */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {project.requirementsPdfName || "CS492_Academic_Requirements_Specification.pdf"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
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
            <div className="bg-card p-6 rounded-[16px] border border-border shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
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
                      <h4 className="text-xs font-bold text-foreground">Project Proposal & Architecture</h4>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                        {group?.proposalStatus === "approved" ? "Completed ✓" : "In Progress"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Submit official PDF proposal with data model, system context diagrams, and team task allocation.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-muted text-foreground font-bold flex items-center justify-center text-xs shrink-0">
                    M2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">Working Prototype & Git Activity</h4>
                      <span className="text-[11px] font-medium text-muted-foreground">Mid-term evaluation</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Functional microservices/C pipelines, GitHub feature branch integration, and peer PR reviews.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-muted text-foreground font-bold flex items-center justify-center text-xs shrink-0">
                    M3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">Final Defense & Code Review</h4>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Final cycle"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Oral defense presentation, automated AI code review report, and live demonstration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Supervisor & Repository Summary */}
          <div className="space-y-6">
            <div className="bg-card p-5 rounded-[16px] border border-border shadow-2xs space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Course Supervisor</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-200 shrink-0">
                  {project.lecturerName ? project.lecturerName.split(" ").map((n) => n[0]).slice(0, 2).join("") : "CS"}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">{project.lecturerName || "Course Supervisor"}</h4>
                  <p className="text-[11px] text-muted-foreground">{lecturer?.email || ""}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-[16px] border border-border shadow-2xs space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Repository Status</span>
              {group?.repoStatus === "connected" ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-mono font-bold">
                    <FolderGit2 className="w-4 h-4 text-teal-600" />
                    <span className="truncate">{group.repoName}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{group.repoUrl}</p>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Default branch:</span>
                    <span className="font-mono font-semibold text-foreground">{group.defaultBranch || "main"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Total Commits:</span>
                    <span className="font-bold text-teal-700">{group.totalCommits}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 space-y-2">
                  <FolderGit2 className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs text-muted-foreground">No repository connected yet.</p>
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
      {/* TAB B: STUDENT INFORMATION / GROUP MEMBERS                     */}
      {/* ============================================================== */}
      {activeTab === "members" && (
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isIndividual ? "Assigned Student Profile" : `Assigned Team Members (${group?.members.length || 0})`}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isIndividual
                  ? "Assigned student for this personal workspace. Repository telemetry, proposals, and grades are linked directly to this student."
                  : `Official students enrolled in ${group?.groupName}. All members access this single shared workspace.`}
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {isIndividual ? "Individual Personal Assignment" : "Assigned by Faculty Supervisor"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group?.members.map((member) => (
              <div
                key={member.email}
                className="p-4 rounded-xl border border-border bg-muted hover:bg-card hover:shadow-xs transition-all flex items-start gap-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                  {member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                      {member.fullName}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.role === "Team Lead"
                          ? "bg-teal-100 text-teal-800 border border-teal-200"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono bg-card px-2 py-0.5 rounded border border-border">
                      ID: {member.studentId}
                    </span>
                    {member.githubUsername && (
                      <span className="flex items-center gap-1 font-mono text-teal-700">
                        <FolderGit2 className="w-3 h-3" />
                        @{member.githubUsername}
                      </span>
                    )}
                    <span className="text-muted-foreground">
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
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-teal-600" />
                Shared Group GitHub Repository
              </h3>
              <p className="text-xs text-muted-foreground">
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
            <div className="p-5 rounded-[16px] bg-muted border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <FolderGit2 className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">{group.repoName}</h4>
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

                <div className="text-right text-xs text-muted-foreground">
                  <p>Last synchronized:</p>
                  <p className="font-medium text-foreground">
                    {group.lastSyncAt ? new Date(group.lastSyncAt).toLocaleTimeString() : "Just now"}
                  </p>
                </div>
              </div>

              {/* Quick Branch and Commit stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/70 text-xs">
                <div className="p-3 bg-card rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Default Branch</span>
                  <span className="font-mono font-bold text-foreground flex items-center gap-1 mt-0.5">
                    <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                    {group.defaultBranch || "main"}
                  </span>
                </div>

                <div className="p-3 bg-card rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Commits</span>
                  <span className="font-mono font-bold text-teal-700 text-sm mt-0.5 block">
                    {group.totalCommits}
                  </span>
                </div>

                <div className="p-3 bg-card rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Active Branches</span>
                  <span className="font-mono font-bold text-foreground text-sm mt-0.5 block">
                    {group.branches?.length || 3}
                  </span>
                </div>

                <div className="p-3 bg-card rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Telemetry Status</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Check className="w-3.5 h-3.5" /> Healthy
                  </span>
                </div>
              </div>

              {/* Full Interactive GitHub Workspace Viewer with Code Browser & Member Commits */}
              <div className="pt-2">
                <LecturerRepositoryViewer
                  group={group}
                  project={project}
                  defaultTab="summary"
                />
              </div>
            </div>
          ) : (
            /* Repository Connect Form */
            <form onSubmit={handleConnectRepo} className="p-6 rounded-[16px] bg-muted border border-border space-y-4">
              <div>
                <h4 className="font-bold text-xs text-foreground">Connect Group GitHub Repository</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
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
                <label className="block text-xs font-semibold text-foreground">
                  GitHub Repository URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <FolderGit2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="https://github.com/organization/repository-name"
                      value={repoInputUrl}
                      onChange={(e) => setRepoInputUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-accent focus:border-accent/20 focus:border-accent font-mono"
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
                <p className="text-[11px] text-muted-foreground">
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
        <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Project Proposal Submission
              </h3>
              <p className="text-xs text-muted-foreground">
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
              <div className="p-5 rounded-[16px] bg-muted border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      PDF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{group.proposal.title}</h4>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-card px-2 py-0.5 rounded border border-border">
                          v{group.proposal.version}.0
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                        {group.proposal.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-2">
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

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Submitted: {new Date(group.proposal.submittedAt).toLocaleDateString()}
                  </span>
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Downloading proposal document: ${group.proposal?.fileName}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" /> Download Document
                  </a>
                </div>
              </div>

              {/* Faculty Feedback Display */}
              {group.proposal.feedback && (
                <div
                  className={`p-5 rounded-[16px] border ${
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
                        <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-muted border border-emerald-300">
                          Rubric Score: {group.proposal.feedback.rubricScore}/100
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] opacity-75">
                      Reviewed on {new Date(group.proposal.feedback.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed font-medium bg-card/70 p-3.5 rounded-xl border border-emerald-200/60">
                    "{group.proposal.feedback.comments}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Proposal Submission Form */
            <form onSubmit={handleSubmitProposal} className="p-6 rounded-[16px] bg-muted border border-border space-y-4">
              <div>
                <h4 className="font-bold text-xs text-foreground">
                  {showRevisionForm ? "Submit Proposal Revision" : "New Proposal Submission"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
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
                <label className="block text-xs font-semibold text-foreground">
                  Proposal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Sensor Telemetry & Queue Pipeline"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-accent focus:border-accent/20 focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">
                  Executive Summary & Approach
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core technical solution and division of responsibilities..."
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-accent focus:border-accent/20 focus:border-accent resize-none"
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
                className="border-2 border-dashed border-border hover:border-teal-500 bg-card p-6 rounded-[16px] text-center cursor-pointer transition-colors space-y-2"
              >
                <UploadCloud className="w-8 h-8 text-teal-600 mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  {proposalFileName ? proposalFileName : "Drag and drop your Proposal PDF here, or click to browse"}
                </p>
                <p className="text-[11px] text-muted-foreground">
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
      {/* TAB E: NOTIFICATIONS & ACTIVITY STREAM                         */}
      {/* ============================================================== */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Workspace Notifications & System Alerts */}
          <div className="bg-card p-6 rounded-[16px] border border-border shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                Workspace Notifications & System Alerts
              </h3>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Live Broadcast
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3.5 text-xs">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-teal-950 text-sm">Group Workspace Active & Isolated</p>
                    <span className="text-[10px] text-teal-700 font-mono font-semibold bg-muted px-2 py-0.5 rounded border border-teal-300">
                      ws-{projectId}-{group.groupNumber}
                    </span>
                  </div>
                  <p className="text-xs text-teal-900/80 mt-1 leading-relaxed">
                    <strong>{group.groupName}</strong> workspace confirmed. All {group.members.length} assigned students are granted shared access. Cross-group isolation and faculty supervisory access are active.
                  </p>
                </div>
              </div>

              {group.repoStatus === "connected" ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5 text-xs">
                  <FolderGit2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-emerald-950 text-sm">GitHub Repository Telemetry Linked</p>
                      <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-muted px-2 py-0.5 rounded border border-emerald-300">
                        {group.defaultBranch || "main"}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed">
                      Connected to <code>{group.repoName}</code>. {group.totalCommits} commits registered with automated branch and PR tracking.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3.5 text-xs">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-amber-950 text-sm">Repository Link Required</p>
                      <span className="text-[10px] text-amber-700 font-mono font-semibold bg-muted px-2 py-0.5 rounded border border-amber-300">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                      Please link your group&apos;s GitHub repository in the GitHub tab to begin continuous telemetry and evaluation.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Project Timeline Notifications */}
              {timelineActivities
                .filter((t) => t.projectId === projectId)
                .slice(0, 3)
                .map((act) => (
                  <div key={act.id} className="p-3.5 rounded-xl bg-muted border border-border flex items-start gap-3 text-xs">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-foreground">{act.user} {act.action}</p>
                        <span className="text-[10px] text-muted-foreground">{act.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{act.target}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Git Commit Activity */}
          <div className="bg-card p-6 sm:p-7 rounded-[16px] border border-border shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-teal-600" />
                  Recent Git Commit Activity
                </h3>
                <p className="text-xs text-muted-foreground">
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
          <div className="p-4 rounded-xl bg-muted border border-border space-y-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Contribution Distribution by Student Member
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {group?.members.map((m) => {
                const total = group.totalCommits || 1;
                const pct = Math.min(100, Math.round((m.commitsCount / total) * 100));

                return (
                  <div key={m.email} className="p-3 bg-card rounded-xl border border-border space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground truncate">{m.fullName.split(" ")[0]}</span>
                      <span className="font-mono text-teal-700 font-semibold">{m.commitsCount} commits</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground block">{pct}% of repository activity</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commits List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Commit Stream ({group?.commits?.length || 0} commits recorded)
            </span>
            <div className="space-y-2">
              {(group?.commits || []).map((c) => (
                <div
                  key={c.hash}
                  className="p-3.5 rounded-xl border border-border bg-card hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <GitCommit className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{c.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Author: <strong>{c.author}</strong> • {new Date(c.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center font-mono">
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
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
      </div>
      )}

      {/* ============================================================== */}
      {/* TAB E: ACADEMIC EVALUATION & GRADES (STUDENT VIEW)            */}
      {/* ============================================================== */}
      {activeTab === "evaluation" && (
        <div className="space-y-6">
          {evaluation && evaluation.status === "published" ? (
            <div className="space-y-6">
              {/* Published Grade Banner */}
              <div className="bg-gradient-to-r from-teal-900 to-[#0B1220] rounded-[16px] p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-bold border border-teal-500/30 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Official Faculty Grade Published
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Evaluated on {new Date(evaluation.publishedAt || evaluation.evaluatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">{group?.groupName} — Final Academic Assessment</h2>
                  <p className="text-xs text-muted-foreground/60 max-w-xl">
                    Evaluated by <strong>{evaluation.lecturerName || "Supervising Faculty"}</strong> using the university academic capstone rubric and Gemini 2.5 Flash code review.
                  </p>
                </div>

                <div className="bg-muted backdrop-blur-sm border border-white/10 rounded-[16px] p-4 text-center shrink-0 min-w-40">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 block">Overall Score</span>
                  <div className="text-4xl font-black mt-1">
                    {evaluation.totalScore}
                    <span className="text-lg text-muted-foreground font-normal"> / {evaluation.maxScore}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block">
                    {evaluation.percentage}% Achievement
                  </span>
                </div>
              </div>

              {/* Faculty Qualitative Feedback */}
              {evaluation.lecturerComments && (
                <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    Faculty Feedback & Supervisor Comments
                  </h3>
                  <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-foreground leading-relaxed font-medium">
                    {evaluation.lecturerComments}
                  </div>
                </div>
              )}

              {/* Criterion-Wise Marks Breakdown */}
              <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Rubric Assessment Breakdown
                </h3>

                <div className="space-y-4">
                  {evaluation.criterionScores.map((scoreItem, idx) => (
                    <div
                      key={scoreItem.criterionId || idx}
                      className="p-4 rounded-xl bg-muted border border-border space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-foreground text-sm">{scoreItem.criterionName}</span>
                        </div>
                        <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                          {scoreItem.finalScore} / {scoreItem.maxMarks} Marks ({scoreItem.percentage}%)
                        </span>
                      </div>

                      <p className="text-foreground leading-relaxed">{scoreItem.explanation}</p>

                      {scoreItem.suggestions && scoreItem.suggestions.length > 0 && (
                        <div className="p-3 bg-card rounded-lg border border-border text-muted-foreground">
                          <strong className="text-foreground block mb-1 font-semibold">Recommendations for Defense:</strong>
                          <ul className="list-disc list-inside space-y-0.5">
                            {scoreItem.suggestions.map((sug, sIdx) => (
                              <li key={sIdx}>{sug}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Pending Publication Confidentiality Card */
            <div className="bg-card rounded-[16px] border border-border p-12 text-center max-w-2xl mx-auto shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-[16px] bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Academic Evaluation Pending Faculty Publication</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your group&apos;s project proposal, source code repository, and technical deliverables are undergoing evaluation under university rubric criteria.
              </p>
              <div className="p-3 bg-muted rounded-xl border border-border text-xs text-muted-foreground max-w-md mx-auto flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Official grades and individual criterion breakdowns will be unlocked here once your supervising lecturer approves and publishes the evaluation.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB F: DATABASE DESIGN & ER DIAGRAM SUBMISSION                 */}
      {/* ============================================================== */}
      {activeTab === "database" && (
        <div className="space-y-6">
          {/* Submission Status & Action Banner */}
          <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  Version {erSubmission ? `v${erSubmission.version}` : "Not Submitted"}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    erSubmission?.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : erSubmission?.status === "approved"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : erSubmission?.status === "resubmission_requested"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : erSubmission?.status === "reviewed"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : erSubmission?.status === "submitted"
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {erSubmission?.status === "published"
                    ? "Official Grade Published"
                    : erSubmission?.status === "approved"
                    ? "Faculty Approved"
                    : erSubmission?.status === "resubmission_requested"
                    ? "Resubmission Requested"
                    : erSubmission?.status === "reviewed"
                    ? "AI & Faculty Reviewed"
                    : erSubmission?.status === "submitted"
                    ? "Submitted & Under Review"
                    : "No Submission"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Database Design & ER Diagram Specification</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload your group&apos;s relational schema model (PDF, PNG, JPG). All team members share this submission.
              </p>
            </div>

            <Button
              onClick={() => setShowERUploadModal(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              {erSubmission ? "Upload New Version" : "Upload ER Diagram"}
            </Button>
          </div>

          {/* Resubmission Alert if requested by faculty */}
          {erSubmission?.status === "resubmission_requested" && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-[16px] flex items-start gap-3 text-xs text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-rose-950 block text-sm">Faculty Requested Diagram Revisions</strong>
                <p className="mt-1 leading-relaxed">
                  {erSubmission.lecturerFeedback?.generalComments ||
                    "Please revise your ER diagram to address normalization and relationship cardinality issues before final defense."}
                </p>
              </div>
            </div>
          )}

          {/* Current Submitted Diagram Card */}
          {erSubmission ? (
            <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold">
                    {erSubmission.fileType === "pdf" ? <FileText className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{erSubmission.fileName}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Uploaded by <strong>{erSubmission.submittedByName}</strong> • {erSubmission.fileSize} • Version {erSubmission.version}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={erSubmission.fileUrl}
                    download={erSubmission.fileName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted text-foreground rounded-xl text-xs font-semibold border border-border transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>

              {erSubmission.versionNote && (
                <div className="p-3 bg-muted rounded-xl text-xs text-muted-foreground">
                  <strong className="text-foreground">Version Note:</strong> {erSubmission.versionNote}
                </div>
              )}

              {/* Diagram Visual Preview Box */}
              <div className="p-8 bg-slate-950 rounded-xl text-center text-muted-foreground font-mono text-xs border border-slate-800 flex flex-col items-center justify-center space-y-2">
                <Database className="w-12 h-12 text-teal-400 animate-pulse" />
                <p className="font-bold text-slate-200">{erSubmission.fileName} (v{erSubmission.version})</p>
                <p className="text-[11px] text-muted-foreground max-w-md">
                  Active relational schema model. Verified against GitHub database DDL in database/schema.sql.
                </p>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-card rounded-[16px] border border-border p-12 text-center max-w-xl mx-auto shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-[16px] bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No ER Diagram Uploaded Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                Upload your group&apos;s database model and ER diagram to trigger automated AI consistency analysis against your GitHub SQL schemas.
              </p>
              <Button
                onClick={() => setShowERUploadModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm"
              >
                Upload ER Diagram
              </Button>
            </div>
          )}

          {/* Database Implementation Submission (Physical Schema & DDL) */}
          <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 font-bold">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">Database Implementation Submission (DDL Schema)</h3>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Physical Schema Active
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Physical SQL implementation scripts synchronized from GitHub or direct upload.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                  database/schema.sql
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-muted rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Tables Implemented</span>
                <span className="text-base font-bold text-foreground mt-0.5 block">8 Relations</span>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Foreign Key Constraints</span>
                <span className="text-base font-bold text-teal-700 mt-0.5 block">14 Foreign Keys</span>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Index Coverage</span>
                <span className="text-base font-bold text-indigo-700 mt-0.5 block">100% Primary/FK</span>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">DDL Verification</span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                  <Check className="w-3.5 h-3.5" /> Aligned with ER
                </span>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p>
                <strong>Automated AI Consistency Engine:</strong> Gemini cross-checks the uploaded ER diagram cardinalities against the actual DDL foreign keys in your GitHub repository to ensure complete alignment between design and implementation.
              </p>
            </div>
          </div>

          {/* Published Evaluation Feedback (When Lecturer Publishes) */}
          {erSubmission?.lecturerFeedback?.isPublished && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-900 to-[#0B1220] rounded-[16px] p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">Official Assessment</span>
                  <h3 className="text-xl font-black mt-1">Database & ER Diagram Grade Published</h3>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Evaluated by <strong>{erSubmission.lecturerFeedback.lecturerName}</strong> on {new Date(erSubmission.lecturerFeedback.publishedAt || "").toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-400">
                    {erSubmission.lecturerFeedback.approvedMarks}
                  </span>
                  <span className="text-muted-foreground text-sm"> / 100 Marks</span>
                </div>
              </div>

              {erSubmission.lecturerFeedback.generalComments && (
                <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" /> Faculty Reviewer Comments
                  </h3>
                  <p className="text-xs text-foreground leading-relaxed bg-muted p-4 rounded-xl border border-border">
                    {erSubmission.lecturerFeedback.generalComments}
                  </p>
                </div>
              )}

              {/* If permitted by lecturer, show the AI analysis report */}
              {erSubmission.lecturerFeedback.allowStudentAIFeedbackView && erSubmission.aiAnalysis && (
                <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Gemini AI Consistency & Quality Findings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-muted rounded-xl border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Correctness</span>
                      <p className="text-xl font-black text-foreground mt-0.5">{erSubmission.aiAnalysis.overallCorrectnessScore}%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-xl border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Completeness</span>
                      <p className="text-xl font-black text-foreground mt-0.5">{erSubmission.aiAnalysis.completenessScore}%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-xl border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">SQL Consistency</span>
                      <p className="text-xl font-black text-foreground mt-0.5">{erSubmission.aiAnalysis.implementationConsistencyScore}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-foreground">Identified Design Improvements</h4>
                    {erSubmission.aiAnalysis.issues.map((iss, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-muted border border-border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{iss.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            iss.severity === "Critical" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {iss.severity}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{iss.explanation}</p>
                        <p className="text-teal-700 font-semibold text-[11px]">Correction: {iss.expectedCorrection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload ER Diagram Modal */}
      {showERUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-[16px] border border-border max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-teal-600" />
                Upload Database ER Diagram
              </h3>
              <button
                onClick={() => setShowERUploadModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Select Diagram File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setErFileName(f.name);
                      setErFileSize((f.size / (1024 * 1024)).toFixed(2) + " MB");
                      const ext = f.name.split(".").pop()?.toLowerCase();
                      setErFileType(ext === "png" ? "png" : ext === "jpg" || ext === "jpeg" ? "jpg" : "pdf");
                    }
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Version Description / Submission Note</label>
                <textarea
                  rows={2}
                  value={erVersionNote}
                  onChange={(e) => setErVersionNote(e.target.value)}
                  placeholder="e.g. Added composite key to event_registrations and normalized sensor tables..."
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl resize-none"
                />
              </div>

              {erError && <p className="text-rose-600 font-semibold">{erError}</p>}
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowERUploadModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!erFileName) {
                    setErError("Please select a file to upload.");
                    return;
                  }
                  setIsSubmittingER(true);
                  submitERDiagram(group.id, {
                    fileName: erFileName,
                    fileSize: erFileSize || "1.2 MB",
                    fileType: erFileType,
                    fileUrl: `/demo/${erFileName}`,
                    versionNote: erVersionNote,
                    submittedByName: group.members[0]?.fullName || "Student Team",
                    submittedByEmail: group.members[0]?.email || activeStudentEmail,
                  });
                  setIsSubmittingER(false);
                  setShowERUploadModal(false);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Submit Diagram
              </Button>
            </div>
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
        <div className="bg-card rounded-[16px] border border-border p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Loading shared group workspace...</p>
        </div>
      }
    >
      <GroupWorkspaceContent />
    </Suspense>
  );
}

