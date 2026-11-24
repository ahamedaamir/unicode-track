"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Copy,
  ExternalLink,
  Layers,
  GraduationCap,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/context/AdminDataContext";
import { Student } from "@/types/admin";
import {
  ProcessedGroup,
  ProcessedMember,
  MatchStatus,
  revalidateAssignmentGroups,
  ExtractionResult,
} from "@/services/ai/extract-groups";
import { ProjectGroup } from "@/types/project";

interface LecturerGroupReviewWorkspaceProps {
  projectId: string;
  projectTitle?: string;
  initialGroups: ProcessedGroup[];
  initialWarnings?: string[];
  targetDepartmentId?: string;
  onConfirmed?: (createdGroups: ProjectGroup[]) => void;
  onCancel?: () => void;
  className?: string;
}

export function LecturerGroupReviewWorkspace({
  projectId,
  projectTitle = "Academic Project",
  initialGroups,
  initialWarnings = [],
  targetDepartmentId,
  onConfirmed,
  onCancel,
  className = "",
}: LecturerGroupReviewWorkspaceProps) {
  const { students, addGroup, setProjectGroups } = useAdminData();

  // Review editable state
  const [groups, setGroups] = useState<ProcessedGroup[]>(initialGroups);

  // Editing group name & number state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupNameVal, setEditGroupNameVal] = useState("");
  const [editGroupNumVal, setEditGroupNumVal] = useState<number>(1);

  // Student Picker Modal state (for resolving unmatched/ambiguous or adding manually)
  const [pickerTarget, setPickerTarget] = useState<{
    groupId: string;
    memberId?: string; // If undefined, we are adding a new member to the group
  } | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  // Confirmation state
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmedSuccessGroups, setConfirmedSuccessGroups] = useState<ProjectGroup[] | null>(null);

  // Compute live revalidation statistics and warnings
  const { groups: validatedGroups, warnings: liveWarnings, stats } = useMemo(() => {
    return revalidateAssignmentGroups(groups, students, targetDepartmentId);
  }, [groups, students, targetDepartmentId]);

  // Combined warnings
  const allWarnings = useMemo(() => {
    return Array.from(new Set([...initialWarnings, ...liveWarnings]));
  }, [initialWarnings, liveWarnings]);

  // Filtered students for manual picker
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = studentSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q);

      const matchesDept =
        selectedDeptFilter === "all" || s.departmentId === selectedDeptFilter;

      return matchesQuery && matchesDept;
    });
  }, [students, studentSearchQuery, selectedDeptFilter]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.departmentId) set.add(s.departmentId);
    });
    return Array.from(set);
  }, [students]);

  // ---------------------------------------------------------------------------
  // GROUP MANAGEMENT ACTIONS
  // ---------------------------------------------------------------------------

  // Add a new empty group
  const handleAddNewGroup = () => {
    const nextNum = groups.length > 0 ? Math.max(...groups.map((g) => g.group_number)) + 1 : 1;
    const newGroup: ProcessedGroup = {
      id: `grp-user-${Date.now()}`,
      group_number: nextNum,
      group_name: `Group ${nextNum}`,
      members: [],
    };
    setGroups([...groups, newGroup]);
  };

  // Remove a group
  const handleRemoveGroup = (groupId: string) => {
    const updated = groups.filter((g) => g.id !== groupId);
    // Renumber groups sequentially
    const renumbered = updated.map((g, idx) => ({
      ...g,
      group_number: idx + 1,
      group_name: g.group_name.startsWith("Group ") ? `Group ${idx + 1}` : g.group_name,
    }));
    setGroups(renumbered);
  };

  // Reorder group up
  const handleMoveGroupUp = (idx: number) => {
    if (idx <= 0) return;
    const copy = [...groups];
    const temp = copy[idx - 1];
    copy[idx - 1] = copy[idx];
    copy[idx] = temp;

    // Renumber
    const renumbered = copy.map((g, i) => ({
      ...g,
      group_number: i + 1,
    }));
    setGroups(renumbered);
  };

  // Reorder group down
  const handleMoveGroupDown = (idx: number) => {
    if (idx >= groups.length - 1) return;
    const copy = [...groups];
    const temp = copy[idx + 1];
    copy[idx + 1] = copy[idx];
    copy[idx] = temp;

    // Renumber
    const renumbered = copy.map((g, i) => ({
      ...g,
      group_number: i + 1,
    }));
    setGroups(renumbered);
  };

  // Save edited group name & group number
  const handleSaveGroupName = (groupId: string) => {
    if (!editGroupNameVal.trim()) {
      setEditingGroupId(null);
      return;
    }
    const updated = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            group_name: editGroupNameVal.trim(),
            group_number: editGroupNumVal > 0 ? editGroupNumVal : g.group_number,
          }
        : g
    );
    setGroups(updated);
    setEditingGroupId(null);
  };

  // ---------------------------------------------------------------------------
  // STUDENT ASSIGNMENT ACTIONS
  // ---------------------------------------------------------------------------

  // Change student's group (move to another group)
  const handleChangeStudentGroup = (memberId: string, currentGroupId: string, targetGroupId: string) => {
    if (currentGroupId === targetGroupId) return;

    let memberToMove: ProcessedMember | null = null;

    // Remove from current group
    const withoutMember = groups.map((g) => {
      if (g.id === currentGroupId) {
        const found = g.members.find((m) => m.id === memberId);
        if (found) memberToMove = found;
        return { ...g, members: g.members.filter((m) => m.id !== memberId) };
      }
      return g;
    });

    if (!memberToMove) return;

    // Add to target group
    const withMember = withoutMember.map((g) => {
      if (g.id === targetGroupId) {
        return { ...g, members: [...g.members, memberToMove!] };
      }
      return g;
    });

    setGroups(withMember);
  };

  // Remove a student from a group
  const handleRemoveStudent = (groupId: string, memberId: string) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        return { ...g, members: g.members.filter((m) => m.id !== memberId) };
      }
      return g;
    });
    setGroups(updated);
  };

  // Select a database student to resolve an unmatched/ambiguous member or add new member
  const handleAssignDatabaseStudent = (student: Student) => {
    if (!pickerTarget) return;
    const { groupId, memberId } = pickerTarget;

    const updated = groups.map((g) => {
      if (g.id === groupId) {
        if (memberId) {
          // Reconcile existing member
          const updatedMembers = g.members.map((m) => {
            if (m.id === memberId) {
              return {
                ...m,
                student_id: student.studentId || student.id,
                full_name: student.fullName,
                email: student.email,
                status: "Matched" as MatchStatus,
                matchType: "id" as const,
                matchedStudent: {
                  id: student.id,
                  studentId: student.studentId,
                  fullName: student.fullName,
                  email: student.email,
                  department: student.departmentId,
                  departmentId: student.departmentId,
                  academicYear: student.academicYear,
                  semester: student.semester,
                  profilePhotoUrl: student.profilePhotoUrl,
                },
                ambiguousMatches: undefined,
                warning: undefined,
              };
            }
            return m;
          });
          return { ...g, members: updatedMembers };
        } else {
          // Add brand new member to group
          const newMember: ProcessedMember = {
            id: `mem-manual-${Date.now()}`,
            student_id: student.studentId || student.id,
            full_name: student.fullName,
            email: student.email,
            status: "Matched",
            matchType: "id",
            matchedStudent: {
              id: student.id,
              studentId: student.studentId,
              fullName: student.fullName,
              email: student.email,
              department: student.departmentId,
              departmentId: student.departmentId,
              academicYear: student.academicYear,
              semester: student.semester,
              profilePhotoUrl: student.profilePhotoUrl,
            },
          };
          return { ...g, members: [...g.members, newMember] };
        }
      }
      return g;
    });

    setGroups(updated);
    setPickerTarget(null);
    setStudentSearchQuery("");
  };

  // ---------------------------------------------------------------------------
  // CONFIRMATION WORKFLOW
  // ---------------------------------------------------------------------------
  const handleConfirmAssignments = async () => {
    setConfirmError("");

    if (stats.hasBlockingErrors) {
      setConfirmError(
        `Cannot confirm group allocations: Found ${stats.duplicateCount} duplicate student assignment(s), ${stats.ambiguousCount} ambiguous student(s), and ${stats.invalidCount} invalid student(s). Please resolve conflicts before proceeding.`
      );
      return;
    }

    if (stats.totalMembers === 0) {
      setConfirmError("No students are allocated in groups. Please assign students before confirming.");
      return;
    }

    setIsConfirming(true);

    try {
      // 1. Call server confirmation API
      const res = await fetch("/api/projects/confirm-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          groups: validatedGroups,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to confirm group assignments on the server.");
      }

      // 2. Synchronize created groups into local AdminDataContext store (atomic idempotent replacement)
      const confirmedGroups: ProjectGroup[] = data.createdGroups || [];
      if (setProjectGroups) {
        setProjectGroups(projectId, confirmedGroups);
      } else {
        confirmedGroups.forEach((grp) => {
          addGroup({
            projectId: grp.projectId,
            groupNumber: grp.groupNumber,
            groupName: grp.groupName,
            members: grp.members,
            workspaceId: grp.workspaceId,
            repoStatus: "disconnected",
            totalCommits: 0,
            status: "active",
            progress: 0,
            proposalStatus: "not_submitted",
          });
        });
      }

      setConfirmedSuccessGroups(confirmedGroups);

      if (onConfirmed) {
        onConfirmed(confirmedGroups);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while confirming groups.";
      setConfirmError(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  // Helper for status styling
  const renderStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case "Matched":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>Matched</span>
          </span>
        );
      case "Unmatched":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <UserX className="w-3 h-3 text-amber-600" />
            <span>Unmatched</span>
          </span>
        );
      case "Ambiguous":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <AlertTriangle className="w-3 h-3 text-purple-600" />
            <span>Ambiguous</span>
          </span>
        );
      case "Duplicate":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Duplicate</span>
          </span>
        );
      case "Invalid student":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <X className="w-3 h-3 text-rose-600" />
            <span>Invalid student</span>
          </span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER & TELEMETRY VALIDATION BAR                       */}
      {/* ============================================================== */}
      <div className="bg-[#0B1220] text-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Review & Confirm Group Assignments
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/20 font-mono">
                Lecturer Console
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Review AI-extracted groups, edit group names, change team memberships, resolve unmatched or ambiguous student records against the Supabase database, and ensure no student is duplicate before confirming group workspaces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start">
            <button
              type="button"
              onClick={handleAddNewGroup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>Add New Group</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700/60"
              >
                Back / Cancel
              </button>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isConfirming || stats.hasBlockingErrors || stats.totalMembers === 0}
              onClick={handleConfirmAssignments}
              icon={
                isConfirming ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              }
            >
              {isConfirming ? "Instantiating Workspaces..." : "Confirm Group Assignments"}
            </Button>
          </div>
        </div>

        {/* Real-time Status Counts Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-4 border-t border-slate-800 text-xs">
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Groups</span>
            <span className="text-base font-bold text-white mt-0.5 block">{stats.totalGroups}</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
            <span className="text-base font-bold text-teal-400 mt-0.5 block">{stats.totalMembers}</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Matched</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">{stats.matchedCount}</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Unmatched</span>
            <span className="text-base font-bold text-amber-400 mt-0.5 block">{stats.unmatchedCount}</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Ambiguous</span>
            <span className="text-base font-bold text-purple-400 mt-0.5 block">{stats.ambiguousCount}</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Duplicate</span>
            <span className={`text-base font-bold mt-0.5 block ${stats.duplicateCount > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
              {stats.duplicateCount}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BLOCKING VALIDATION ALERTS & WARNINGS                       */}
      {/* ============================================================== */}
      {stats.hasBlockingErrors && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-2 animate-in fade-in-50">
          <div className="flex items-center gap-2 font-bold text-rose-950 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Resolution Required Before Confirmation</span>
          </div>
          <p className="text-rose-800 leading-relaxed">
            The project cannot be confirmed while duplicate, invalid, or ambiguous student assignments exist. Please reassign, remove, or resolve conflicting student records in the sections below:
          </p>
          <ul className="list-disc list-inside space-y-1 text-rose-800 pl-1 font-medium">
            {stats.duplicateCount > 0 && (
              <li>{stats.duplicateCount} student(s) are assigned to multiple groups simultaneously.</li>
            )}
            {stats.ambiguousCount > 0 && (
              <li>{stats.ambiguousCount} student(s) have ambiguous database matches. Click &quot;Select Record&quot; on the student row to choose the exact record.</li>
            )}
            {stats.invalidCount > 0 && (
              <li>{stats.invalidCount} student entry has missing or blank name fields.</li>
            )}
          </ul>
        </div>
      )}

      {/* Confirmation Error Alert */}
      {confirmError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Confirmation Failed</span>
            <p>{confirmError}</p>
          </div>
        </div>
      )}

      {/* General Warnings Banner */}
      {allWarnings.length > 0 && !stats.hasBlockingErrors && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Assignment Notices & Cohort Warnings ({allWarnings.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1 text-[11px]">
            {allWarnings.slice(0, 5).map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
            {allWarnings.length > 5 && (
              <li className="text-amber-700 italic">...and {allWarnings.length - 5} additional notices</li>
            )}
          </ul>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. NUMBERED GROUP SECTIONS                                     */}
      {/* ============================================================== */}
      <div className="space-y-6">
        {validatedGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No Groups in Assignment</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No student groups are currently allocated. Click &ldquo;Add New Group&rdquo; above to manually form cohort teams.
            </p>
            <Button type="button" variant="primary" size="sm" onClick={handleAddNewGroup} icon={<Plus className="w-3.5 h-3.5" />}>
              Add First Group
            </Button>
          </div>
        ) : (
          validatedGroups.map((grp: ProcessedGroup, gIdx: number) => {
            const isEditing = editingGroupId === grp.id;

            return (
              <div
                key={grp.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Group Header */}
                <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Number Indicator & Reordering */}
                    <div className="flex items-center gap-1">
                      <span className="w-8 h-8 rounded-xl bg-[#0B1220] text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        #{grp.group_number}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={gIdx === 0}
                          onClick={() => handleMoveGroupUp(gIdx)}
                          className="p-1 hover:bg-slate-200 text-slate-500 disabled:opacity-30 rounded transition-colors"
                          title="Move group up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={gIdx === validatedGroups.length - 1}
                          onClick={() => handleMoveGroupDown(gIdx)}
                          className="p-1 hover:bg-slate-200 text-slate-500 disabled:opacity-30 rounded transition-colors"
                          title="Move group down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Group Number & Group Name (Inline Editable) */}
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-teal-500">
                          <span className="text-xs font-mono font-bold text-slate-400">#</span>
                          <input
                            type="number"
                            value={editGroupNumVal}
                            onChange={(e) => setEditGroupNumVal(parseInt(e.target.value, 10) || 1)}
                            className="w-12 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                            min={1}
                            title="Edit group number"
                          />
                        </div>
                        <input
                          type="text"
                          value={editGroupNameVal}
                          onChange={(e) => setEditGroupNameVal(e.target.value)}
                          className="px-3 py-1 bg-white border border-teal-500 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden ring-2 ring-teal-500/20"
                          placeholder="Group Name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveGroupName(grp.id);
                            if (e.key === "Escape") setEditingGroupId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveGroupName(grp.id)}
                          className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                          title="Save changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGroupId(null)}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                          {grp.group_name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGroupId(grp.id);
                            setEditGroupNameVal(grp.group_name);
                            setEditGroupNumVal(grp.group_number);
                          }}
                          className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-200/60 rounded-md transition-colors"
                          title="Edit group name and number"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Group Meta & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
                      {grp.members.length} Assigned Students
                    </span>

                    <button
                      type="button"
                      onClick={() => setPickerTarget({ groupId: grp.id })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Add Student</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(grp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                      title="Remove this group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Group Student Members List */}
                <div className="p-5 sm:p-6 space-y-3">
                  {grp.members.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <p className="text-xs text-slate-500">No students are currently allocated to {grp.group_name}.</p>
                      <button
                        type="button"
                        onClick={() => setPickerTarget({ groupId: grp.id })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Student to {grp.group_name}</span>
                      </button>
                    </div>
                  ) : (
                    grp.members.map((member: ProcessedMember, mIdx: number) => {
                      const isLead = mIdx === 0;

                      return (
                        <div
                          key={member.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                            member.status === "Duplicate"
                              ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-400/30"
                              : member.status === "Invalid student"
                              ? "bg-rose-50/40 border-rose-200"
                              : member.status === "Ambiguous"
                              ? "bg-purple-50/40 border-purple-200"
                              : member.status === "Unmatched"
                              ? "bg-amber-50/40 border-amber-200"
                              : "bg-slate-50/60 border-slate-200/80 hover:bg-white"
                          }`}
                        >
                          {/* Student Extracted Info & Match Record */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Member Role Pill */}
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                  isLead
                                    ? "bg-teal-600 text-white shadow-2xs"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {isLead ? "Team Lead" : `Member ${mIdx + 1}`}
                              </span>

                              {/* Extracted Full Name */}
                              <span className="font-extrabold text-sm text-slate-900 truncate">
                                {member.full_name}
                              </span>

                              {/* Status Badge */}
                              {renderStatusBadge(member.status)}
                            </div>

                            {/* Extracted Details vs Matched Record */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                              <span>
                                Extracted ID: <strong className="font-mono text-slate-800">{member.student_id || "None"}</strong>
                              </span>

                              {member.email && (
                                <span>
                                  Email: <strong className="font-mono text-slate-700">{member.email}</strong>
                                </span>
                              )}

                              {member.matchedStudent && (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>
                                    Matched Record: <strong>{member.matchedStudent.fullName}</strong> ({member.matchedStudent.studentId || member.matchedStudent.id})
                                    {member.matchedStudent.department && ` • ${member.matchedStudent.department}`}
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Warning message if any */}
                            {member.warning && (
                              <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{member.warning}</span>
                              </p>
                            )}
                          </div>

                          {/* Student Review & Reconciliation Action Controls */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                            {/* Reconcile / Select Student Record */}
                            {(member.status === "Unmatched" ||
                              member.status === "Ambiguous" ||
                              member.status === "Invalid student") && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPickerTarget({
                                    groupId: grp.id,
                                    memberId: member.id,
                                  })
                                }
                                className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                              >
                                <Search className="w-3 h-3 text-teal-600" />
                                <span>Select Record</span>
                              </button>
                            )}

                            {/* Change Student Group Dropdown */}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Group:</span>
                              <select
                                value={grp.id}
                                onChange={(e) =>
                                  handleChangeStudentGroup(member.id, grp.id, e.target.value)
                                }
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs"
                              >
                                {validatedGroups.map((target) => (
                                  <option key={target.id} value={target.id}>
                                    Move to {target.group_name} (#{target.group_number})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Remove Student Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(grp.id, member.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Remove this student assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. CONFIRMATION BAR & FOOTER NOTICE                           */}
      {/* ============================================================== */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              Institutional Confirmation Gate
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Workspaces, repository bindings, and team members will be permanently created only upon clicking &ldquo;Confirm Group Assignments&rdquo;.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isConfirming || stats.hasBlockingErrors || stats.totalMembers === 0}
            onClick={handleConfirmAssignments}
            icon={
              isConfirming ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )
            }
          >
            {isConfirming ? "Creating Workspaces..." : "Confirm Group Assignments"}
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. DATABASE STUDENT SELECTION MODAL (For Unmatched/Ambiguous)  */}
      {/* ============================================================== */}
      {pickerTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-600" />
                  Select Registered University Student
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search university student records to resolve unmatched or ambiguous assignments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input & Department Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student ID, full name, or email..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Candidates List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No registered student records match &ldquo;{studentSearchQuery}&rdquo;.
                </div>
              ) : (
                filteredStudents.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {s.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-sm">{s.fullName}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>ID: <strong className="text-slate-800">{s.studentId || s.id}</strong></span>
                          <span>•</span>
                          <span className="truncate">{s.email}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAssignDatabaseStudent(s)}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Select & Match
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerTarget(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. SUCCESS CONFIRMATION MODAL                                  */}
      {/* ============================================================== */}
      {confirmedSuccessGroups && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-slate-900">
                Group Assignments Confirmed!
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Successfully created <strong>{confirmedSuccessGroups.length} project groups</strong>, memberships, and isolated shared workspaces for this project.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Created Groups:</span>
                <span className="text-teal-700">{confirmedSuccessGroups.length} Teams</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>Total Enrolled Students:</span>
                <span className="text-teal-700">
                  {confirmedSuccessGroups.reduce((acc, g) => acc + g.members.length, 0)} Members
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>Workspace Access Isolation:</span>
                <span className="text-emerald-600">Active</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  setConfirmedSuccessGroups(null);
                  if (onCancel) onCancel();
                }}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Project Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
