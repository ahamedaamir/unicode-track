import React from "react";
import Link from "next/link";
import { 
  Code2, 
  Sparkles, 
  ArrowUpRight,
  Globe,
  Terminal,
  GitBranch
} from "lucide-react";

export function Footer() {
  const currentYear = 2026;

  const productLinks = [
    { name: "Academic Projects", href: "#academic-projects" },
    { name: "GitHub Tracking", href: "#features" },
    { name: "AI Evaluation", href: "#ai-evaluation" },
    { name: "Hackathon Hub", href: "#hackathons" },
    { name: "Milestone Timelines", href: "#how-it-works" },
  ];

  const platformLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "About UniCodeTrack", href: "/about" },
    { name: "Public Hackathons", href: "/hackathons" },
    { name: "Sign In", href: "/login" },
    { name: "Register", href: "/register" },
  ];

  const accessLinks = [
    { name: "Sign In", href: "/login" },
    { name: "Register Account", href: "/register" },
    { name: "Lecturer Portal", href: "/login" },
    { name: "Student Workspaces", href: "/login" },
    { name: "Reset Password", href: "/reset-password" },
  ];

  return (
    <footer className="bg-[#0B1220] text-slate-300 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800/70">
          {/* Brand Column (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-white">
                <Code2 className="w-5 h-5 text-teal-400" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#14B8A6] flex items-center justify-center ring-2 ring-[#0B1220]">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">
                  UniCodeTrack
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              &ldquo;From classroom projects to hackathon competitions — build, track, and evaluate with AI.&rdquo;
            </p>

            <p className="text-xs text-slate-500 max-w-sm">
              Empowering universities, supervisors, and student teams with structured milestone management, verifiable GitHub contributions, and AI-assisted academic evaluation.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-colors"
                aria-label="GitHub Repository"
                title="GitHub"
              >
                <GitBranch className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-colors"
                aria-label="Terminal CLI"
                title="CLI & API"
              >
                <Terminal className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-colors"
                aria-label="University Network"
                title="Global University Consortium"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column: Product */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              {productLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-slate-400 hover:text-teal-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column: Platform & Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              {platformLinks.map((item) => (
                <li key={item.name}>
                  {item.href.startsWith("#") ? (
                    <a
                      href={item.href}
                      className="text-slate-400 hover:text-teal-400 transition-colors"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-slate-400 hover:text-teal-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column: Access & Auth */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Quick Access
            </h4>
            <ul className="space-y-2.5 text-sm">
              {accessLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-teal-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{item.name}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} UniCodeTrack AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Academic AI Assistant Engine Active
            </span>
            <span className="text-slate-600">|</span>
            <span>University Capstone Project System</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
