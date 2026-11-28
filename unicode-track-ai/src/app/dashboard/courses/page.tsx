"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Calendar, 
  AlertCircle,
  Users,
  GraduationCap,
  FolderGit2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Course } from "@/types/admin";

export default function CoursesPage() {
  const { 
    departments,
    courses, 
    lecturers, 
    students, 
    projects, 
    groups, 
    activeRole, 
    activeLecturerEmail,
    activeStudentEmail,
    addCourse, 
    editCourse, 
    deleteCourse 
  } = useAdminData();

  const isLecturer = activeRole === "lecturer";
  const isStudent = activeRole === "student";
  const currentLecturer = lecturers.find((l) => l.email === activeLecturerEmail) || null;
  const currentStudent = students.find((s) => s.email.toLowerCase() === activeStudentEmail.toLowerCase()) || students[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [academicYear, setAcademicYear] = useState<1 | 2 | 3 | 4>(1);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string; department?: string }>({});

  // Detail Modal State
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);

  // Role-based course filtering:
  // - Students only see courses matching their enrolled Academic Year and Semester
  // - Lecturers only see courses assigned to them
  // - University Administrators see all curriculum courses
  const baseCourses = isStudent
    ? courses.filter((c) =>
        Number(c.academicYear || 1) === Number(currentStudent?.academicYear || 1) &&
        Number(c.semester || 1) === Number(currentStudent?.semester || 1)
      )
    : isLecturer
    ? courses.filter((c) => currentLecturer ? currentLecturer.assignedCourses.includes(c.code) : true)
    : courses;

  const filteredCourses = baseCourses.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCourseId(null);
    setCourseCode("");
    setCourseName("");
    setDepartmentId(departments.length > 0 ? departments[0].id : "");
    setAcademicYear(1);
    setSemester(1);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (crs: Course) => {
    setEditingCourseId(crs.id);
    setCourseCode(crs.code);
    setCourseName(crs.name);
    setDepartmentId(crs.departmentId || (departments.length > 0 ? departments[0].id : ""));
    setAcademicYear((crs.academicYear || 1) as 1 | 2 | 3 | 4);
    setSemester((crs.semester || 1) as 1 | 2);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {};
    if (!courseCode.trim()) errors.code = "Course Code is required";
    if (!courseName.trim()) errors.name = "Course Name is required";
    if (departments.length > 0 && !departmentId) errors.department = "Academic Department is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingCourseId) {
      const res = editCourse(editingCourseId, courseCode, courseName, departmentId, academicYear, semester);
      if (!res.success) {
        setFormErrors({ code: res.error });
        return;
      }
    } else {
      const res = addCourse(courseCode, courseName, departmentId, academicYear, semester);
      if (!res.success) {
        setFormErrors({ code: res.error });
        return;
      }
    }

    setModalOpen(false);
    setCourseCode("");
    setCourseName("");
    setDepartmentId("");
    setAcademicYear(1);
    setSemester(1);
    setEditingCourseId(null);
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete course "${code}"?`)) {
      deleteCourse(id);
    }
  };

  // Find lecturers assigned to each course
  const getAssignedLecturersForCourse = (code: string) => {
    return lecturers.filter((l) => l.assignedCourses.includes(code));
  };

  // Helper metrics for course
  const getCourseMetrics = (code: string) => {
    const courseProjects = projects.filter((p) => p.courseCode === code);
    const projectIds = new Set(courseProjects.map((p) => p.id));
    const courseGroups = groups.filter((g) => projectIds.has(g.projectId));
    const courseObj = courses.find((c) => c.code === code);
    const deptObj = (departments as any[]).find((d: any) => d.id === (courseObj as any)?.departmentId);

    const enrolledStudents = students.filter((s) =>
      Number(s.academicYear || 1) === Number(courseObj?.academicYear || 1) &&
      Number(s.semester || 1) === Number(courseObj?.semester || 1)
    );

    return {
      projectsCount: courseProjects.length,
      groupsCount: courseGroups.length,
      studentsCount: enrolledStudents.length,
      department: deptObj?.name || courseObj?.departmentName || "Academic Department",
      academicYear: courseObj?.academicYear || 1,
      semester: courseObj?.semester || 1,
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {isStudent ? "My Courses" : isLecturer ? "My Assigned Courses" : "Curriculum Course Catalog"}
            </h2>
            <Badge variant={isStudent ? "teal" : isLecturer ? "teal" : "default"} size="sm">
              {filteredCourses.length} {isStudent ? "Enrolled" : isLecturer ? "Assigned" : "Total"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isStudent
              ? `Curriculum courses for Year ${currentStudent?.academicYear || 1}, Semester ${currentStudent?.semester || 1}. Review syllabus units and associated projects.`
              : isLecturer
              ? `Authorized faculty curriculum view for ${currentLecturer?.name || "Lecturer"}. Review syllabus units, associated projects, and enrolled students.`
              : "Add and maintain official curriculum course codes, academic year, and semester for lecturer assignments."}
          </p>
        </div>

        {/* Action Button: Only Admin can add course */}
        {!isLecturer && !isStudent ? (
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Course
          </Button>
        ) : isLecturer ? (
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project for Course</span>
            </Link>
          </div>
        ) : null}
      </div>

      {/* Advisory Banner for Students */}
      {isStudent && (
        <div className="p-4 rounded-[16px] bg-teal-50/60 dark:bg-accent/10 border border-teal-200/80 dark:border-accent/30 text-xs text-teal-950 dark:text-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-teal-900 dark:text-foreground">Enrolled Curriculum Cohort</p>
              <p className="text-teal-700 dark:text-muted-foreground text-[11px] mt-0.5">
                Displaying courses for <strong>Year {currentStudent?.academicYear || 1}, Semester {currentStudent?.semester || 1}</strong>.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-teal-800 dark:text-accent bg-card px-2.5 py-1 rounded-md border border-teal-200 dark:border-accent/30 shrink-0 font-semibold">
            Cohort: Year {currentStudent?.academicYear || 1} · Sem {currentStudent?.semester || 1}
          </span>
        </div>
      )}

      {/* Advisory Banner for Lecturers */}
      {isLecturer && (
        <div className="p-4 rounded-[16px] bg-teal-50/60 border border-teal-200/80 text-xs text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-teal-900">Faculty Course Permission</p>
              <p className="text-teal-700 text-[11px] mt-0.5">
                You are assigned to <strong>{baseCourses.length} courses</strong> by the university administration. Course codes and curricula are managed by department administrators.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-teal-800 bg-card px-2.5 py-1 rounded-md border border-teal-200 shrink-0 font-semibold">
            Faculty Access: Read & Project Creation
          </span>
        </div>
      )}

      {/* Search & Counter Bar */}
      <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code (e.g. CS304) or course name..."
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

        <div className="text-xs text-muted-foreground flex items-center gap-2 self-end sm:self-auto font-mono">
          <span>Active Courses:</span>
          <strong className="text-foreground font-semibold">{filteredCourses.length} of {baseCourses.length}</strong>
        </div>
      </div>

      {/* Course Cards Grid for Lecturers (Section 3 Details) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full bg-card p-12 text-center rounded-[16px] border border-dashed border-border">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="font-semibold text-muted-foreground text-sm">No courses found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {searchQuery ? `No match for "${searchQuery}".` : "No curriculum courses assigned."}
            </p>
          </div>
        ) : (
          filteredCourses.map((crs) => {
            const metrics = getCourseMetrics(crs.code);
            const assignedStaff = getAssignedLecturersForCourse(crs.code);

            return (
              <div
                key={crs.id}
                className="bg-card rounded-[16px] border border-border p-5 shadow-2xs hover:shadow-md hover:border-border transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                      {crs.code}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Year {metrics.academicYear}, Sem {metrics.semester}
                    </span>
                  </div>

                  {/* Course Title & Department */}
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors line-clamp-1">
                      {crs.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {metrics.department}
                    </p>
                  </div>

                  {/* Course Metrics Strip */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl border border-border text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Enrolled</span>
                      <strong className="text-foreground font-bold font-mono">{metrics.studentsCount} Students</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Projects</span>
                      <strong className="text-teal-700 font-bold font-mono">{metrics.projectsCount} Created</strong>
                    </div>
                  </div>

                  {/* Assigned Staff */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="font-semibold text-foreground">
                      {assignedStaff.map((s) => s.name).join(", ") || "Faculty"}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCourseDetail(crs)}
                    className="flex-1 py-2 px-3 bg-muted hover:bg-muted text-foreground rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Course Details</span>
                  </button>

                  <Link
                    href={`/dashboard/projects?course=${crs.code}`}
                    className="py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    title="View projects under this course"
                  >
                    <span>Projects</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  {!isLecturer && !isStudent && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(crs)}
                        className="p-1.5 text-muted-foreground hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                        title="Edit course"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(crs.id, crs.code)}
                        className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Course Details Modal (Section 3: view course details, enrolled students, projects) */}
      {selectedCourseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-2xl rounded-[16px] border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200">
                    {selectedCourseDetail.code}
                  </span>
                  <h3 className="font-bold text-base text-foreground">
                    {selectedCourseDetail.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCourseDetail.departmentName || "Department of ICT"} • Year {selectedCourseDetail.academicYear || 1}, Semester {selectedCourseDetail.semester || 1}
                </p>
              </div>

              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="p-1.5 text-muted-foreground hover:text-muted-foreground rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Course Statistics Strip */}
            {(() => {
              const enrolledForDetail = students.filter(
                (s) =>
                  Number(s.academicYear || 1) === Number(selectedCourseDetail.academicYear || 1) &&
                  Number(s.semester || 1) === Number(selectedCourseDetail.semester || 1)
              );
              return (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-muted rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Enrolled Students</span>
                    <strong className="text-lg font-bold font-mono text-foreground">{enrolledForDetail.length}</strong>
                  </div>
                  <div className="p-3 bg-muted rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Active Projects</span>
                    <strong className="text-lg font-bold font-mono text-teal-700">
                      {projects.filter((p) => p.courseCode === selectedCourseDetail.code).length}
                    </strong>
                  </div>
                  <div className="p-3 bg-muted rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Cohort</span>
                    <strong className="text-lg font-bold font-mono text-indigo-700">
                      Y{selectedCourseDetail.academicYear || 1} · S{selectedCourseDetail.semester || 1}
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Associated Projects Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Projects Under This Course
                </h4>
                <Link
                  href={`/dashboard/projects/create?course=${selectedCourseDetail.code}`}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create New Project
                </Link>
              </div>

              <div className="space-y-2">
                {projects.filter((p) => p.courseCode === selectedCourseDetail.code).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No projects created yet for this course.</p>
                ) : (
                  projects
                    .filter((p) => p.courseCode === selectedCourseDetail.code)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-border bg-muted flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">{p.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Status: <strong className="text-emerald-700">{p.status}</strong> • Deadline: {p.deadline || "Dec 15"}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/projects/${p.id}`}
                          className="px-2.5 py-1 bg-card border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          Open Project
                        </Link>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Enrolled Students Roster */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Enrolled Student Cohort ({students.length})
              </h4>

              {students.length === 0 ? (
                <p className="text-xs text-muted-foreground">No students enrolled yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {students.slice(0, 6).map((std) => (
                    <div key={std.id} className="p-2.5 rounded-xl border border-border bg-card flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent/20 text-accent font-bold flex items-center justify-center text-[10px] shrink-0">
                        {std.fullName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate text-[11px]">{std.fullName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{std.studentId || std.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourseDetail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add / Edit Course Dialog Modal */}
      {!isLecturer && !isStudent && modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-md rounded-[16px] border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">
                {editingCourseId ? "Edit Course" : "Add New Course"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-muted-foreground rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-foreground">
                  Department <span className="text-rose-500">*</span>
                </label>
                {departments.length === 0 ? (
                  <div className="p-2.5 rounded-xl border border-warning/40 bg-warning/10 text-warning text-xs space-y-1">
                    <p className="font-semibold">No departments found.</p>
                    <p className="text-[11px] text-muted-foreground">
                      Please create an academic department first in Department Management.
                    </p>
                  </div>
                ) : (
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-card text-foreground"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.department && <p className="text-[11px] text-rose-500">{formErrors.department}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-card text-foreground"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-foreground">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-card text-foreground"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS304 or ICT2142"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent font-mono"
                />
                {formErrors.code && <p className="text-[11px] text-rose-500">{formErrors.code}</p>}
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-foreground">
                  Course Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering Capstone"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
                {formErrors.name && <p className="text-[11px] text-rose-500">{formErrors.name}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingCourseId ? "Save Changes" : "Create Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
