"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  UserCheck, 
  Check, 
  Info,
  ShieldCheck
} from "lucide-react";

export function EvaluationPreview() {
  const [selectedRubric, setSelectedRubric] = useState<number>(0);

  const rubrics = [
    {
      id: 0,
      title: "Code Architecture & System Design",
      score: "28 / 30",
      percentage: 93,
      aiFeedback:
        "High degree of modularity. Distinct separation between sensor telemetry ingestion and navigation decision loop. Repository shows consistent design pattern adhering to clean code guidelines.",
      keyObservation: "Clean repository structure, 0 circular dependencies detected.",
      lecturerNote: "Excellent pattern choice. Ensure memory consumption is verified in milestone 4.",
    },
    {
      id: 1,
      title: "Test Coverage & Fault Tolerance",
      score: "23 / 25",
      percentage: 92,
      aiFeedback:
        "Unit test coverage is currently 88.4% across core flight modules. Edge case handling for signal degradation is well-simulated in automated CI/CD pipeline.",
      keyObservation: "24 automated test suites passing on pull requests.",
      lecturerNote: "Consider adding integration tests for intermittent packet loss scenarios.",
    },
    {
      id: 2,
      title: "Milestone Deliverables & Requirements",
      score: "20 / 20",
      percentage: 100,
      aiFeedback:
        "All requirements specified for Sprint 3 have been fulfilled ahead of schedule with associated proof-of-concept video and architecture diagram.",
      keyObservation: "Full compliance with academic rubric specifications.",
      lecturerNote: "All deliverables verified and accepted.",
    },
    {
      id: 3,
      title: "GitHub Contribution & Team Balance",
      score: "21 / 25",
      percentage: 84,
      aiFeedback:
        "Commit distribution is balanced across all four team members with clear PR peer reviews. Documentation in README and API schemas is up to date.",
      keyObservation: "Healthy commit cadence with descriptive commit messages.",
      lecturerNote: "Good collaborative team dynamic observed.",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#0B1220] to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              AI Evaluation Workspace
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mt-1 text-white">
            Milestone 3 Rubric Evaluation: Autonomous Drone Navigation
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Evaluated against: <span className="text-teal-300 font-mono">ABET-CS-2026-Rubric-v2</span>
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl">
          <span className="text-xs text-slate-400">Total Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">92</span>
            <span className="text-xs text-teal-400 font-medium">/ 100</span>
          </div>
        </div>
      </div>

      {/* Main Rubric & Feedback Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left Side: Rubric Category Selector (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-slate-600">
              Evaluation Rubrics (4/4 Complete)
            </span>
            <span>Weight</span>
          </div>

          <div className="space-y-2.5">
            {rubrics.map((rubric) => {
              const isSelected = selectedRubric === rubric.id;
              return (
                <button
                  key={rubric.id}
                  onClick={() => setSelectedRubric(rubric.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-900">{rubric.title}</span>
                    <span className="font-mono font-bold text-teal-700">{rubric.score}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#14B8A6] h-full rounded-full transition-all"
                      style={{ width: `${rubric.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> AI Analysis Ready
                    </span>
                    <span className="text-slate-500">{rubric.percentage}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <div className="p-3 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between text-xs">
              <span className="text-slate-600">Evaluation Progress</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Generated
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed AI Feedback & Lecturer Approval (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-5 bg-white">
          {/* Active Category Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Detailed Category Breakdown
              </span>
              <h4 className="text-base font-bold text-[#0B1220] mt-0.5">
                {rubrics[selectedRubric].title}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Criterion Score</span>
              <span className="text-lg font-bold text-[#14B8A6]">
                {rubrics[selectedRubric].score}
              </span>
            </div>
          </div>

          {/* AI-Generated Feedback Box */}
          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100/90 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                AI Synthesis & Observations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {rubrics[selectedRubric].aiFeedback}
            </p>
            <div className="pt-2 border-t border-teal-100 flex items-center gap-1.5 text-xs text-teal-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Evidence: {rubrics[selectedRubric].keyObservation}</span>
            </div>
          </div>

          {/* Lecturer Review & Approval Panel */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supervisor Review
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Approved with Comments
              </span>
            </div>

            <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
              <div className="font-semibold text-slate-800 mb-0.5">Dr. Evelyn Reed (Dept. Head):</div>
              <p className="italic text-slate-600">
                &ldquo;{rubrics[selectedRubric].lecturerNote}&rdquo;
              </p>
            </div>
          </div>

          {/* Mandatory Academic Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-800">Academic Integrity Notice:</strong> AI provides evaluation insights. Final academic decisions remain with lecturers and judges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
