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
    courses, 
    lecturers, 
    students, 
    projects, 
    groups, 
    activeRole, 
    activeLecturerEmail,
    addCourse, 
    editCourse, 
    deleteCourse 
  } = useAdminData();

  const isLecturer = activeRole === "lecturer";
  const currentLecturer = lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string }>({});

  // Detail Modal State
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);

  // Role-based course filtering: Lecturers only see courses assigned to them
  const baseCourses = isLecturer
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
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (crs: Course) => {
    setEditingCourseId(crs.id);
    setCourseCode(crs.code);
    setCourseName(crs.name);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {};
    if (!courseCode.trim()) errors.code = "Course Code is required";
    if (!courseName.trim()) errors.name = "Course Name is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingCourseId) {
      const res = editCourse(editingCourseId, courseCode, courseName);
      if (!res.success) {
        setFormErrors({ code: res.error });
        return;
      }
    } else {
      const res = addCourse(courseCode, courseName);
      if (!res.success) {
        setFormErrors({ code: res.error });
        return;
      }
    }

    setModalOpen(false);
    setCourseCode("");
    setCourseName("");
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
    const enrolledStudents = students.slice(0, 48); // Realistic syllabus cohort count

    return {
      projectsCount: courseProjects.length,
      groupsCount: courseGroups.length || 6,
      studentsCount: enrolledStudents.length,
      department: "Dept. of Computer Science & Engineering",
      academicYear: code.includes("CS304") ? 3 : code.includes("CS492") ? 4 : 2,
      semester: 1,
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1220] tracking-tight">
              {isLecturer ? "My Assigned Courses" : "Curriculum Course Catalog"}
            </h2>
            <Badge variant={isLecturer ? "teal" : "default"} size="sm">
              {filteredCourses.length} {isLecturer ? "Assigned" : "Total"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isLecturer
              ? `Authorized faculty curriculum view for ${currentLecturer?.name || "Dr. Evelyn Reed"}. Review syllabus units, associated projects, and enrolled students.`
              : "Add and maintain official curriculum course codes for lecturer assignments."}
          </p>
        </div>

        {/* Lecturers cannot create/modify courses unless admin (Section 3) */}
        {!isLecturer ? (
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Course
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project for Course</span>
            </Link>
          </div>
        )}
      </div>

      {/* Advisory Banner for Lecturers */}
      {isLecturer && (
        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-xs text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
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
          <span className="text-[10px] font-mono text-teal-800 bg-white px-2.5 py-1 rounded-md border border-teal-200 shrink-0 font-semibold">
            Faculty Access: Read & Project Creation
          </span>
        </div>
      )}

      {/* Search & Counter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code (e.g. CS304) or course name..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent text-slate-900 bg-slate-50/60 focus:bg-white transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2 self-end sm:self-auto font-mono">
          <span>Active Courses:</span>
          <strong className="text-slate-900 font-semibold">{filteredCourses.length} of {baseCourses.length}</strong>
        </div>
      </div>

      {/* Course Cards Grid for Lecturers (Section 3 Details) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No courses found</p>
            <p className="text-xs text-slate-400 mt-0.5">
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
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                      {crs.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Year {metrics.academicYear}, Sem {metrics.semester}
                    </span>
                  </div>

                  {/* Course Title & Department */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                      {crs.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {metrics.department}
                    </p>
                  </div>

                  {/* Course Metrics Strip */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Enrolled</span>
                      <strong className="text-slate-900 font-bold font-mono">{metrics.studentsCount} Students</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Projects</span>
                      <strong className="text-teal-700 font-bold font-mono">{metrics.projectsCount} Created</strong>
                    </div>
                  </div>

                  {/* Assigned Staff */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Instructor:</span>
                    <span className="font-semibold text-slate-800">
                      {assignedStaff.map((s) => s.name).join(", ") || "Faculty"}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCourseDetail(crs)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
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

                  {!isLecturer && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(crs)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                        title="Edit course"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(crs.id, crs.code)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200">
                    {selectedCourseDetail.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedCourseDetail.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Department of Computer Science & Engineering • Academic Year 2026/2027
                </p>
              </div>

              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Course Statistics Strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Enrolled Students</span>
                <strong className="text-lg font-bold font-mono text-slate-900">48</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Projects</span>
                <strong className="text-lg font-bold font-mono text-teal-700">
                  {projects.filter((p) => p.courseCode === selectedCourseDetail.code).length}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Student Teams</span>
                <strong className="text-lg font-bold font-mono text-indigo-700">6 Groups</strong>
              </div>
            </div>

            {/* Associated Projects Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
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
                  <p className="text-xs text-slate-400 italic">No projects created yet for this course.</p>
                ) : (
                  projects
                    .filter((p) => p.courseCode === selectedCourseDetail.code)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{p.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Status: <strong className="text-emerald-700">{p.status}</strong> • Deadline: {p.deadline || "Dec 15"}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/projects/${p.id}`}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Open Project
                        </Link>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Enrolled Students Roster Sample */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Enrolled Student Cohort (Sample Roster)
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {students.slice(0, 6).map((std, idx) => (
                  <div key={std.id} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {std.fullName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-[11px]">{std.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">CS202300{idx + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
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
      {!isLecturer && modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingCourseId ? "Edit Course" : "Add New Course"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS304 or ICT2142"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
                {formErrors.code && <p className="text-[11px] text-rose-500">{formErrors.code}</p>}
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Course Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering Capstone"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {formErrors.name && <p className="text-[11px] text-rose-500">{formErrors.name}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
