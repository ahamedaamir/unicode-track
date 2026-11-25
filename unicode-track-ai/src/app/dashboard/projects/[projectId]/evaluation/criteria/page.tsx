"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Sliders,
  Check,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RubricCriterion, DEFAULT_ACADEMIC_RUBRIC_CRITERIA, EvaluationRubric } from "@/types/evaluation";

function RubricBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const { projects, courses, getRubricForProject, saveRubric, showToast } = useAdminData();

  const project = projects.find((p) => p.id === projectId);
  const course = project ? courses.find((c) => c.code === project.courseCode) : null;

  // Existing or default rubric
  const initialRubric = getRubricForProject(projectId);

  const [rubricTitle, setRubricTitle] = useState(initialRubric.title);
  const [rubricDescription, setRubricDescription] = useState(
    initialRubric.description || "Academic Capstone Project Evaluation Rubric"
  );
  const [criteria, setCriteria] = useState<RubricCriterion[]>(initialRubric.criteria);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate total marks dynamically
  const totalMaxMarks = criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);
  const isValidTotal = totalMaxMarks === 100;

  // Add new criterion
  const handleAddCriterion = () => {
    const newCrit: RubricCriterion = {
      id: `crit-${Date.now()}`,
      name: "New Evaluation Criterion",
      description: "Description of what this criterion assesses in the student codebase.",
      maxMarks: 10,
      evaluationInstructions: "Check code correctness, boundary logic, and documentation standards.",
      orderIndex: criteria.length,
    };
    setCriteria([...criteria, newCrit]);
  };

  // Update criterion field
  const handleUpdateCriterion = (index: number, updates: Partial<RubricCriterion>) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], ...updates };
    setCriteria(updated);
  };

  // Delete criterion
  const handleDeleteCriterion = (index: number) => {
    if (criteria.length <= 1) {
      showToast("A rubric must contain at least one evaluation criterion.", "error");
      return;
    }
    const updated = criteria.filter((_, idx) => idx !== index);
    setCriteria(updated);
  };

  // Reset to default academic criteria
  const handleResetToDefault = () => {
    setCriteria([...DEFAULT_ACADEMIC_RUBRIC_CRITERIA]);
    setRubricTitle("Standard Academic Capstone Evaluation Rubric");
    showToast("Reset rubric to standard 100-mark university template.", "info");
  };

  // Save rubric
  const handleSaveRubric = () => {
    if (!rubricTitle.trim()) {
      showToast("Please provide a rubric title.", "error");
      return;
    }

    if (criteria.length === 0) {
      showToast("Cannot save empty rubric. Please add at least one criterion.", "error");
      return;
    }

    for (const c of criteria) {
      if (!c.name.trim()) {
        showToast("All criteria must have a valid name.", "error");
        return;
      }
      if (Number(c.maxMarks) <= 0) {
        showToast(`Criterion "${c.name}" must have max marks greater than 0.`, "error");
        return;
      }
    }

    setIsSaving(true);
    const updatedRubric: EvaluationRubric = {
      id: initialRubric.id || `rubric-${projectId}`,
      projectId,
      title: rubricTitle,
      description: rubricDescription,
      totalMarks: totalMaxMarks,
      criteria,
      isActive: true,
      createdAt: initialRubric.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveRubric(projectId, updatedRubric);
    setIsSaving(false);
  };

  if (!project) {
    return (
      <div className="bg-card rounded-[16px] border border-border p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          The requested project could not be located in academic records.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            <Link href="/dashboard/projects" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Projects
            </Link>
            <span>/</span>
            <span className="text-muted-foreground">{project.title}</span>
            <span>/</span>
            <span className="text-foreground">Evaluation Rubric</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Sliders className="w-7 h-7 text-teal-600" />
            Project Evaluation Rubric Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure weighted academic evaluation criteria and Gemini AI review instructions for{" "}
            <span className="font-semibold text-foreground">{project.courseCode}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            className="flex items-center gap-2 border-border text-foreground hover:bg-muted"
          >
            <RotateCcw className="w-4 h-4" /> Reset Default
          </Button>
          <Button
            onClick={handleSaveRubric}
            disabled={isSaving}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Rubric"}
          </Button>
        </div>
      </div>

      {/* Rubric Overview Card & Total Score Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-[16px] border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Rubric Metadata
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Rubric Title</label>
              <input
                type="text"
                value={rubricTitle}
                onChange={(e) => setRubricTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm font-medium text-foreground focus:bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="e.g. CS492 Capstone Evaluation Rubric"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Description / Notes</label>
              <textarea
                value={rubricDescription}
                onChange={(e) => setRubricDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground focus:bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                placeholder="Pedagogical objectives and grading guidelines for evaluators..."
              />
            </div>
          </div>
        </div>

        {/* Total Score & Validation Summary Card */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Total Maximum Marks</h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${isValidTotal ? "text-teal-600" : "text-amber-600"}`}>
                {totalMaxMarks}
              </span>
              <span className="text-muted-foreground font-medium">/ 100 Marks</span>
            </div>

            <div className="mt-4">
              {isValidTotal ? (
                <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Rubric is balanced at exactly 100 maximum marks. Ready for Gemini AI code review.
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Current sum is <strong>{totalMaxMarks}</strong>. Standard university rubrics should total 100 marks.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Criteria Count: <strong>{criteria.length}</strong></span>
            <span>Course: <strong>{project.courseCode}</strong></span>
          </div>
        </div>
      </div>

      {/* Criteria List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Evaluation Criteria ({criteria.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Each criterion defines max marks and evaluation instructions that Gemini AI analyzes in repository code.
            </p>
          </div>
          <Button
            onClick={handleAddCriterion}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Criterion
          </Button>
        </div>

        <div className="space-y-4">
          {criteria.map((criterion, index) => (
            <div
              key={criterion.id || index}
              className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:border-border transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => handleUpdateCriterion(index, { name: e.target.value })}
                    className="font-bold text-foreground text-base bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none px-1 py-0.5"
                    placeholder="Criterion Name"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Max Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={criterion.maxMarks}
                      onChange={(e) =>
                        handleUpdateCriterion(index, { maxMarks: parseInt(e.target.value) || 0 })
                      }
                      className="w-20 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm font-bold text-teal-700 text-center focus:bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    />
                  </div>

                  <button
                    onClick={() => handleDeleteCriterion(index)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Pedagogical Description
                  </label>
                  <textarea
                    rows={2}
                    value={criterion.description}
                    onChange={(e) => handleUpdateCriterion(index, { description: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground focus:bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                    placeholder="Explain what academic skills or components this assesses..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    AI Evaluation & Code Review Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={criterion.evaluationInstructions}
                    onChange={(e) =>
                      handleUpdateCriterion(index, { evaluationInstructions: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground focus:bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                    placeholder="Specific instructions telling Gemini what functions, checks, or files to inspect..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-[16px] border border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Changes will apply to all upcoming AI evaluations for this project cohort.
          </div>
          <Button
            onClick={handleSaveRubric}
            disabled={isSaving}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Rubric Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RubricBuilderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground font-medium">Loading Rubric Builder...</div>}>
      <RubricBuilderContent />
    </Suspense>
  );
}

