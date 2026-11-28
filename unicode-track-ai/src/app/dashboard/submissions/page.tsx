"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Inbox, 
  Search, 
  Filter, 
  FileText, 
  Database, 
  FolderGit2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  ChevronRight, 
  X, 
  Check, 
  Calendar,
  Layers,
  FileCode2,
  RefreshCw
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type SubmissionTypeFilter = "all" | "proposal" | "er_diagram" | "source_code" | "final_report";
type SubmissionStatusFilter = "all" | "submitted" | "under_review" | "approved" | "revision_requested" | "rejected";

interface SubmissionItem {
  id: string;
  projectId: string;
  projectTitle: string;
  courseCode: string;
  groupId: string;
  groupName: string;
  type: "proposal" | "er_diagram" | "source_code" | "final_report";
  typeLabel: string;
  title: string;
  fileName: string;
  fileSize: string;
  version: number;
  submittedBy: string;
  submittedByEmail: string;
  submittedAt: string;
  status: "submitted" | "under_review" | "approved" | "revision_requested" | "rejected";
  feedback?: string;
  score?: number;
  aiAnalyzed?: boolean;
}

export default function SubmissionsPage() {
  const { projects, groups, activeRole } = useAdminData();
  const isLecturer = activeRole === "lecturer";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [typeFilter, setTypeFilter] = useState<SubmissionTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "revision_requested" | "rejected">("approved");
  const [reviewComments, setReviewComments] = useState("");
  const [reviewScore, setReviewScore] = useState("88");
  const [revisionDeadline, setRevisionDeadline] = useState("2026-12-05");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Submissions state
  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);

  // Filtering
  const filteredSubmissions = submissionsList.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Handle Review Submission
  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSubmittingFeedback(true);
    setTimeout(() => {
      setSubmissionsList((prev) =>
        prev.map((sub) =>
          sub.id === selectedSubmission.id
            ? {
                ...sub,
                status: reviewDecision,
                feedback: reviewComments || sub.feedback,
                score: reviewScore ? parseInt(reviewScore, 10) : sub.score,
              }
            : sub
        )
      );
      setIsSubmittingFeedback(false);
      setSelectedSubmission(null);
    }, 500);
  };

  const getStatusBadge = (status: SubmissionItem["status"]) => {
    switch (status) {
      case "approved":
        return <Badge variant="teal" size="sm">Approved</Badge>;
      case "revision_requested":
        return <Badge variant="warning" size="sm">Revision Requested</Badge>;
      case "rejected":
        return <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Rejected</span>;
      case "under_review":
        return <Badge variant="default" size="sm">Under Review</Badge>;
      default:
        return <Badge variant="default" size="sm">Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Project Submissions & Reviews
            </h2>
            <Badge variant="teal" size="sm" suppressHydrationWarning>
              <span suppressHydrationWarning>{mounted ? filteredSubmissions.length : 0} Items</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Evaluate student proposals, review ER diagrams, inspect source code deliverables, and publish revision requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/evaluation"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rubric Evaluation Console</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Submissions</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">{submissionsList.length}</span>
            <span className="text-xs text-muted-foreground">Delivered</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Pending Review</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {submissionsList.filter((s) => s.status === "submitted" || s.status === "under_review").length}
            </span>
            <span className="text-xs text-amber-700">Needs action</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs">
          <span className="text-[10px] font-bold text-teal-600 uppercase">Approved</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-teal-700 font-mono">
              {submissionsList.filter((s) => s.status === "approved").length}
            </span>
            <span className="text-xs text-teal-700">Accepted</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Revisions Requested</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600 font-mono">
              {submissionsList.filter((s) => s.status === "revision_requested").length}
            </span>
            <span className="text-xs text-rose-700">Resubmission</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs space-y-4">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
          {[
            { id: "all", label: "All Submissions", icon: Inbox },
            { id: "proposal", label: "Proposals (Section 7)", icon: FileText },
            { id: "er_diagram", label: "ER Diagrams & DB (Section 8)", icon: Database },
            { id: "source_code", label: "Source Code & DDL (Section 10)", icon: FolderGit2 },
            { id: "final_report", label: "Final Reports (Section 12)", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as SubmissionTypeFilter)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-[#0B1220] text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-teal-400" : "text-muted-foreground"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, group, student, or course..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:border-transparent text-foreground bg-muted focus:bg-muted transition-all placeholder:text-muted-foreground"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SubmissionStatusFilter)}
              className="px-3 py-1.5 rounded-xl border border-border text-xs text-foreground bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="revision_requested">Revision Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table List */}
      <div className="bg-card rounded-[16px] border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6">Submission & Group</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Submitted By</th>
                <th className="py-3.5 px-4">Status & Score</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-semibold text-muted-foreground">No submissions found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Try adjusting the filter tab or search keywords.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            {sub.courseCode}
                          </span>
                          <span className="font-bold text-foreground group-hover:text-accent transition-colors">
                            {sub.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {sub.groupName} • <span className="font-mono text-muted-foreground">{sub.fileName}</span> ({sub.fileSize}) • v{sub.version}.0
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                        {sub.type === "proposal" && <FileText className="w-3 h-3 text-indigo-600" />}
                        {sub.type === "er_diagram" && <Database className="w-3 h-3 text-purple-600" />}
                        {sub.type === "source_code" && <FileCode2 className="w-3 h-3 text-teal-600" />}
                        {sub.type === "final_report" && <Layers className="w-3 h-3 text-sky-600" />}
                        <span>{sub.typeLabel}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <p className="font-semibold text-foreground">{sub.submittedBy}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{sub.submittedByEmail}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(sub.status)}
                        {sub.score !== undefined && (
                          <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[10px]">
                            {sub.score}/100
                          </span>
                        )}
                        {sub.aiAnalyzed && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-semibold" title="Gemini AI Analysis Ready">
                            AI
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 hidden lg:table-cell text-muted-foreground font-mono text-[11px]">
                      {sub.submittedAt}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setReviewDecision(sub.status === "revision_requested" ? "revision_requested" : "approved");
                            setReviewComments(sub.feedback || "");
                            setReviewScore(sub.score ? sub.score.toString() : "88");
                          }}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition-colors"
                        >
                          Review & Grade
                        </button>

                        <a
                          href="#download"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Downloading file: ${sub.fileName}`);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                          title="Download submitted file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Grading Modal (Sections 7, 8, 12, 14) */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-xl rounded-[16px] border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedSubmission.courseCode} • {selectedSubmission.typeLabel}
                </span>
                <h3 className="font-bold text-base text-foreground mt-1">
                  {selectedSubmission.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted by <strong>{selectedSubmission.submittedBy}</strong> ({selectedSubmission.groupName})
                </p>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 text-muted-foreground hover:text-muted-foreground rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Details Strip */}
            <div className="p-3.5 bg-muted rounded-xl border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-[10px]">
                  PDF
                </div>
                <div>
                  <p className="font-bold text-foreground">{selectedSubmission.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedSubmission.fileSize} • Version {selectedSubmission.version}.0</p>
                </div>
              </div>

              <a
                href="#download"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Downloading: ${selectedSubmission.fileName}`);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-xs font-semibold shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>

            {/* AI Analysis Quick Preview if available */}
            {selectedSubmission.aiAnalyzed && (
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Gemini 2.5 Flash Evaluation Summary
                  </span>
                  <span className="font-mono text-purple-700 font-bold">Suggested: 92/100</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Entity schema conforms to 3NF. 1 minor cardinality concern flagged in event attendee registration table.
                </p>
                <Link
                  href={`/dashboard/projects/${selectedSubmission.projectId}/groups/${selectedSubmission.groupId}/evaluation`}
                  className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1 text-[11px] pt-1"
                >
                  Open Full AI Rubric Report <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Evaluation Form */}
            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Faculty Evaluation Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("approved")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      reviewDecision === "approved"
                        ? "bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("revision_requested")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      reviewDecision === "revision_requested"
                        ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Request Revision
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("rejected")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      reviewDecision === "rejected"
                        ? "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Rubric Score & Revision Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">Awarded Marks (/100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl font-mono font-bold text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">Revision Deadline (if requested)</label>
                  <input
                    type="date"
                    value={revisionDeadline}
                    onChange={(e) => setRevisionDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-foreground font-mono"
                  />
                </div>
              </div>

              {/* Comments & Revision Guidelines */}
              <div className="space-y-1">
                <label className="block font-semibold text-foreground">
                  Constructive Feedback & Revision Guidelines <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why revisions are requested or provide specific feedback for students..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-foreground resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingFeedback}
                  icon={isSubmittingFeedback ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                >
                  {isSubmittingFeedback ? "Publishing Decision..." : "Publish Decision & Notify Group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
