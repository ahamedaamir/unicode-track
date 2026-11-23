"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Sparkles,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  KeyRound,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminData, AdminDataProvider } from "@/context/AdminDataContext";
import { updateStudentPassword } from "@/lib/auth/student-auth";

function ChangePasswordContent() {
  const { 
    findStudentByEmail, 
    changeStudentPassword, 
    findLecturerByEmail, 
    changeLecturerPassword, 
    students,
    departments
  } = useAdminData();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Lazy initialize target email
  const [userEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const studentEmail = sessionStorage.getItem("unicodetrack_pending_student_email");
        if (studentEmail) return studentEmail;

        const rawUser = sessionStorage.getItem("unicodetrack_authenticated_user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed.email) return parsed.email;
        }

        const lecturerEmail = sessionStorage.getItem("unicodetrack_pending_lecturer_email");
        if (lecturerEmail) return lecturerEmail;
      } catch { }
    }
    return "alex.chen@university.edu";
  });

  const matchedStudent = findStudentByEmail(userEmail) || students.find((s) => s.mustChangePassword !== false);
  const matchedLecturer = !matchedStudent ? findLecturerByEmail(userEmail) : undefined;

  const displayName = matchedStudent?.fullName || matchedLecturer?.name || "Student Member";
  const displayEmail = matchedStudent?.email || matchedLecturer?.email || userEmail;
  const isStudentRole = Boolean(matchedStudent || !matchedLecturer);

  const getDeptName = (deptId?: string): string => {
    if (!deptId) return "Faculty of Computing & Technology";
    const d = departments.find((dept) => dept.id === deptId);
    return d ? d.name : "Faculty of Computing & Technology";
  };

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};

    if (!currentPassword) {
      errs.currentPassword = "Current Password is required.";
    }

    if (!newPassword) {
      errs.newPassword = "New Password is required.";
    } else if (newPassword.length < 8) {
      errs.newPassword = "New Password must contain at least 8 characters.";
    } else if (currentPassword && newPassword === currentPassword) {
      errs.newPassword = "New Password must be different from your current default password.";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm New Password is required.";
    } else if (newPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = "New Password and confirmation do not match.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (isStudentRole) {
        // 1. Update Supabase Auth & DB
        await updateStudentPassword(displayEmail, newPassword);

        // 2. Update Context state
        changeStudentPassword(displayEmail, newPassword);

        // 3. Update session storage flags
        try {
          sessionStorage.removeItem("unicodetrack_pending_student_email");
          const rawUser = sessionStorage.getItem("unicodetrack_authenticated_user");
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            parsed.mustChangePassword = false;
            sessionStorage.setItem("unicodetrack_authenticated_user", JSON.stringify(parsed));
          }
        } catch {}
      } else {
        // Lecturer password update
        changeLecturerPassword(displayEmail, newPassword);
        try {
          sessionStorage.removeItem("unicodetrack_pending_lecturer_email");
        } catch {}
      }

      setIsSuccess(true);
    } catch {
      setErrors({ general: "Failed to update password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-[#0B1220]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#0B1220] text-white shadow-xs">
            <Code2 className="w-5 h-5 text-teal-400" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#14B8A6] flex items-center justify-center ring-2 ring-[#F8FAFC]">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-[#0B1220]">
              UniCodeTrack
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              AI
            </span>
          </div>
        </Link>

        {/* Required Heading & Description */}
        <h2 className="mt-4 text-2xl font-extrabold text-[#0B1220] tracking-tight">
          Create Your New Password
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
          For your account security, you must change your administrator-assigned password before continuing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E2E8F0] rounded-2xl sm:px-10 space-y-5">
          {/* Identity Information Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {isStudentRole ? "Student Account" : "Faculty Account"}
                </span>
                {matchedStudent && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    Year {matchedStudent.academicYear} • Sem {matchedStudent.semester}
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900 text-sm">{displayName}</p>
              {/* Required: Display student's email address */}
              <p className="text-slate-500 font-mono text-[11px]">{displayEmail}</p>
              {matchedStudent && (
                <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
                  {getDeptName(matchedStudent.departmentId)}
                </p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {/* Security Alert Notice */}
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Default credentials detected for <strong className="font-semibold text-slate-800">{displayEmail}</strong>. Setting a personalized password activates your academic dashboard and projects.
            </p>
          </div>

          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {isSuccess ? (
            /* Success State */
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0B1220]">
                  Password Updated Successfully!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your student account is now fully secured. You can now access your university dashboard.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  href="/dashboard"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Enter Dashboard Workspace
                </Button>
              </div>
            </div>
          ) : (
            /* Mandatory Password Change Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                    }}
                    placeholder="Enter current administrator-assigned password"
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${errors.currentPassword
                        ? "border-rose-300 focus:ring-rose-200"
                        : "border-slate-300 focus:ring-teal-200 focus:border-[#14B8A6]"
                      }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.currentPassword}
                  </p>
                )}
              </div>

              {/* Field 2: New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
                    }}
                    placeholder="At least 8 characters"
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${errors.newPassword
                        ? "border-rose-300 focus:ring-rose-200"
                        : "border-slate-300 focus:ring-teal-200 focus:border-[#14B8A6]"
                      }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Re-enter new password"
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${errors.confirmPassword
                        ? "border-rose-300 focus:ring-rose-200"
                        : "border-slate-300 focus:ring-teal-200 focus:border-[#14B8A6]"
                      }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Validation checklist indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1.5 text-slate-600">
                <span className="font-semibold text-slate-700 block text-[10px] uppercase tracking-wider">
                  Password Requirements:
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword.length >= 8 ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-200 text-slate-400"
                  }`}>
                    {newPassword.length >= 8 ? "✓" : "•"}
                  </span>
                  <span className={newPassword.length >= 8 ? "text-emerald-700 font-medium" : ""}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword && currentPassword && newPassword !== currentPassword ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-200 text-slate-400"
                  }`}>
                    {newPassword && currentPassword && newPassword !== currentPassword ? "✓" : "•"}
                  </span>
                  <span className={newPassword && currentPassword && newPassword !== currentPassword ? "text-emerald-700 font-medium" : ""}>
                    Different from current default password
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword && confirmPassword && newPassword === confirmPassword ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-200 text-slate-400"
                  }`}>
                    {newPassword && confirmPassword && newPassword === confirmPassword ? "✓" : "•"}
                  </span>
                  <span className={newPassword && confirmPassword && newPassword === confirmPassword ? "text-emerald-700 font-medium" : ""}>
                    Passwords match
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full justify-center mt-2"
                iconRight={<Check className="w-4 h-4" />}
              >
                {isLoading ? "Updating Password..." : "Save New Password & Continue"}
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <AdminDataProvider>
      <ChangePasswordContent />
    </AdminDataProvider>
  );
}
