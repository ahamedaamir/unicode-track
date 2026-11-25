"use client";

import React, { useState, useEffect } from "react";
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
  ChevronRight,
  GraduationCap
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function ProfilePage() {
  const router = useRouter();
  const {
    departments,
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

  const [sessionUser, setSessionUser] = useState<{
    role?: string;
    email?: string;
    name?: string;
    position?: string;
    assignedCourses?: string[];
  } | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("unicodetrack_authenticated_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessionUser(parsed);
        if (parsed.name) {
          setFullName(parsed.name);
        }
      }
    } catch {}
  }, []);

  const currentLecturer = lecturers.find((l) => l.email === (activeLecturerEmail || sessionUser?.email)) || null;
  const currentStudent = students.find((s) => s.email.toLowerCase() === (activeStudentEmail || sessionUser?.email || "").toLowerCase()) || null;

  // Editable Profile Form State
  const [fullName, setFullName] = useState(
    isLecturer
      ? (currentLecturer?.name || sessionUser?.name || "")
      : (currentStudent?.fullName || sessionUser?.name || "")
  );
  const [officeLocation, setOfficeLocation] = useState(isLecturer ? "Faculty Building 4, Office 302" : "Student Lab Hall B");
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 382-9102");
  const [biography, setBiography] = useState(
    isLecturer
      ? "Senior Lecturer in Systems Engineering and Distributed Computing. Faculty advisor for undergraduate capstone projects and research symposiums."
      : "Undergraduate student majoring in Software Engineering. Focus on real-time systems and IoT telemetric pipelines."
  );
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync profile details when user is loaded
  useEffect(() => {
    if (isLecturer) {
      if (currentLecturer?.name) {
        setFullName(currentLecturer.name);
      } else if (sessionUser?.name && !fullName) {
        setFullName(sessionUser.name);
      }
    } else if (isStudent) {
      if (currentStudent?.fullName) {
        setFullName(currentStudent.fullName);
      } else if (sessionUser?.name && !fullName) {
        setFullName(sessionUser.name);
      }
    }
  }, [isLecturer, isStudent, currentLecturer, currentStudent, sessionUser]);

  // Dynamic user data resolution
  const resolvedName = fullName || currentLecturer?.name || sessionUser?.name || (isLecturer ? "Faculty Member" : "Student");
  const resolvedEmail = isLecturer
    ? (currentLecturer?.email || sessionUser?.email || activeLecturerEmail || "")
    : (currentStudent?.email || sessionUser?.email || activeStudentEmail || "");
  const resolvedPosition = isLecturer
    ? (currentLecturer?.position || sessionUser?.position || "Senior Lecturer")
    : "Enrolled Student";
  const resolvedInitials = resolvedName
    ? resolvedName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : isLecturer ? "FL" : "ST";

  const resolvedDepartment =
    departments.find((d) => d.id === (currentLecturer as any)?.departmentId)?.name ||
    "Department of Computer Science & Engineering";

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Assigned courses for lecturer
  const lecturerCourseCodes = currentLecturer?.assignedCourses || sessionUser?.assignedCourses || [];
  const assignedCourses = courses.filter((c) => lecturerCourseCodes.includes(c.code));

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

    if (isLecturer && resolvedEmail) {
      changeLecturerPassword(resolvedEmail, newPassword);
      setPasswordSuccess("Your university password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (isStudent && resolvedEmail) {
      changeStudentPassword(resolvedEmail, newPassword);
      setPasswordSuccess("Your student account password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out of your university workspace?")) {
      try {
        sessionStorage.removeItem("unicodetrack_authenticated_user");
        sessionStorage.removeItem("unicodetrack_pending_user_role");
        sessionStorage.removeItem("unicodetrack_active_lecturer_email");
      } catch {}
      router.push("/login");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner Card */}
      <div className="relative overflow-hidden bg-card rounded-[16px] border border-border p-6 sm:p-8">
        {/* Soft decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Photo with Change Button */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-[16px] bg-accent-soft text-accent border border-accent-border text-2xl font-bold flex items-center justify-center shadow-sm">
                {resolvedInitials}
              </div>
              <button
                type="button"
                onClick={() => alert("Upload photo feature: Select PNG or JPG image up to 2MB.")}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-[8px] bg-foreground text-background hover:opacity-90 flex items-center justify-center shadow-md transition-opacity cursor-pointer"
                title="Change profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {resolvedName}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full border border-accent-border">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {resolvedPosition}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-[8px] border border-border">
                  {isLecturer
                    ? `STAFF ID: ${currentLecturer?.id ? currentLecturer.id.toUpperCase() : "FACULTY"}`
                    : `STUDENT ID: ${currentStudent?.id ? currentStudent.id.toUpperCase() : "STUDENT"}`}
                </span>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                {resolvedEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-accent" />
                    <span>{resolvedEmail}</span>
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{resolvedDepartment}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-danger-soft hover:bg-danger-soft/80 text-danger border border-danger/30 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Information & Password Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Personal Profile Details */}
          <div className="bg-card p-6 rounded-[16px] border border-border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                Personal Information
              </h3>
              {profileSaved && (
                <span className="text-xs text-success font-semibold flex items-center gap-1 bg-success-soft px-2.5 py-0.5 rounded-full border border-success/30">
                  <Check className="w-3.5 h-3.5" /> Changes Saved
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-[10px] text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-foreground">University Email (Read-Only)</label>
                  <input
                    type="email"
                    disabled
                    value={resolvedEmail}
                    className="w-full px-3.5 py-2.5 bg-muted/50 border border-border text-muted-foreground rounded-[10px] cursor-not-allowed font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-foreground">Office / Campus Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={officeLocation}
                      onChange={(e) => setOfficeLocation(e.target.value)}
                      placeholder="e.g. Faculty Building 4, Office 302"
                      className="w-full px-3.5 py-2.5 pl-9 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-foreground">Contact Telephone</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +1 (555) 382-9102"
                      className="w-full px-3.5 py-2.5 pl-9 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                    <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-foreground">Academic Biography</label>
                <textarea
                  rows={3}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Share a short academic background or faculty supervision focus..."
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground resize-none text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-foreground text-background font-semibold hover:bg-foreground/90 rounded-[10px] text-xs transition-opacity cursor-pointer shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password & Credentials Management */}
          <div className="bg-card p-6 rounded-[16px] border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-accent" />
                Change Password & Security
              </h3>
              <span className="text-[11px] font-semibold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full border border-accent-border">
                Password Protected
              </span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              {passwordError && (
                <div className="p-3.5 rounded-[10px] bg-danger-soft border border-danger/30 text-danger flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3.5 rounded-[10px] bg-success-soft border border-success/30 text-success flex items-center gap-2.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-semibold text-foreground">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-foreground">New Password</label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-foreground">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-muted text-foreground border border-border hover:bg-muted/80 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Faculty Details & Assigned Courses */}
        <div className="space-y-6">
          {/* Card 3: University Faculty Details */}
          <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              University Faculty Details
            </span>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-accent-soft text-accent border border-accent-border flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Department</span>
                  <span className="font-semibold text-foreground truncate block">{resolvedDepartment}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-accent-soft text-accent border border-accent-border flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Academic Position</span>
                  <span className="font-semibold text-foreground truncate block">{resolvedPosition}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-muted text-foreground border border-border flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Consultation Hours</span>
                  <span className="font-medium text-foreground">Mon & Wed, 2:00 PM – 4:00 PM</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-success-soft text-success border border-success/30 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Account Status</span>
                  <span className="font-medium text-success">Active Faculty Member</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Assigned Courses */}
          <div className="bg-card p-5 sm:p-6 rounded-[16px] border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Assigned Courses ({assignedCourses.length})
              </span>
              <Link
                href="/dashboard/courses"
                className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                View all &rarr;
              </Link>
            </div>

            {assignedCourses.length === 0 ? (
              <div className="py-6 px-4 text-center border border-dashed border-border rounded-[10px] text-muted-foreground space-y-1">
                <BookOpen className="w-6 h-6 mx-auto text-muted-foreground/50 mb-1" />
                <p className="text-xs font-medium text-foreground">No courses assigned yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Courses allocated by the university administrator will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedCourses.map((crs) => (
                  <div
                    key={crs.id}
                    className="p-3 rounded-[10px] bg-muted/40 border border-border flex items-center justify-between text-xs hover:border-accent/40 transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-mono text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded border border-accent-border mr-1.5">
                        {crs.code}
                      </span>
                      <span className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                        {crs.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
