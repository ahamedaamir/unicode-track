"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  Sparkles,
  FileText,
  Users,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Archive,
  Trash2,
  GitBranch,
  Layers,
  ChevronRight,
  Award,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const {
    projects,
    courses,
    departments,
    lecturers,
    publishProject,
    archiveProject,
    deleteProject,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "teams">("overview");
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;
  const department = project ? departments.find((d) => d.id === project.departmentId) : null;
  const lecturer = project ? lecturers.find((l) => l.id === project.lecturerId || l.name === project.lecturerName) : null;

  if (!project) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <FolderKanban className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested project ID <span className="font-mono text-slate-700 font-semibold">{projectId}</span> could not be found or may have been removed.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Projects
        </Link>
      </div>
    );
  }

  const handleCopyRequirements = () => {
    if (!project.requirementsContent) return;
    navigator.clipboard.writeText(project.requirementsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    router.push("/dashboard/projects");
  };

  // Demo student teams assigned to this project
  const demoTeams = [
    {
      id: "team-1",
      name: "Team CyberNova",
      members: ["Priya Patel (Lead)", "Liam Davis", "Maya Wang"],
      repo: "github.com/unicodetrack-demo/cybernova-event-hub",
      commits: 48,
      lastCommit: "3 hours ago",
      health: "On Track",
      progress: 78,
    },
    {
      id: "team-2",
      name: "Team QuantumByte",
      members: ["Carlos Ruiz (Lead)", "Aisha Tariq"],
      repo: "github.com/unicodetrack-demo/quantum-biomed-iot",
      commits: 34,
      lastCommit: "1 day ago",
      health: "Review Required",
      progress: 55,
    },
    {
      id: "team-3",
      name: "Team ApexEngineers",
      members: ["Jordan Miller (Lead)", "Sophia Chen", "David O'Connor"],
      repo: "github.com/unicodetrack-demo/apex-symposium-web",
      commits: 62,
      lastCommit: "45 mins ago",
      health: "On Track",
      progress: 90,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 hover:text-teal-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Projects
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-teal-600 font-semibold">{project.courseCode}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-medium truncate max-w-xs">{project.title}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {project.status === "Draft" ? (
            <button
              onClick={() => publishProject(project.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publish Project
            </button>
          ) : (
            <button
              onClick={() => archiveProject(project.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-all"
            >
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              {project.status === "Archived" ? "Restore to Active" : "Archive"}
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Hero Project Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  project.status === "Published"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : project.status === "Draft"
                    ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    project.status === "Published"
                      ? "bg-emerald-500 animate-pulse"
                      : project.status === "Draft"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />
                {project.status}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {project.type === "Group Project" ? (
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-500" />
                )}
                {project.type}
              </span>

              {project.requirementsSource === "ai" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Gemini 2.5 Flash Generated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Faculty PDF Specification
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {project.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
              {project.description}
            </p>
          </div>

          {/* Quick Academic Meta Pill Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 lg:w-72 shrink-0 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Course Information</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Course Code:</span>
                <span className="font-bold text-teal-600">{project.courseCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Cohort:</span>
                <span className="font-medium text-slate-800">
                  Year {project.academicYear}, Sem {project.semester}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Deadline:</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {project.deadline
                    ? new Date(project.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No deadline"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Supervising Faculty:</span>
                <span className="font-medium text-slate-800 truncate max-w-[130px]" title={project.lecturerName}>
                  {project.lecturerName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-200/80">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Overview & Rubric
          </button>
          <button
            onClick={() => setActiveTab("requirements")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "requirements"
                ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {project.requirementsSource === "ai" ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            Requirements Specification
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "teams"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Student Teams ({demoTeams.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Rubric */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Assignment Details */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Academic Scope & Assignment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Department</div>
                  <div className="text-slate-900 font-semibold mt-1">
                    {department?.name || "Faculty of Computing & Information"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Assigned Course</div>
                  <div className="text-slate-900 font-semibold mt-1">
                    {project.courseCode} {course ? `— ${course.name}` : ""}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Student Cohort</div>
                  <div className="text-slate-900 font-semibold mt-1">
                    Year {project.academicYear}, Semester {project.semester}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Project Format</div>
                  <div className="text-slate-900 font-semibold mt-1">
                    {project.type} (Maximum 4 students per team)
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Milestones */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Submission Milestones & Deadlines
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                    M1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Architecture Proposal & Schema</h4>
                      <span className="text-xs font-semibold text-teal-600">Week 4</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Entity Relationship Diagrams, API specification, wireframes, and GitHub repo initialization.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                    M2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Functional MVP & CI/CD Pipeline</h4>
                      <span className="text-xs font-semibold text-teal-600">Week 8</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Working user flows, database integration, automated unit tests, and minimum viable feature set.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/20 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                    M3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Production Release & Defense</h4>
                      <span className="text-xs font-semibold text-emerald-600 font-bold">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : "TBD"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Live deployment, defense presentation, automated Git AI contribution report, and technical documentation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Evaluation Weights */}
          <div className="space-y-6">
            {/* Rubric Weights */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                Evaluation Rubric Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Official grading criteria evaluated with AI git metrics and viva voce panel defense:
              </p>
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Feature Completeness & Logic</span>
                    <span className="font-bold text-slate-900">30%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Software Architecture & DB</span>
                    <span className="font-bold text-slate-900">25%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Git Velocity & Team Commits</span>
                    <span className="font-bold text-slate-900">20%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Automated Tests & Quality</span>
                    <span className="font-bold text-slate-900">15%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "15%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Oral Defense & Demo</span>
                    <span className="font-bold text-slate-900">10%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Supervising Faculty Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                Supervising Lecturer
              </h3>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-500/20">
                  {(project.lecturerName || "Faculty Member")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{project.lecturerName}</div>
                  <div className="text-xs text-slate-500">{lecturer?.email || "faculty@university.edu"}</div>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Course Coordinator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requirements Specification */}
      {activeTab === "requirements" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                {project.requirementsSource === "ai" ? (
                  <Sparkles className="w-5 h-5 text-teal-600" />
                ) : (
                  <FileText className="w-5 h-5 text-indigo-600" />
                )}
                <h3 className="text-lg font-bold text-slate-900">
                  {project.requirementsSource === "ai"
                    ? "Standard 12-Section Academic Specification"
                    : "Uploaded Faculty PDF Rubric"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {project.requirementsSource === "ai"
                  ? "Generated with Google Gemini 2.5 Flash and verified for institutional compliance."
                  : "Official course rubric document uploaded by course supervisor."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {project.requirementsSource === "ai" && project.requirementsContent && (
                <button
                  onClick={handleCopyRequirements}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Content renderer */}
          {project.requirementsSource === "ai" ? (
            project.requirementsContent ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner">
                {project.requirementsContent}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-semibold text-slate-800">No Specification Text</h4>
                <p className="text-xs text-slate-500 mt-1">
                  No text requirements were stored with this project record.
                </p>
              </div>
            )
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-500/20">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {project.requirementsPdfName || "Course_Project_Specification.pdf"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  File Size: {project.requirementsPdfSize || "1.2 MB"} • Format: Portable Document Format (PDF)
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="#download"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading specification PDF: ${project.requirementsPdfName || "document.pdf"}`);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-600/20"
                >
                  <Download className="w-4 h-4" />
                  Download Specification PDF
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Student Teams */}
      {activeTab === "teams" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registered Student Cohort Teams</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor team formation, live GitHub telemetry, sprint progress, and submission readiness.
              </p>
            </div>
            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold border border-teal-200">
              {demoTeams.length} Teams Registered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {demoTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-base">{team.name}</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        team.health === "On Track"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {team.health}
                    </span>
                  </div>

                  {/* Team Members */}
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <div className="font-medium text-slate-400 text-[11px] uppercase tracking-wider">Members</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {team.members.map((m, i) => (
                        <li key={i} className="truncate">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Milestone Progress</span>
                      <span className="font-bold text-slate-800">{team.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-500 h-full rounded-full"
                        style={{ width: `${team.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* GitHub info */}
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] truncate">
                    <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span className="truncate">{team.repo}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-teal-600" />
                      {team.commits} commits
                    </span>
                    <span>Last commit {team.lastCommit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Project?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">&ldquo;{project.title}&rdquo;</strong>?
                This will unassign student teams and delete all associated submission history.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-rose-600/20"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Loading academic project details...</p>
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
