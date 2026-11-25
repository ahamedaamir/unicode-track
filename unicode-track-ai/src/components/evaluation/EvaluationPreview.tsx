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
    <div className="rounded-[16px] border border-border bg-card shadow-xl overflow-hidden text-foreground">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-card border-b border-border text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent-soft text-accent border border-accent-border">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              AI Evaluation Workspace
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mt-1 text-foreground">
            Milestone 3 Rubric Evaluation: Autonomous Drone Navigation
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluated against: <span className="text-accent font-mono">ABET-CS-2026-Rubric-v2</span>
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between bg-muted border border-border px-4 py-2.5 rounded-[10px]">
          <span className="text-xs text-muted-foreground">Total Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground font-mono tabular-nums">92</span>
            <span className="text-xs text-accent font-medium font-mono">/ 100</span>
          </div>
        </div>
      </div>

      {/* Main Rubric & Feedback Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Side: Rubric Category Selector (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className={`w-full text-left p-3.5 rounded-[10px] border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-muted border-accent ring-1 ring-accent"
                      : "bg-card border-border hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-foreground">{rubric.title}</span>
                    <span className="font-mono font-bold text-accent">{rubric.score}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all"
                      style={{ width: `${rubric.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                    <span className="flex items-center gap-1 text-accent font-medium">
                      <CheckCircle2 className="w-3 h-3" /> AI Analysis Ready
                    </span>
                    <span className="text-muted-foreground font-mono">{rubric.percentage}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <div className="p-3 bg-card rounded-[10px] border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Evaluation Progress</span>
              <span className="font-semibold text-accent flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Generated
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed AI Feedback & Lecturer Approval (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-5 bg-card">
          {/* Active Category Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                Detailed Category Breakdown
              </span>
              <h4 className="text-base font-bold text-foreground mt-0.5">
                {rubrics[selectedRubric].title}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Criterion Score</span>
              <span className="text-lg font-bold text-accent font-mono">
                {rubrics[selectedRubric].score}
              </span>
            </div>
          </div>

          {/* AI-Generated Feedback Box */}
          <div className="p-4 rounded-[10px] bg-accent-soft border border-accent-border space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                AI Synthesis & Observations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {rubrics[selectedRubric].aiFeedback}
            </p>
            <div className="pt-2 border-t border-accent-border flex items-center gap-1.5 text-xs text-accent font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Evidence: {rubrics[selectedRubric].keyObservation}</span>
            </div>
          </div>

          {/* Lecturer Review & Approval Panel */}
          <div className="p-4 rounded-[10px] bg-muted/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Supervisor Review
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-border text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Approved with Comments
              </span>
            </div>

            <div className="text-xs text-muted-foreground bg-card p-3 rounded-[10px] border border-border">
              <div className="font-semibold text-foreground mb-0.5">Dr. Evelyn Reed (Dept. Head):</div>
              <p className="italic text-muted-foreground">
                &ldquo;{rubrics[selectedRubric].lecturerNote}&rdquo;
              </p>
            </div>
          </div>

          {/* Mandatory Academic Disclaimer Banner */}
          <div className="p-3.5 rounded-[10px] bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-foreground">Academic Integrity Notice:</strong> AI provides evaluation insights. Final academic decisions remain with lecturers and judges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
