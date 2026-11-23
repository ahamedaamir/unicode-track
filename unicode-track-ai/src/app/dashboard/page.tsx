"use client";

import React from "react";
import Link from "next/link";
import { 
  Building2, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Plus, 
  ArrowRight, 
  Clock, 
  KeyRound, 
  Activity,
  ChevronRight
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";

export default function DashboardOverviewPage() {
  const { departments, courses, lecturers, students, activities } = useAdminData();

  const recentDepartments = departments.slice(0, 4);
  const recentCourses = courses.slice(0, 4);
  const recentLecturers = lecturers.slice(0, 4);
  const recentActivities = activities.slice(0, 5);

  const pendingPasswordCount = lecturers.filter((l) => !l.hasChangedDefaultPassword).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              Institutional Admin Portal
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Fall 2026 Term</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1220] tracking-tight mt-1">
            University Administrator Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage academic departments, syllabus courses, lecturer credentials, and student allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            href="/dashboard/departments"
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Dept
          </Button>
          <Button
            href="/dashboard/courses"
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Course
          </Button>
          <Button
            href="/dashboard/lecturers"
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Register Lecturer
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Departments */}
        <Link
          href="/dashboard/departments"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Departments
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
              {departments.length}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Active units</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
            <span>Manage departments</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Courses */}
        <Link
          href="/dashboard/courses"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Courses
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
              {courses.length}
            </span>
            <span className="text-xs text-slate-500">In curriculum</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-semibold group-hover:text-indigo-800">
            <span>View course catalog</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Lecturers */}
        <Link
          href="/dashboard/lecturers"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lecturers
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
              {lecturers.length}
            </span>
            {pendingPasswordCount > 0 ? (
              <span className="text-xs text-amber-600 font-medium">
                {pendingPasswordCount} pending 1st login
              </span>
            ) : (
              <span className="text-xs text-emerald-600 font-medium">100% verified</span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
            <span>Staff management</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Students */}
        <Link
          href="/dashboard/students"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-sky-100">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B1220] tracking-tight">
              {students.length}
            </span>
            <span className="text-xs text-slate-500">Registered cohorts</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-700 font-semibold group-hover:text-sky-800">
            <span>Student roster</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 2-Column Grid: Left (Departments & Courses), Right (Lecturers & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Recently Added Departments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-[#0B1220] uppercase tracking-wider">
                  Recently Added Departments
                </h3>
              </div>
              <Link
                href="/dashboard/departments"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-0.5"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentDepartments.map((dept) => (
                <div key={dept.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0">
                      {dept.name.charAt(0)}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {dept.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {dept.createdAt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/departments"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" /> Add New Department
            </Link>
          </div>
        </div>

        {/* Box 2: Recently Added Courses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#0B1220] uppercase tracking-wider">
                  Recently Added Courses
                </h3>
              </div>
              <Link
                href="/dashboard/courses"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-0.5"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentCourses.map((crs) => (
                <div key={crs.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      {crs.code}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {crs.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {crs.createdAt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/courses"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" /> Create Course Code
            </Link>
          </div>
        </div>

        {/* Box 3: Recently Created Lecturer Accounts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-[#0B1220] uppercase tracking-wider">
                  Recent Lecturer Accounts
                </h3>
              </div>
              <Link
                href="/dashboard/lecturers"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-0.5"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentLecturers.map((lec) => (
                <div key={lec.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {lec.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          lec.position === "Senior"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {lec.position}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                      {lec.email}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {lec.hasChangedDefaultPassword ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                        <KeyRound className="w-2.5 h-2.5" /> 1st Login Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Demo default password: <code className="font-bold text-slate-800">UniCode@2004</code></span>
            <Link
              href="/dashboard/lecturers"
              className="text-teal-700 hover:underline font-semibold"
            >
              Add Staff &rarr;
            </Link>
          </div>
        </div>

        {/* Box 4: Recent Administrative Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-[#0B1220] uppercase tracking-wider">
                  Administrative Activity Log
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
            </div>

            <div className="space-y-3 mt-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="p-1 rounded bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                    {act.type === "department" ? (
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    ) : act.type === "course" ? (
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    ) : act.type === "lecturer" ? (
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 leading-tight">
                      <span className="font-semibold text-slate-900">{act.user}</span>{" "}
                      <span className="text-slate-500">{act.action}</span>{" "}
                      <span className="font-medium text-slate-800">{act.target}</span>
                    </p>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Audit Trail Active</span>
            <span className="flex items-center gap-1 text-teal-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> Live Mock Sync
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
