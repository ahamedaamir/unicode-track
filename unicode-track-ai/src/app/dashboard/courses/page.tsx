"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Calendar, 
  AlertCircle,
  Users
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function CoursesPage() {
  const { courses, lecturers, addCourse, editCourse, deleteCourse } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string }>({});

  const filteredCourses = courses.filter(
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

  const handleOpenEdit = (crs: { id: string; code: string; name: string }) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1220] tracking-tight">
              Course Management
            </h2>
            <Badge variant="teal" size="sm">
              {courses.length} Total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add and maintain official curriculum course codes for lecturer assignments.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Course
        </Button>
      </div>

      {/* Search & Counter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code (e.g. ICT2142) or course name..."
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

        <div className="text-xs text-slate-500 flex items-center gap-2 self-end sm:self-auto">
          <span>Active Courses:</span>
          <strong className="text-slate-900 font-semibold">{filteredCourses.length} of {courses.length}</strong>
        </div>
      </div>

      {/* Courses Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Course Code</th>
                <th className="py-3.5 px-4">Course Name</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Assigned Staff</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Created Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No courses found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? `No match for "${searchQuery}".`
                        : "Click 'Add Course' to create the first curriculum course."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((crs) => {
                  const assignedStaff = getAssignedLecturersForCourse(crs.code);
                  return (
                    <tr
                      key={crs.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                          {crs.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {crs.name}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-600">
                        {assignedStaff.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedStaff.map((staff) => (
                              <span
                                key={staff.id}
                                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700"
                              >
                                <Users className="w-2.5 h-2.5 text-slate-500" />
                                {staff.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{crs.createdAt}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(crs)}
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit course"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(crs.id, crs.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Course Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0B1220]">
                  {editingCourseId ? "Edit Course" : "Add New Course"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Course Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={courseCode}
                  onChange={(e) => {
                    setCourseCode(e.target.value.toUpperCase());
                    if (formErrors.code) setFormErrors((prev) => ({ ...prev, code: undefined }));
                  }}
                  placeholder="e.g. ICT2142 or CS492"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                    formErrors.code
                      ? "border-rose-300 focus:ring-rose-200"
                      : "border-slate-300 focus:ring-indigo-200 focus:border-indigo-600"
                  }`}
                />
                {formErrors.code && (
                  <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.code}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Unique course code identifier (duplicates are prohibited).
                </p>
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Course Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => {
                    setCourseName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. E-Business Systems or Senior Capstone"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-rose-300 focus:ring-rose-200"
                      : "border-slate-300 focus:ring-indigo-200 focus:border-indigo-600"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

