"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Building2,
  BookOpen,
  KeyRound,
  ShieldCheck,
  Camera,
  Check,
  LogOut,
  AlertCircle,
  Lock,
  Calendar,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function ProfilePage() {
  const router = useRouter();
  const {
    lecturers,
    students,
    courses,
    activeRole,
    activeLecturerEmail,
    activeStudentEmail,
    changeLecturerPassword,
    changeStudentPassword
  } = useAdminData();

  const isLecturer = activeRole === "lecturer";
  const isStudent = activeRole === "student";

  const currentLecturer = lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];
  const currentStudent = students.find((s) => s.email.toLowerCase() === activeStudentEmail.toLowerCase()) || students[0];

  // Editable Profile Form State
  const [fullName, setFullName] = useState(
    isLecturer ? (currentLecturer?.name || "Dr. Evelyn Reed") : (currentStudent?.fullName || "Alex Chen")
  );
  const [officeLocation, setOfficeLocation] = useState(isLecturer ? "Faculty Building 4, Office 302" : "Student Lab Hall B");
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 382-9102");
  const [biography, setBiography] = useState(
    isLecturer
      ? "Senior Lecturer in Systems Engineering and Distributed Computing. Faculty advisor for undergraduate capstone projects and research symposiums."
      : "Undergraduate student majoring in Software Engineering. Focus on real-time systems and IoT telemetric pipelines."
  );
  const [profileSaved, setProfileSaved] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Assigned courses for lecturer
  const assignedCourses = courses.filter((c) =>
    currentLecturer ? currentLecturer.assignedCourses.includes(c.code) : true
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (isLecturer && currentLecturer) {
      changeLecturerPassword(currentLecturer.email, newPassword);
      setPasswordSuccess("Your university password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (isStudent && currentStudent) {
      changeStudentPassword(currentStudent.email, newPassword);
      setPasswordSuccess("Your student account password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out of your university workspace?")) {
      router.push("/login");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Photo with Change Button */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-[#0B1220] text-white text-2xl font-extrabold flex items-center justify-center shadow-md">
                {isLecturer ? "ER" : "AC"}
              </div>
              <button
                type="button"
                onClick={() => alert("Upload photo feature: Select PNG or JPG image up to 2MB.")}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-xs transition-colors"
                title="Change profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1220]">
                  {fullName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  {isLecturer ? (currentLecturer?.position || "Senior Lecturer") : "Student Enrolled"}
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {isLecturer ? "STAFF ID: LEC-2024-001" : "STUDENT ID: CS2023001"}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>{isLecturer ? currentLecturer?.email : currentStudent?.email}</span>
                <span>•</span>
                <span>Department of Computer Science & Engineering</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Information & Contact */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1.1: Personal Profile Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                Personal Information
              </h3>
              {profileSaved && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Changes Saved
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">University Email (Read-Only)</label>
                  <input
                    type="email"
                    disabled
                    value={isLecturer ? currentLecturer?.email : currentStudent?.email}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Office / Campus Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={officeLocation}
                      onChange={(e) => setOfficeLocation(e.target.value)}
                      className="w-full px-3 py-2 pl-8 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Contact Telephone</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 pl-8 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Academic Biography</label>
                <textarea
                  rows={3}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 resize-none text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="md">
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Section 1.2: Password & Credentials Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                Change Password & Security
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Default Password Secured
              </span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">New Password</label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="outline" size="md">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Assigned Courses & Faculty Status */}
        <div className="space-y-6">
          {/* Assigned Department & Position */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              University Faculty Details
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Department</span>
                  <span className="font-bold text-slate-900">Department of Computer Science & Engineering</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Academic Position</span>
                  <span className="font-bold text-slate-900">Senior Lecturer (Tenured Faculty)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Office Hours</span>
                  <span className="font-medium text-slate-700">Mon & Wed, 2:00 PM – 4:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Courses (Section 1) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned Courses ({assignedCourses.length})
              </span>
              <Link href="/dashboard/courses" className="text-xs font-semibold text-teal-700 hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2">
              {assignedCourses.map((crs) => (
                <div
                  key={crs.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 mr-1.5">
                      {crs.code}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{crs.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
