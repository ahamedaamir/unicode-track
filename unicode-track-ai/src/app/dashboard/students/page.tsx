"use client";

import React, { useState } from "react";
import { 
  GraduationCap, 
  Search, 
  Plus, 
  X, 
  Eye, 
  FolderGit2
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Student } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function StudentsPage() {
  const { students, courses } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
  const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1220] tracking-tight">
              Student Directory
            </h2>
            <Badge variant="teal" size="sm">
              {students.length} Enrolled
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor student registrations, course commitments, and academic team memberships.
          </p>
        </div>

        <Button
          onClick={() => setPlaceholderModalOpen(true)}
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Student
        </Button>
      </div>

      {/* Search & Counter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, or registration ID..."
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
          <span>Enrolled Students:</span>
          <strong className="text-slate-900 font-semibold">{filteredStudents.length} of {students.length}</strong>
        </div>
      </div>

      {/* Students Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Student Name</th>
                <th className="py-3.5 px-4">Student Email</th>
                <th className="py-3.5 px-4">Assigned Courses</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No students found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery ? `No match for "${searchQuery}".` : "No student records available."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => (
                  <tr
                    key={std.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Student Name & Avatar */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {std.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {std.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {std.regNo}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Student Email */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {std.email}
                    </td>

                    {/* Assigned Courses */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {std.assignedCourses.map((code) => (
                          <span
                            key={code}
                            className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      {std.status === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => setDetailsStudent(std)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {detailsStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {detailsStudent.avatar}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1220]">
                    {detailsStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {detailsStudent.regNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Email Address</span>
                <span className="font-mono font-bold text-slate-900">{detailsStudent.email}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Enrollment Status</span>
                <span className="font-semibold text-emerald-700">{detailsStudent.status}</span>
              </div>

              <div>
                <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px] block mb-2">
                  Enrolled Curriculum Courses
                </span>
                <div className="space-y-1.5">
                  {detailsStudent.assignedCourses.map((code) => {
                    const fullCourse = courses.find((c) => c.code === code);
                    return (
                      <div
                        key={code}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {code}
                        </span>
                        <span className="font-medium text-slate-700 truncate">
                          {fullCourse ? fullCourse.name : "Academic Course"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 text-[11px] flex items-start gap-2">
                <FolderGit2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  GitHub repositories, project submissions, and peer evaluations for this student are active in the Capstone workspace.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDetailsStudent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Placeholder Modal */}
      {placeholderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0B1220]">
                Student Onboarding Workflow
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                As specified for this development stage, the complete student self-registration flow will be integrated in the upcoming release.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
              <p className="font-semibold text-slate-800">Upcoming capabilities:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>Bulk CSV student cohort upload</li>
                <li>University Single Sign-On (SSO / SAML)</li>
                <li>Automatic course enrollment synchronization</li>
              </ul>
            </div>

            <Button
              onClick={() => setPlaceholderModalOpen(false)}
              variant="primary"
              size="md"
              className="w-full justify-center"
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
