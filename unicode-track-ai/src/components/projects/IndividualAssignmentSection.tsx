"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Info,
  Building2,
  GraduationCap,
  Filter,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/context/AdminDataContext";
import { Student } from "@/types/admin";

interface IndividualAssignmentSectionProps {
  academicYear: number;
  semester: number;
  departmentId: string;
  courseCode: string;
  selectedStudentIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function IndividualAssignmentSection({
  academicYear,
  semester,
  departmentId,
  courseCode,
  selectedStudentIds,
  onChange,
  className = "",
}: IndividualAssignmentSectionProps) {
  const { students, departments, courses } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [strictCohortOnly, setStrictCohortOnly] = useState(false);

  // Department and Course Metadata
  const currentDept = departments.find((d) => d.id === departmentId);
  const currentCourse = courses.find((c) => c.code === courseCode);

  // Filter eligible students based on cohort
  const { eligibleStudents, allDepartmentStudents } = useMemo(() => {
    // Exact cohort match
    const strictlyEligible = students.filter((s) => {
      const matchDept = !departmentId || s.departmentId === departmentId;
      const matchYear = !academicYear || s.academicYear === academicYear;
      const matchSem = !semester || s.semester === semester;
      return matchDept && matchYear && matchSem;
    });

    // All students in department (or all students if no dept specified)
    const deptStudents = students.filter((s) => {
      return !departmentId || s.departmentId === departmentId;
    });

    return {
      eligibleStudents: strictlyEligible,
      allDepartmentStudents: deptStudents,
    };
  }, [students, departmentId, academicYear, semester]);

  // Determine active pool based on strict toggle
  const activePool = strictCohortOnly ? eligibleStudents : (eligibleStudents.length > 0 ? eligibleStudents : allDepartmentStudents);

  // Filter active pool by search query
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activePool;
    return activePool.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q)
    );
  }, [activePool, searchQuery]);

  // Handlers
  const handleToggleStudent = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      onChange(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      onChange([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newIds = new Set(selectedStudentIds);
    filteredStudents.forEach((s) => newIds.add(s.id));
    onChange(Array.from(newIds));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const handleRemoveStudent = (studentId: string) => {
    onChange(selectedStudentIds.filter((id) => id !== studentId));
  };

  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-2xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shadow-2xs">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-base text-foreground">
              Individual Student Assignments
            </h3>
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Personal Workspaces
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Assign students to this individual project. Each student receives an isolated personal workspace.
          </p>
        </div>

        {/* Selected Count Indicator */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>
              {selectedStudentIds.length} Assigned
            </span>
            <span className="text-muted-foreground font-normal">
              / {activePool.length} Eligible
            </span>
          </div>
        </div>
      </div>

      {/* Cohort Criteria Card */}
      <div className="p-4 rounded-[16px] bg-muted border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            Target Cohort:
          </span>
          <span className="font-bold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
            Year {academicYear || 4}, Semester {semester || 1}
          </span>
          <span className="font-bold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border truncate max-w-xs">
            {currentDept?.name || "Computing Department"}
          </span>
          {currentCourse && (
            <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              {currentCourse.code}
            </span>
          )}
        </div>

        {/* Strict Cohort Toggle if eligible is low */}
        {eligibleStudents.length === 0 && (
          <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Showing all {allDepartmentStudents.length} students in department (no exact Year {academicYear}/Sem {semester} records found)
          </span>
        )}
      </div>

      {/* Action Controls & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search eligible students by name, student ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-accent focus:border-accent/20 focus:border-accent transition-all"
          />
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAllFiltered}
            icon={<CheckSquare className="w-3.5 h-3.5 text-teal-600" />}
          >
            Assign All Eligible ({filteredStudents.length})
          </Button>

          {selectedStudentIds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              icon={<Square className="w-3.5 h-3.5 text-muted-foreground" />}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-border rounded-[16px] bg-muted space-y-2">
          <UserX className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-xs font-semibold text-foreground">No matching students found</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query or verify that students are enrolled under this department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {filteredStudents.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            const initials = student.fullName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("");

            return (
              <div
                key={student.id}
                onClick={() => handleToggleStudent(student.id)}
                className={`p-3.5 rounded-[16px] border transition-all cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? "bg-teal-50/40 border-teal-500 shadow-xs ring-1 ring-teal-500/20"
                    : "bg-muted/40 border-border hover:border-border hover:bg-muted"
                }`}
              >
                {/* Checkbox indicator */}
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "bg-card border-border text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs text-foreground truncate">
                      {student.fullName}
                    </h4>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded shrink-0">
                        Assigned
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {student.studentId || student.id}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {student.email}
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="bg-card px-1.5 py-0.5 rounded border border-border">
                      Y{student.academicYear || 4} S{student.semester || 1}
                    </span>
                  </div>
                </div>

                {/* Remove button if selected */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStudent(student.id);
                    }}
                    className="text-muted-foreground hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove assignment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Security Isolation Notice */}
      <div className="p-3.5 rounded-[16px] bg-muted border border-border text-xs text-muted-foreground flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>Personal Workspace Isolation:</strong> Each confirmed student is granted their own private workspace (<code>ws-ind-[projectId]-[studentId]</code>). Students cannot see or access other students&apos; individual project workspaces. As the supervising lecturer, you can evaluate each student separately.
        </p>
      </div>
    </div>
  );
}
