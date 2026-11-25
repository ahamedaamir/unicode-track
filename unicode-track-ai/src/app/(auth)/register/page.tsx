"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  Code2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Building2, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ShieldCheck,
  School
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function UniversityAdminRegisterPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State preserved across all steps
  const [formData, setFormData] = useState({
    universityName: "",
    faculty: "",
    location: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Step 1 Validation Errors
  const [step1Errors, setStep1Errors] = useState<{
    universityName?: string;
    faculty?: string;
    location?: string;
    email?: string;
  }>({});

  // Step 2 OTP State
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [otpError, setOtpError] = useState<string>("");
  const inputRef0 = useRef<HTMLInputElement>(null);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const inputRef3 = useRef<HTMLInputElement>(null);
  const otpInputRefs = [inputRef0, inputRef1, inputRef2, inputRef3];

  // Step 3 Password Visibility & Validation
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [step3Errors, setStep3Errors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle Input Changes for Step 1
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error
    if (step1Errors[field as keyof typeof step1Errors]) {
      setStep1Errors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate Step 1
  const validateStep1 = () => {
    const errors: typeof step1Errors = {};
    if (!formData.universityName.trim()) {
      errors.universityName = "University Name is required";
    }
    if (!formData.faculty.trim()) {
      errors.faculty = "Faculty / School is required";
    }
    if (!formData.location.trim()) {
      errors.location = "University Location is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Administrator Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid institutional email address";
      }
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(2);
      }, 300);
    }
  };

  // Step 2 OTP Handlers
  const handleOtpChange = (index: number, value: string) => {
    setOtpError("");
    if (value.length > 1) {
      // Handle paste
      const pastedDigits = value.replace(/\D/g, "").slice(0, 4).split("");
      if (pastedDigits.length > 0) {
        const newOtp = [...otp];
        pastedDigits.forEach((digit, i) => {
          if (i < 4) newOtp[i] = digit;
        });
        setOtp(newOtp);
        const nextFocusIndex = Math.min(pastedDigits.length, 3);
        otpInputRefs[nextFocusIndex].current?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);

    // Auto focus next box
    if (value && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 4) {
      setOtpError("Please enter the complete 4-digit verification code");
      return;
    }

    // Demo rule: fixed OTP is 2004
    if (enteredOtp === "2004") {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(3);
      }, 350);
    } else {
      setOtpError("Invalid verification code. Please enter the demo code 2004.");
    }
  };

  // Step 3 Validation & Submit
  const validateStep3 = () => {
    const errors: typeof step3Errors = {};
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm Password is required";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setStep3Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep3()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(4);
      }, 400);
    }
  };

  // Steps Configuration for Progress Header
  const steps = [
    { number: 1, label: "University Information" },
    { number: 2, label: "Email Verification" },
    { number: 3, label: "Create Password" },
    { number: 4, label: "Registration Complete" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between font-sans text-foreground">
      {/* Top Navbar Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-[10px] bg-card border border-border text-foreground">
              <Code2 className="w-4 h-4 text-accent" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent flex items-center justify-center ring-2 ring-background">
                <Sparkles className="w-1.5 h-1.5 text-background" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-foreground">
                UniCodeTrack
              </span>
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                AI
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground hidden sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="font-semibold text-accent hover:text-accent-hover hover:underline px-2.5 py-1.5 rounded-[10px] border border-border bg-muted"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Wizard Title & Subtitle */}
        <div className="text-center mb-8">
          <Badge variant="teal" size="md" className="mb-2">
            Institutional Onboarding
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            University Administrator Registration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Provision a dedicated university workspace to oversee academic projects, student GitHub contributions, and campus hackathons.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step) => {
              const isPassed = currentStep > step.number;
              const isCurrent = currentStep === step.number;

              return (
                <div key={step.number} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      isPassed
                        ? "bg-accent text-background shadow-xs font-bold"
                        : isCurrent
                        ? "bg-foreground text-background ring-4 ring-accent/20 shadow-xs font-bold"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.number}
                  </div>
                  <span
                    className={`mt-2 text-[11px] leading-tight font-medium hidden sm:block ${
                      isCurrent
                        ? "text-foreground font-semibold"
                        : isPassed
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar line */}
          <div className="relative mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Form Container Card */}
        <div className="bg-card rounded-[16px] border border-border shadow-sm p-6 sm:p-10">
          {/* STEP 1: University Information */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="border-b border-border pb-4 mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Step 1 — University Information
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Provide verified details about your university and designated faculty.
                </p>
              </div>

              {/* University Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  University Name <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.universityName}
                    onChange={(e) => handleInputChange("universityName", e.target.value)}
                    placeholder="e.g. Stanford University or National Institute of Technology"
                    className={`w-full px-3.5 py-2.5 pl-10 rounded-[10px] border text-sm transition-all text-foreground bg-muted focus:outline-none focus:ring-2 placeholder:text-muted-foreground ${
                      step1Errors.universityName
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                    }`}
                  />
                  <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {step1Errors.universityName && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {step1Errors.universityName}
                  </p>
                )}
              </div>

              {/* Faculty */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Faculty / School <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => handleInputChange("faculty", e.target.value)}
                    placeholder="e.g. Faculty of Engineering and Applied Sciences"
                    className={`w-full px-3.5 py-2.5 pl-10 rounded-[10px] border text-sm transition-all text-foreground bg-muted focus:outline-none focus:ring-2 placeholder:text-muted-foreground ${
                      step1Errors.faculty
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                    }`}
                  />
                  <GraduationCap className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {step1Errors.faculty && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {step1Errors.faculty}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  University Location <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="City, Country (e.g. Cambridge, United Kingdom)"
                    className={`w-full px-3.5 py-2.5 pl-10 rounded-[10px] border text-sm transition-all text-foreground bg-muted focus:outline-none focus:ring-2 placeholder:text-muted-foreground ${
                      step1Errors.location
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                    }`}
                  />
                  <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {step1Errors.location && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {step1Errors.location}
                  </p>
                )}
              </div>

              {/* Administrator Email */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Administrator Email (.edu / institutional domain) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="admin@university.edu"
                    className={`w-full px-3.5 py-2.5 pl-10 rounded-[10px] border text-sm transition-all text-foreground bg-muted focus:outline-none focus:ring-2 placeholder:text-muted-foreground ${
                      step1Errors.email
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                    }`}
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {step1Errors.email && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {step1Errors.email}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Must be an authorized administrative contact for domain ownership verification.
                </p>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading ? "Saving..." : "Continue to Email Verification"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Demo OTP Verification */}
          {currentStep === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="border-b border-border pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Step 2 — Email Verification
                </span>
                <h2 className="text-xl font-bold text-foreground mt-1">
                  Verify Your Email Address
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Enter the verification code to confirm your administrator email:
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-muted border border-border font-mono text-xs font-semibold text-foreground">
                  <Mail className="w-3.5 h-3.5 text-accent" />
                  {formData.email}
                </div>
              </div>

              {/* Demo Mode Notice Box */}
              <div className="p-4 rounded-[10px] bg-accent/10 border border-accent/20 text-xs text-foreground space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-accent">
                  <Info className="w-4 h-4 text-accent" />
                  <span>Development Demo Verification</span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  No real email has been sent. For this demo prototype, use the fixed verification code below to proceed:
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-muted-foreground">Demo verification code:</span>
                  <span className="px-2.5 py-0.5 rounded-[10px] bg-card text-accent border border-accent/30 font-mono font-bold text-sm tracking-widest shadow-2xs">
                    2004
                  </span>
                </div>
              </div>

              {/* 4-digit OTP Inputs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center">
                  Enter 4-Digit Security Code
                </label>
                <div className="flex justify-center gap-3 sm:gap-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpInputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-mono font-bold rounded-[10px] border transition-all text-foreground bg-muted focus:outline-none focus:ring-2 ${
                        otpError
                          ? "border-danger focus:ring-danger/20"
                          : digit
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border focus:ring-accent focus:border-accent"
                      }`}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-xs text-danger mt-3 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {otpError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStep(1)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Create Administrator Password */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-5">
              <div className="border-b border-border pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Step 3 — Security Setup
                </span>
                <h2 className="text-xl font-bold text-foreground mt-1">
                  Create Administrator Password
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set a secure passphrase to safeguard your university administrator credentials.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Create Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      handleInputChange("password", e.target.value);
                      if (step3Errors.password) setStep3Errors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Minimum 8 characters"
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-[10px] border text-sm transition-all text-foreground bg-muted focus:outline-none focus:ring-2 placeholder:text-muted-foreground ${
                      step3Errors.password
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                    }`}
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {step3Errors.password && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {step3Errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      handleInputChange("confirmPassword", e.target.value);
                      if (step3Errors.confirmPassword) setStep3Errors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Re-enter password"
                    className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-[10px] border text-sm transition-all text-foreground bg-muted focus:outline-none focus:ring-2 placeholder:text-muted-foreground ${
                      step3Errors.confirmPassword
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-accent focus:border-accent"
                    }`}
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
                {step3Errors.confirmPassword && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {step3Errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password checklist criteria */}
              <div className="p-3 bg-muted rounded-[10px] border border-border text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      formData.password.length >= 8
                        ? "bg-accent text-background font-bold"
                        : "bg-card text-muted-foreground"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={formData.password.length >= 8 ? "text-foreground font-medium" : "text-muted-foreground"}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      formData.confirmPassword && formData.password === formData.confirmPassword
                        ? "bg-accent text-background font-bold"
                        : "bg-card text-muted-foreground"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      formData.confirmPassword && formData.password === formData.confirmPassword
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    Passwords match
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStep(2)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading ? "Provisioning..." : "Complete Registration"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 4: Registration Complete */}
          {currentStep === 4 && (
            <div className="text-center space-y-6">
              {/* Success Badge Icon */}
              <div className="w-16 h-16 rounded-[16px] bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Step 4 — Registration Complete
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                  University Registration Completed!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                  Your university administrator account has been created successfully. Your dedicated institutional workspace is ready.
                </p>
              </div>

              {/* Summary Card of Entered University Information */}
              <div className="bg-muted rounded-[16px] border border-border p-5 sm:p-6 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Workspace Summary
                  </span>
                  <Badge variant="teal" dot>
                    Active Admin
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                      University Name
                    </span>
                    <p className="font-bold text-foreground text-sm mt-0.5 flex items-center gap-1.5">
                      <School className="w-4 h-4 text-accent" />
                      {formData.universityName || "Stanford University"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                      Faculty / School
                    </span>
                    <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-accent" />
                      {formData.faculty || "Faculty of Computing"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                      Location
                    </span>
                    <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-accent" />
                      {formData.location || "California, USA"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                      Administrator Email
                    </span>
                    <p className="font-mono font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-accent" />
                      {formData.email || "admin@university.edu"}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center gap-2 text-[11px] text-accent bg-accent/10 p-2.5 rounded-[10px] border border-accent/20">
                  <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                  <span>
                    Simulated client-side registration demo. Backend database and email routing will be configured in production.
                  </span>
                </div>
              </div>

              {/* Continue to Sign In CTA */}
              <div className="pt-2">
                <Button
                  href="/login"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Sign In
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-6 border-t border-border bg-card text-center text-xs text-muted-foreground">
        <p>© 2026 UniCodeTrack AI • Academic Project & Hackathon Management Platform</p>
      </footer>
    </div>
  );
}
