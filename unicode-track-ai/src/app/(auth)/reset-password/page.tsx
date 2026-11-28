"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Code2, Sparkles, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-[10px] bg-card border border-border text-foreground">
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
        <h2 className="mt-4 text-2xl font-bold text-foreground tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your academic email address to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-card py-8 px-6 border border-border rounded-[16px] sm:px-10 shadow-sm">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto border border-accent/20">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Check your inbox</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists for <span className="font-semibold text-accent">{email}</span>, password reset instructions have been sent.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@university.edu"
                    className="w-full px-3.5 py-2 pl-9 rounded-[10px] border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-foreground bg-muted placeholder:text-muted-foreground"
                    required
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center mt-2"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-accent hover:text-accent-hover hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to UniCodeTrack Home
          </Link>
        </div>
      </div>
    </div>
  );
}
