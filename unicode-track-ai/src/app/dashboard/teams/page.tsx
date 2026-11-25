"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  FolderGit2,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  GraduationCap,
  ChevronRight,
  GitBranch,
  ShieldCheck,
  AlertCircle,
  Plus,
  Layers,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { LecturerGroupCard } from "@/components/groups/LecturerGroupCard";
import { Button } from "@/components/ui/Button";

export default function StudentTeamsOverviewPage() {
  const {
    groups,
    projects,
    courses,
    lecturers,
    activeLecturerEmail,
    activeRole,
  } = useAdminData();

  const currentLecturer = lecturers.find(
    (l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase()
  ) || lecturers[0];

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedProposalStatus, setSelectedProposalStatus] = useState("all");
  const [selectedRepoStatus, setSelectedRepoStatus] = useState("all");

  // Lecturer assigned courses filter (only show groups belonging to lecturer's assigned courses unless in admin view)
  const lecturerCourseCodes = currentLecturer?.assignedCourses || [];

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((grp) => {
      const proj = projects.find((p) => p.id === grp.projectId);

      // Lecturer filter: only show groups under lecturer's assigned courses if in lecturer mode
      if (activeRole === "lecturer" && proj) {
        const isAssigned =
          proj.lecturerId === currentLecturer?.id ||
          lecturerCourseCodes.includes(proj.courseCode);
        if (!isAssigned) return false;
      }

      // Course filter
      if (selectedCourse !== "all" && proj && proj.courseCode !== selectedCourse) {
        return false;
      }

      // Proposal status filter
      if (selectedProposalStatus !== "all" && grp.proposalStatus !== selectedProposalStatus) {
        return false;
      }

      // Repository status filter
      if (selectedRepoStatus !== "all" && grp.repoStatus !== selectedRepoStatus) {
        return false;
      }

      // Search query filter (matches group name, member full name, university ID, project title)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesGroupName = grp.groupName.toLowerCase().includes(q);
        const matchesProject = (proj?.title || "").toLowerCase().includes(q);
        const matchesCourse = (proj?.courseCode || "").toLowerCase().includes(q);
        const matchesMember = grp.members.some(
          (m) =>
            m.fullName.toLowerCase().includes(q) ||
            (m.studentId || "").toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        );

        if (!matchesGroupName && !matchesProject && !matchesCourse && !matchesMember) {
          return false;
        }
      }

      return true;
    });
  }, [
    groups,
    projects,
    activeRole,
    currentLecturer,
    lecturerCourseCodes,
    selectedCourse,
    selectedProposalStatus,
    selectedRepoStatus,
    searchQuery,
  ]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalStudents = groups.reduce((acc, g) => acc + g.members.length, 0);
    const connectedRepos = groups.filter((g) => g.repoStatus === "connected").length;
    const proposalsSubmitted = groups.filter(
      (g) => g.proposalStatus === "submitted" || g.proposalStatus === "approved"
    ).length;

    return { totalGroups, totalStudents, connectedRepos, proposalsSubmitted };
  }, [groups]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0B1220] flex items-center justify-center text-teal-400 shadow-xs border border-slate-800">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] tracking-tight">
                Student Teams & Workspaces
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {filteredGroups.length} Teams Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitor team rosters, university IDs, GitHub commit telemetry, milestone progress, and proposal submissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/projects/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project & Assign Teams
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Cohort Teams
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] mt-1">
            {stats.totalGroups}
          </div>
          <div className="text-xs text-teal-700 font-medium mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Across curriculum courses
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            Enrolled Students
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] mt-1">
            {stats.totalStudents}
          </div>
          <div className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" /> Verified university IDs
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            GitHub Connected
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] mt-1">
            {stats.connectedRepos}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <FolderGit2 className="w-3.5 h-3.5" /> Repositories synced
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Proposals Submitted
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1220] mt-1">
            {stats.proposalsSubmitted}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Reviewed & pending
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by team, student name, university ID (CS2023001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Course filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:border-teal-500 focus:bg-white"
            >
              <option value="all">All Courses</option>
              {courses.map((crs) => (
                <option key={crs.id} value={crs.code}>
                  {crs.code} - {crs.name}
                </option>
              ))}
            </select>
          </div>

          {/* Proposal status filter */}
          <div>
            <select
              value={selectedProposalStatus}
              onChange={(e) => setSelectedProposalStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:border-teal-500 focus:bg-white"
            >
              <option value="all">All Proposal Statuses</option>
              <option value="approved">Approved</option>
              <option value="submitted">Under Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="not_submitted">Not Submitted</option>
            </select>
          </div>

          {/* Repository status filter */}
          <div>
            <select
              value={selectedRepoStatus}
              onChange={(e) => setSelectedRepoStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:border-teal-500 focus:bg-white"
            >
              <option value="all">All Repo Statuses</option>
              <option value="connected">GitHub Connected</option>
              <option value="disconnected">Repository Unlinked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Teams Cards Grid */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No student teams found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No groups matched your active search or filter criteria. Try clearing filters to view all cohort teams.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("all");
                setSelectedProposalStatus("all");
                setSelectedRepoStatus("all");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredGroups.map((group) => {
            const project = projects.find((p) => p.id === group.projectId);
            const course = courses.find((c) => c.code === project?.courseCode);

            return (
              <LecturerGroupCard
                key={group.id}
                group={group}
                project={project}
                courseName={course?.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
