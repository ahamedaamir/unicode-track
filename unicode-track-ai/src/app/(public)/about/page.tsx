import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  ArrowRight, 
  FolderGit2, 
  BrainCircuit, 
  Trophy,
  ShieldCheck
} from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      title: "Verifiable Transparency",
      description:
        "Every line of student code and every pull request is transparently attributed, eliminating group project free-riding.",
      icon: <FolderGit2 className="w-5 h-5 text-teal-600" />,
    },
    {
      title: "AI as an Assistant, Not Authority",
      description:
        "Our AI synthesizes rubric compliance and flags code anomalies, but final academic grades and milestone sign-offs remain strictly with faculty.",
      icon: <BrainCircuit className="w-5 h-5 text-indigo-600" />,
    },
    {
      title: "Academic to Hackathon Synergy",
      description:
        "Classroom projects can seamlessly transition into competitive hackathon submissions, driving real-world university innovation.",
      icon: <Trophy className="w-5 h-5 text-amber-600" />,
    },
    {
      title: "Institutional Privacy & Rigor",
      description:
        "Engineered with academic confidentiality, ABET accreditation rubric alignment, and isolated university workspace tenants.",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0B1220]">
      <Navbar />

      <main className="flex-1">
        {/* Header Section */}
        <section className="py-16 sm:py-24 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="teal" size="md">
              About UniCodeTrack AI
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1220] tracking-tight">
              Bridging Classroom Projects and Hackathon Competitions
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              &ldquo;From classroom projects to hackathon competitions — build, track, and evaluate with AI.&rdquo;
            </p>
          </div>
        </section>

        {/* Mission Details */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-12 shadow-xs space-y-6">
            <h2 className="text-2xl font-bold text-[#0B1220]">
              The Challenge in Modern University Computing Education
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              University engineering and computer science programs rely heavily on group capstone projects and hackathons. However, professors often struggle with evaluating group dynamics, verifying individual contributions on GitHub, and grading against multi-dimensional rubrics at scale.
            </p>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              <strong>UniCodeTrack AI</strong> solves this by integrating milestone roadmaps, automated repository tracking, and rubric-driven AI evaluation assistance into one unified, intuitive platform designed specifically for higher education.
            </p>
          </div>

          {/* Core Pillars */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-[#0B1220] text-center mb-8">
              Our Core Architectural Pillars
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((v, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-4">
                    {v.icon}
                  </div>
                  <h4 className="text-base font-bold text-[#0B1220] mb-2">
                    {v.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-16 bg-[#0B1220] text-white p-8 rounded-2xl text-center space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold">
              Bring UniCodeTrack AI to Your Department
            </h3>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Join leading universities in modernizing capstone and hackathon project management.
            </p>
            <div className="pt-2">
              <Button
                href="/register"
                variant="primary"
                size="md"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
