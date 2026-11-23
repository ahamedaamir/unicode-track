"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Code2, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff,
  AlertCircle,
  GraduationCap,
  Users,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminData, AdminDataProvider } from "@/context/AdminDataContext";
import { authenticateStudent } from "@/lib/auth/student-auth";

function LoginContent() {
  const router = useRouter();
  const { students, findLecturerByEmail } = useAdminData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Validation
    if (!trimmedEmail) {
      setErrorMessage("University email address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid university email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Check Student Authentication (Supabase Auth with synchronized store fallback)
      const isRegisteredStudent = students.some((s) => s.email.toLowerCase() === trimmedEmail);

      if (isRegisteredStudent) {
        const studentAuth = await authenticateStudent(trimmedEmail, password, students);

        if (!studentAuth.success) {
          setErrorMessage(studentAuth.error || "Authentication failed.");
          setIsSubmitting(false);
          return;
        }

        if (studentAuth.student) {
          // Set student session state
          try {
            sessionStorage.setItem(
              "unicodetrack_authenticated_user",
              JSON.stringify({
                role: "student",
                email: studentAuth.student.email,
                fullName: studentAuth.student.fullName,
                departmentId: studentAuth.student.departmentId,
                mustChangePassword: studentAuth.mustChangePassword,
              })
            );
            sessionStorage.setItem("unicodetrack_pending_user_role", "student");
          } catch {
            // Ignore session storage errors
          }

          // 3. First-Time Login Detection
          if (studentAuth.mustChangePassword) {
            try {
              sessionStorage.setItem("unicodetrack_pending_student_email", trimmedEmail);
            } catch {
              // Ignore
            }
            router.push("/change-password");
          } else {
            try {
              sessionStorage.removeItem("unicodetrack_pending_student_email");
            } catch {
              // Ignore
            }
            router.push("/dashboard");
          }
          return;
        }
      }

      // 4. Check Lecturer Account Authentication
      const lecturer = findLecturerByEmail(trimmedEmail);
      if (lecturer) {
        if (lecturer.status === "Deactivated") {
          setErrorMessage("This lecturer account has been deactivated by the university administrator.");
          setIsSubmitting(false);
          return;
        }

        if (password === (lecturer.defaultPassword || "UniCode@2004")) {
          if (!lecturer.hasChangedDefaultPassword) {
            try {
              sessionStorage.setItem("unicodetrack_pending_lecturer_email", trimmedEmail);
              sessionStorage.setItem("unicodetrack_pending_user_role", "lecturer");
            } catch {
              // Ignore
            }
            router.push("/change-password");
            return;
          }
        }

        try {
          sessionStorage.setItem("unicodetrack_pending_user_role", "lecturer");
        } catch {
          // Ignore
        }
        router.push("/dashboard");
        return;
      }

      // 5. Administrator Demo Credentials
      if (trimmedEmail === "admin@university.edu" && password === "adminPassword123") {
        try {
          sessionStorage.setItem("unicodetrack_pending_user_role", "admin");
          sessionStorage.removeItem("unicodetrack_pending_student_email");
          sessionStorage.removeItem("unicodetrack_pending_lecturer_email");
        } catch {
          // Ignore
        }
        router.push("/dashboard");
        return;
      }

      // 6. Generic failure
      setErrorMessage("Invalid university email or password. Please verify your credentials.");
    } catch {
      setErrorMessage("An unexpected error occurred during sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Quick-Fill Selectors
  const handleSelectStudentFirstLogin = () => {
    // Student needing mandatory first password change
    const pendingStudent = students.find((s) => s.mustChangePassword !== false && s.accountStatus === "active");
    setEmail(pendingStudent ? pendingStudent.email : "alex.chen@university.edu");
    setPassword(pendingStudent?.defaultPassword || "Student@2026");
    setErrorMessage("");
  };

  const handleSelectStudentActive = () => {
    // Student who has already completed first password change
    const activeStudent = students.find((s) => s.mustChangePassword === false && s.accountStatus === "active");
    setEmail(activeStudent ? activeStudent.email : "marcus.doe@university.edu");
    setPassword(activeStudent?.defaultPassword || "SecurePass2026!");
    setErrorMessage("");
  };

  const handleSelectStudentDeactivated = () => {
    // Deactivated student
    const deactStudent = students.find((s) => s.accountStatus === "inactive");
    setEmail(deactStudent ? deactStudent.email : "aisha.tariq@university.edu");
    setPassword(deactStudent?.defaultPassword || "Student@2026");
    setErrorMessage("");
  };

  const handleSelectDemoAdmin = () => {
    setEmail("admin@university.edu");
    setPassword("adminPassword123");
    setErrorMessage("");
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
          Sign In to UniCodeTrack AI
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
          Enter your university email and credentials to access your workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E2E8F0] rounded-2xl sm:px-10 space-y-5">
          {/* Quick-Fill Demo Helpers */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" /> Demo Quick-Fill Roles
              </span>
              <span className="text-teal-700 font-medium text-[10px]">Click to populate</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleSelectStudentFirstLogin}
                className="p-2 text-left rounded-lg bg-white border border-teal-200 hover:border-teal-500 hover:bg-teal-50/40 text-[11px] font-medium transition-colors group"
              >
                <div className="flex items-center gap-1 text-teal-800 font-bold">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                  <span>Student (1st Login)</span>
                </div>
                <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                  &rarr; Triggers /change-password
                </span>
              </button>

              <button
                type="button"
                onClick={handleSelectStudentActive}
                className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-[11px] font-medium transition-colors group"
              >
                <div className="flex items-center gap-1 text-slate-800 font-bold">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Student (Active)</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                  &rarr; Direct to /dashboard
                </span>
              </button>

              <button
                type="button"
                onClick={handleSelectStudentDeactivated}
                className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 text-[11px] font-medium transition-colors group"
              >
                <div className="flex items-center gap-1 text-slate-800 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Student (Deactivated)</span>
                </div>
                <span className="text-[10px] text-rose-600 font-medium block mt-0.5">
                  &rarr; Blocked access
                </span>
              </button>

              <button
                type="button"
                onClick={handleSelectDemoAdmin}
                className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-[11px] font-medium transition-colors group"
              >
                <div className="flex items-center gap-1 text-slate-800 font-bold">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Admin Workspace</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  &rarr; University Admin
                </span>
              </button>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                University Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Enter your university email"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent text-slate-900 bg-white placeholder:text-slate-400"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-teal-700 hover:text-teal-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent text-slate-900 bg-white placeholder:text-slate-400"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full justify-center mt-2"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? "Verifying Credentials..." : "Sign In"}
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Assigned a default password by your administrator?{" "}
            <span className="text-teal-700 font-semibold block mt-0.5">
              Sign in with it to complete your one-time password change.
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Back to UniCodeTrack AI Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AdminDataProvider>
      <LoginContent />
    </AdminDataProvider>
  );
}
