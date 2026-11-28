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
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-foreground">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-[10px] bg-card border border-border text-foreground shadow-xs">
            <Code2 className="w-5 h-5 text-accent" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center ring-2 ring-background">
              <Sparkles className="w-2 h-2 text-background" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground">
              UniCodeTrack
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              AI
            </span>
          </div>
        </Link>

        {/* Required Heading & Description */}
        <h2 className="mt-4 text-2xl font-extrabold text-foreground tracking-tight">
          Create Your New Password
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          For your account security, you must change your administrator-assigned password before continuing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-card py-8 px-6 border border-border rounded-[16px] sm:px-10 space-y-5 shadow-sm">
          {/* Identity Information Card */}
          <div className="p-3.5 rounded-[10px] bg-muted border border-border text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  {isStudentRole ? "Student Account" : "Faculty Account"}
                </span>
                {matchedStudent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold border border-accent/20">
                    Year {matchedStudent.academicYear} • Sem {matchedStudent.semester}
                  </span>
                )}
              </div>
              <p className="font-bold text-foreground text-sm">{displayName}</p>
              {/* Required: Display student's email address */}
              <p className="text-muted-foreground font-mono text-[11px]">{displayEmail}</p>
              {matchedStudent && (
                <p className="text-[10px] text-muted-foreground truncate max-w-[240px]">
                  {getDeptName(matchedStudent.departmentId)}
                </p>
              )}
            </div>
            <div className="p-2.5 rounded-[10px] bg-warning/10 text-warning border border-warning/20 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {errors.general && (
            <div className="p-3 rounded-[10px] bg-danger/10 border border-danger/20 text-xs text-danger flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {isSuccess ? (
            /* Success State */
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-[16px] bg-accent/10 text-accent border border-accent/20 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Password Updated Successfully!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
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
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Current Password <span className="text-danger">*</span>
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
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-[10px] border text-sm text-foreground bg-muted focus:outline-none focus:ring-2 ${errors.currentPassword
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                      }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.currentPassword}
                  </p>
                )}
              </div>

              {/* Field 2: New Password */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  New Password <span className="text-danger">*</span>
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
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-[10px] border text-sm text-foreground bg-muted focus:outline-none focus:ring-2 ${errors.newPassword
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                      }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Confirm New Password <span className="text-danger">*</span>
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
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-[10px] border text-sm text-foreground bg-muted focus:outline-none focus:ring-2 ${errors.confirmPassword
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                      }`}
                    required
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Validation checklist indicator */}
              <div className="p-3 bg-muted rounded-[10px] border border-border text-[11px] space-y-1.5 text-muted-foreground">
                <span className="font-semibold text-foreground block text-[10px] uppercase tracking-wider">
                  Password Requirements:
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword.length >= 8 ? "bg-accent/20 text-accent font-bold" : "bg-card text-muted-foreground"
                  }`}>
                    {newPassword.length >= 8 ? "✓" : "•"}
                  </span>
                  <span className={newPassword.length >= 8 ? "text-accent font-medium" : ""}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword && currentPassword && newPassword !== currentPassword ? "bg-accent/20 text-accent font-bold" : "bg-card text-muted-foreground"
                  }`}>
                    {newPassword && currentPassword && newPassword !== currentPassword ? "✓" : "•"}
                  </span>
                  <span className={newPassword && currentPassword && newPassword !== currentPassword ? "text-accent font-medium" : ""}>
                    Different from current default password
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword && confirmPassword && newPassword === confirmPassword ? "bg-accent/20 text-accent font-bold" : "bg-card text-muted-foreground"
                  }`}>
                    {newPassword && confirmPassword && newPassword === confirmPassword ? "✓" : "•"}
                  </span>
                  <span className={newPassword && confirmPassword && newPassword === confirmPassword ? "text-accent font-medium" : ""}>
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
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
