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
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminData, AdminDataProvider } from "@/context/AdminDataContext";

function ChangePasswordContent() {
  const { changeLecturerPassword, findLecturerByEmail, lecturers } = useAdminData();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [lecturerEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("unicodetrack_pending_lecturer_email");
        if (stored) return stored;
      } catch {}
    }
    return "sarah.almansoor@university.edu";
  });

  const matchedLecturer = findLecturerByEmail(lecturerEmail) || lecturers.find((l) => !l.hasChangedDefaultPassword);
  const lecturerName = matchedLecturer?.name || "Dr. Sarah Al-Mansoor";

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (!currentPassword) {
      errs.currentPassword = "Current Password is required";
    }

    if (!newPassword) {
      errs.newPassword = "New Password is required";
    } else if (newPassword.length < 8) {
      errs.newPassword = "New Password must contain at least 8 characters";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm New Password is required";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "New Password and confirmation must match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isFormValid =
    currentPassword.trim().length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      changeLecturerPassword(lecturerEmail, newPassword);
      setIsSuccess(true);
      try {
        sessionStorage.removeItem("unicodetrack_pending_lecturer_email");
      } catch {
        // Ignore
      }
    }, 450);
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

        <h2 className="mt-4 text-2xl font-extrabold text-[#0B1220] tracking-tight">
          Change Your Default Password
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
          For security reasons, you must create a new password before continuing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E2E8F0] rounded-2xl sm:px-10 space-y-5">
          {/* Lecturer Identity Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lecturer Account</span>
              <p className="font-bold text-slate-900 mt-0.5">{lecturerName}</p>
              <p className="text-slate-500 font-mono text-[11px]">{lecturerEmail}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>

          {/* Security alert */}
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Default password <code className="font-bold text-slate-800">UniCode@2004</code> was detected. Complete this step to activate your academic dashboard.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1220]">
                Password Updated Successfully!
              </h3>
              <p className="text-xs text-slate-600">
                Your account is now fully secured. You can proceed directly to your university dashboard.
              </p>
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
                    placeholder="Enter current default password (UniCode@2004)"
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                      errors.currentPassword
                        ? "border-rose-300 focus:ring-rose-200"
                        : "border-slate-300 focus:ring-teal-200 focus:border-[#14B8A6]"
                    }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
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
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                      errors.newPassword
                        ? "border-rose-300 focus:ring-rose-200"
                        : "border-slate-300 focus:ring-teal-200 focus:border-[#14B8A6]"
                    }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
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
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-rose-300 focus:ring-rose-200"
                        : "border-slate-300 focus:ring-teal-200 focus:border-[#14B8A6]"
                    }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
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

              {/* Checklist visual feedback */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      newPassword.length >= 8 ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={newPassword.length >= 8 ? "text-slate-800 font-medium" : "text-slate-500"}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      confirmPassword && newPassword === confirmPassword
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      confirmPassword && newPassword === confirmPassword
                        ? "text-slate-800 font-medium"
                        : "text-slate-500"
                    }
                  >
                    New passwords match
                  </span>
                </div>
              </div>

              {/* Update Password Button (disabled when validation fails) */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isFormValid || isLoading}
                className="w-full justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Back to Sign In
          </Link>
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
