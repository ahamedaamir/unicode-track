"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  CheckSquare, 
  BarChart3, 
  Sliders, 
  Check, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Download, 
  FolderGit2, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Users, 
  Code2, 
  Database, 
  FileText,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxMarks: number;
}

interface GroupEvaluationSummary {
  groupId: string;
  groupName: string;
  projectId: string;
  projectTitle: string;
  courseCode: string;
  repoUrl?: string;
  totalCommits: number;
  proposalStatus: string;
  erDiagramStatus: string;
  aiSuggestedScore: number;
  lecturerScore?: number;
  status: "not_evaluated" | "ai_completed" | "approved" | "published";
  reviewedAt?: string;
}

export default function EvaluationsPage() {
  const { projects, groups, activeRole } = useAdminData();
  const isLecturer = activeRole === "lecturer";

  const [activeTab, setActiveTab] = useState<"cohort_evaluations" | "rubrics_manager" | "code_findings">("cohort_evaluations");

  // Standard Rubric Criteria state (Section 13)
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([
    {
      id: "crit-1",
      name: "ER Diagram Correctness",
      description: "Entities, attributes, keys, and cardinalities match project specification.",
      maxMarks: 20,
    },
    {
      id: "crit-2",
      name: "Database Implementation",
      description: "PostgreSQL DDL scripts, foreign key cascades, normalization, and constraints.",
      maxMarks: 20,
    },
    {
      id: "crit-3",
      name: "Code Quality & Architecture",
      description: "Modular C / full-stack structure, memory safety, clean error handling.",
      maxMarks: 20,
    },
    {
      id: "crit-4",
      name: "Functional Requirements Fulfillment",
      description: "Core milestone deliverables implemented and verified against project brief.",
      maxMarks: 25,
    },
    {
      id: "crit-5",
      name: "Documentation & Git Telemetry",
      description: "Detailed system defense report, balanced commit velocity across members.",
      maxMarks: 15,
    },
  ]);

  // Cohort Group Evaluations
  const [cohortEvaluations, setCohortEvaluations] = useState<GroupEvaluationSummary[]>([
    {
      groupId: "grp-1",
      groupName: "Group 01 — CyberNova",
      projectId: "proj-1",
      projectTitle: "University Event & Symposium Management System",
      courseCode: "CS304",
      repoUrl: "https://github.com/unicodetrack-demo/cybernova-event-hub",
      totalCommits: 28,
      proposalStatus: "approved",
      erDiagramStatus: "analyzed",
      aiSuggestedScore: 92,
      lecturerScore: 94,
      status: "published",
      reviewedAt: "Nov 23, 2026",
    },
    {
      groupId: "grp-2",
      groupName: "Group 02 — DataSphere",
      projectId: "proj-2",
      projectTitle: "Distributed Edge Sensor Pipeline & Telemetry",
      courseCode: "ICT2142",
      repoUrl: "https://github.com/unicodetrack-demo/datasphere-pipeline",
      totalCommits: 19,
      proposalStatus: "approved",
      erDiagramStatus: "revision_requested",
      aiSuggestedScore: 84,
      lecturerScore: 85,
      status: "approved",
      reviewedAt: "Nov 22, 2026",
    },
    {
      groupId: "grp-3",
      groupName: "Group 03 — NexusTech",
      projectId: "proj-1",
      projectTitle: "University Event & Symposium Management System",
      courseCode: "CS304",
      repoUrl: "https://github.com/unicodetrack-demo/nexustech-portal",
      totalCommits: 14,
      proposalStatus: "submitted",
      erDiagramStatus: "submitted",
      aiSuggestedScore: 78,
      status: "ai_completed",
    },
    {
      groupId: "grp-4",
      groupName: "Group 04 — CloudPulse",
      projectId: "proj-2",
      projectTitle: "Distributed Edge Sensor Pipeline & Telemetry",
      courseCode: "ICT2142",
      totalCommits: 6,
      proposalStatus: "submitted",
      erDiagramStatus: "pending",
      aiSuggestedScore: 72,
      status: "not_evaluated",
    },
  ]);

  // Edit Marks Modal
  const [editingGroup, setEditingGroup] = useState<GroupEvaluationSummary | null>(null);
  const [modalLecturerScore, setModalLecturerScore] = useState("90");
  const [modalFeedback, setModalFeedback] = useState("");
  const [publishImmediately, setPublishImmediately] = useState(true);

  // Rubric total marks calculation
  const totalRubricMarks = rubricCriteria.reduce((sum, c) => sum + c.maxMarks, 0);

  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    const scoreNum = parseInt(modalLecturerScore, 10) || 85;
    setCohortEvaluations((prev) =>
      prev.map((g) =>
        g.groupId === editingGroup.groupId
          ? {
              ...g,
              lecturerScore: scoreNum,
              status: publishImmediately ? "published" : "approved",
              reviewedAt: "Just now",
            }
          : g
      )
    );
    setEditingGroup(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1220] tracking-tight">
              Evaluations, Rubrics & Grading
            </h2>
            <Badge variant="teal" size="sm">
              Standard 100-Mark Rubric
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure academic rubrics, inspect Gemini AI evaluation recommendations, approve faculty marks, and publish results to student dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/submissions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Submissions Ledger</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Evaluated Groups</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {cohortEvaluations.filter((g) => g.status === "approved" || g.status === "published").length}
            </span>
            <span className="text-xs text-slate-500">of {cohortEvaluations.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-teal-600 uppercase">Average Cohort Mark</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-teal-700 font-mono">87.5%</span>
            <span className="text-xs text-teal-600">Mean score</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase">AI Recommendations</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-700 font-mono">
              {cohortEvaluations.filter((g) => g.status === "ai_completed").length}
            </span>
            <span className="text-xs text-purple-600">Pending approval</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Published to Students</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono">
              {cohortEvaluations.filter((g) => g.status === "published").length}
            </span>
            <span className="text-xs text-emerald-600">Results live</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl max-w-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab("cohort_evaluations")}
          className={`flex-1 py-2 px-3 rounded-xl transition-all ${
            activeTab === "cohort_evaluations"
              ? "bg-white text-slate-900 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Cohort Evaluations ({cohortEvaluations.length})
        </button>
        <button
          onClick={() => setActiveTab("rubrics_manager")}
          className={`flex-1 py-2 px-3 rounded-xl transition-all ${
            activeTab === "rubrics_manager"
              ? "bg-white text-slate-900 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Rubric Criteria ({rubricCriteria.length})
        </button>
        <button
          onClick={() => setActiveTab("code_findings")}
          className={`flex-1 py-2 px-3 rounded-xl transition-all ${
            activeTab === "code_findings"
              ? "bg-white text-slate-900 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          AI Code Review Findings
        </button>
      </div>

      {/* TAB 1: COHORT GROUP EVALUATIONS */}
      {activeTab === "cohort_evaluations" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Student Group Academic Evaluations</h3>
              <p className="text-xs text-slate-500">Review AI-assisted scores, override recommendations, and publish final marks.</p>
            </div>
            <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-semibold">
              AI suggestions require lecturer approval before release
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Group & Project</th>
                  <th className="py-3.5 px-4">Telemetry</th>
                  <th className="py-3.5 px-4">AI Suggested</th>
                  <th className="py-3.5 px-4">Faculty Approved</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohortEvaluations.map((item) => (
                  <tr key={item.groupId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            {item.courseCode}
                          </span>
                          <span className="font-bold text-slate-900">{item.groupName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">{item.projectTitle}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <span>{item.totalCommits} commits</span>
                      <span className="block text-[10px] text-slate-400">Proposal: {item.proposalStatus}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-xs">
                        {item.aiSuggestedScore}/100
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-xs">
                      {item.lecturerScore !== undefined ? (
                        <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {item.lecturerScore}/100
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">Pending Review</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.status === "published" ? (
                        <Badge variant="teal" size="sm">Published</Badge>
                      ) : item.status === "approved" ? (
                        <Badge variant="default" size="sm">Approved</Badge>
                      ) : item.status === "ai_completed" ? (
                        <span className="text-[10px] font-semibold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                          AI Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Not Evaluated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/projects/${item.projectId}/groups/${item.groupId}/evaluation`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>AI Report</span>
                        </Link>

                        <button
                          onClick={() => {
                            setEditingGroup(item);
                            setModalLecturerScore(item.lecturerScore ? item.lecturerScore.toString() : item.aiSuggestedScore.toString());
                            setModalFeedback(`Final marks approved based on standard rubric criteria and C source code execution.`);
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          {item.status === "published" ? "Edit Marks" : "Grade & Publish"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RUBRIC CRITERIA MANAGER (Section 13) */}
      {activeTab === "rubrics_manager" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                Standard Academic Capstone Rubric (100 Marks)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define evaluation criteria, weight allocations, and performance descriptions for all academic projects.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                Total Marks: {totalRubricMarks} / 100
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {rubricCriteria.map((crit, idx) => (
              <div
                key={crit.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold">0{idx + 1}.</span>
                    <h4 className="font-bold text-slate-900 text-sm">{crit.name}</h4>
                  </div>
                  <p className="text-slate-600">{crit.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-sm text-teal-700">{crit.maxMarks}</span>
                    <span className="text-[10px] text-slate-400 block font-bold">Max Marks</span>
                  </div>
                  <button
                    onClick={() => {
                      const newMarks = prompt(`Enter new maximum marks for "${crit.name}":`, crit.maxMarks.toString());
                      if (newMarks && !isNaN(parseInt(newMarks, 10))) {
                        setRubricCriteria((prev) =>
                          prev.map((c) => (c.id === crit.id ? { ...c, maxMarks: parseInt(newMarks, 10) } : c))
                        );
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white"
                    title="Edit mark weight"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p>
              This standard rubric is automatically applied when executing Gemini AI code reviews and evaluating student ER diagrams. Lecturers can override individual criterion scores during final review.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: AI CODE REVIEW FINDINGS (Section 11) */}
      {activeTab === "code_findings" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Automated Code Review Findings (Gemini 2.5 Flash)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Findings categorized into Critical, High, Medium, Low, and Informational severity.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                severity: "Critical",
                color: "rose",
                desc: "Potential buffer overflow in packet enqueue without ring capacity check",
                file: "src/telemetry.c:84",
                correction: "Add fixed ring buffer head/tail wrapping check: (head + 1) % MAX_CAPACITY.",
                group: "Group 01 — CyberNova",
              },
              {
                severity: "High",
                color: "amber",
                desc: "Missing FOREIGN KEY constraint on sensor_telemetry table referencing symposium_events",
                file: "database/001_symposium_schema.sql:32",
                correction: "Add CONSTRAINT fk_telemetry_event FOREIGN KEY (event_id) REFERENCES symposium_events(id) ON DELETE CASCADE.",
                group: "Group 02 — DataSphere",
              },
              {
                severity: "Medium",
                color: "indigo",
                desc: "Unchecked return value of malloc() in dynamic matrix allocation",
                file: "src/matrix_util.c:19",
                correction: "Verify if (ptr == NULL) and handle graceful exit or error code dispatch.",
                group: "Group 03 — NexusTech",
              },
              {
                severity: "Informational",
                color: "teal",
                desc: "Good normalization structure adhering to 3NF relational requirements",
                file: "database/schema.sql",
                correction: "No action required. Architecture satisfies course guidelines.",
                group: "Group 01 — CyberNova",
              },
            ].map((finding, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        finding.severity === "Critical"
                          ? "bg-rose-100 text-rose-800"
                          : finding.severity === "High"
                          ? "bg-amber-100 text-amber-800"
                          : finding.severity === "Medium"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-teal-100 text-teal-800"
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <strong className="text-slate-900">{finding.desc}</strong>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{finding.group}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-700 flex items-center justify-between">
                  <span>File: <strong>{finding.file}</strong></span>
                  <span className="text-teal-700 font-semibold text-[10px]">Suggested Fix Included</span>
                </div>

                <p className="text-slate-600 text-[11px]">
                  <strong>Recommendation:</strong> {finding.correction}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grade & Publish Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {editingGroup.courseCode}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Faculty Grading: {editingGroup.groupName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingGroup.projectTitle}</p>
              </div>
              <button
                onClick={() => setEditingGroup(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarks} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 flex items-center justify-between">
                <span>Gemini AI Recommended Score:</span>
                <strong className="font-mono text-purple-700 font-bold">{editingGroup.aiSuggestedScore}/100</strong>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Approved Faculty Score (/100) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={modalLecturerScore}
                  onChange={(e) => setModalLecturerScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Official Faculty Feedback</label>
                <textarea
                  rows={3}
                  value={modalFeedback}
                  onChange={(e) => setModalFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 resize-none text-xs"
                />
              </div>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="text-teal-600 rounded"
                />
                <span className="text-slate-800 font-semibold">
                  Publish marks immediately to student group dashboard
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingGroup(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save & Publish Marks
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
