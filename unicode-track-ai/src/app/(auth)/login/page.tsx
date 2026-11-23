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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminData, AdminDataProvider } from "@/context/AdminDataContext";

function LoginContent() {
  const router = useRouter();
  const { findLecturerByEmail, lecturers } = useAdminData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const trimmedEmail = email.trim().toLowerCase();

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      // Check if user is an existing lecturer
      const lecturer = findLecturerByEmail(trimmedEmail);
      if (lecturer) {
        if (lecturer.status === "Deactivated") {
          setErrorMessage("This lecturer account has been deactivated by the university administrator.");
          return;
        }

        // If default password entered
        if (password === "UniCode@2004") {
          if (!lecturer.hasChangedDefaultPassword) {
            // Must change default password first!
            try {
              sessionStorage.setItem("unicodetrack_pending_lecturer_email", trimmedEmail);
            } catch {
              // Ignore
            }
            router.push("/change-password");
            return;
          }
        }

        // Lecturer has already changed password
        router.push("/dashboard");
        return;
      }

      // Check if email has default password for any pending lecturer
      if (password === "UniCode@2004") {
        try {
          sessionStorage.setItem("unicodetrack_pending_lecturer_email", trimmedEmail);
        } catch {
          // Ignore
        }
        router.push("/change-password");
        return;
      }

      // Administrator or generic sign in
      router.push("/dashboard");
    }, 350);
  };

  // Helper buttons for demo review
  const handleSelectDemoAdmin = () => {
    setEmail("admin@university.edu");
    setPassword("adminPassword123");
    setErrorMessage("");
  };

  const handleSelectDemoLecturerFirstLogin = () => {
    // Pick the first lecturer who hasn't changed default password
    const pendingLec = lecturers.find((l) => !l.hasChangedDefaultPassword) || lecturers[2];
    setEmail(pendingLec ? pendingLec.email : "sarah.almansoor@university.edu");
    setPassword("UniCode@2004");
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
          Enter your institutional credentials to access your workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E2E8F0] rounded-2xl sm:px-10 space-y-5">
          {/* Demo Quick-Fill Helpers */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <span>Demo Quick-Fill:</span>
              <span className="text-teal-700 font-medium">Click to test</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleSelectDemoAdmin}
                className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-teal-500 text-[11px] font-medium text-slate-800 transition-colors"
              >
                <span className="block font-bold text-slate-900">1. Administrator</span>
                <span className="text-[10px] text-slate-500">&rarr; Direct to /dashboard</span>
              </button>
              <button
                type="button"
                onClick={handleSelectDemoLecturerFirstLogin}
                className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-teal-500 text-[11px] font-medium text-slate-800 transition-colors"
              >
                <span className="block font-bold text-teal-900">2. Lecturer (1st Login)</span>
                <span className="text-[10px] text-amber-700 font-medium">&rarr; Triggers /change-password</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu or lecturer@university.edu"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent text-slate-900 bg-white"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password input with show/hide */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent text-slate-900 bg-white"
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

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full justify-center mt-2"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Link to Register */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Don&apos;t have a university workspace?{" "}
            <Link
              href="/register"
              className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
            >
              Register your university
            </Link>
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
