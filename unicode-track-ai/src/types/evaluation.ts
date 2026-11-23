/**
-- UniCodeTrack AI: Academic Rubric & AI Evaluation Types
-- Supports multi-criterion rubrics, Gemini code critique, versioning, and lecturer overrides
*/

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxMarks: number;
  evaluationInstructions: string;
  orderIndex: number;
}

export interface EvaluationRubric {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  totalMarks: number;
  criteria: RubricCriterion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationEvidence {
  file: string;
  functionName?: string;
  lineRange?: string;
  commitRef?: string;
  snippet?: string;
}

export interface CriterionEvaluationScore {
  id: string;
  criterionId: string;
  criterionName: string;
  maxMarks: number;
  aiScore: number;
  lecturerScore?: number;
  finalScore: number;
  percentage: number;
  explanation: string;
  evidence: EvaluationEvidence[];
  suggestions: string[];
}

export interface RequirementCoverageItem {
  requirement: string;
  status: "Implemented" | "Partial" | "Missing" | "Unable to verify";
  explanation: string;
}

export type EvaluationStatus =
  | "not_evaluated"
  | "ai_completed"
  | "in_review"
  | "approved"
  | "published";

export interface ProjectEvaluation {
  id: string;
  projectId: string;
  groupId: string;
  groupNumber?: number;
  groupName?: string;
  lecturerId?: string;
  lecturerName?: string;
  rubricId: string;
  rubricTitle?: string;
  version: number;
  commitSha: string;
  repoUrl: string;
  status: EvaluationStatus;
  totalScore: number;
  maxScore: number;
  percentage: number;
  aiModel: string;
  summary: string;
  gitTelemetryAnalysis?: string;
  criterionScores: CriterionEvaluationScore[];
  requirementsCoverage: RequirementCoverageItem[];
  generalSuggestions: string[];
  lecturerComments?: string;
  evaluatedAt: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Standard Academic Default Rubric
 */
export const DEFAULT_ACADEMIC_RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    id: "crit-1",
    name: "Problem-solving and Algorithm Design",
    description: "Evaluates algorithm logic, problem breakdown, efficiency, and computational correctness.",
    maxMarks: 20,
    evaluationInstructions: "Check whether algorithm flows handle edge cases, circular queues, or data structures with minimal computational overhead.",
    orderIndex: 0,
  },
  {
    id: "crit-2",
    name: "Code Correctness and Execution",
    description: "Evaluates syntax, compilation clean status, pointer safety, and runtime bug freedom.",
    maxMarks: 20,
    evaluationInstructions: "Verify that all functions return expected values, pointers are null-checked, and buffer overflows are guarded.",
    orderIndex: 1,
  },
  {
    id: "crit-3",
    name: "Code Quality and Readability",
    description: "Evaluates variable naming, modular structure, function encapsulation, and formatting conventions.",
    maxMarks: 15,
    evaluationInstructions: "Inspect header separation, standard indentation, meaningful variable identifiers, and DRY principle adherence.",
    orderIndex: 2,
  },
  {
    id: "crit-4",
    name: "Data Structures and Logic",
    description: "Appropriateness of structs, circular buffers, arrays, and memory organization.",
    maxMarks: 15,
    evaluationInstructions: "Ensure struct layout is clean, queue boundaries are respected, and data fields have appropriate types.",
    orderIndex: 3,
  },
  {
    id: "crit-5",
    name: "Error Handling and Boundary Checks",
    description: "Validation of inputs, return code checking, buffer full/empty detection, and anomaly alerts.",
    maxMarks: 10,
    evaluationInstructions: "Check return code propagation, defensive programming practices, and boundary boundary protections.",
    orderIndex: 4,
  },
  {
    id: "crit-6",
    name: "Project Requirements Coverage",
    description: "Degree to which mandatory features outlined in the project specification PDF are fulfilled.",
    maxMarks: 10,
    evaluationInstructions: "Compare declared requirements against actual implemented functions in the codebase.",
    orderIndex: 5,
  },
  {
    id: "crit-7",
    name: "GitHub Development Activity",
    description: "Consistent commit patterns, meaningful commit messages, branch workflows, and team collaboration.",
    maxMarks: 5,
    evaluationInstructions: "Review commit chronology, branching hygiene, and collaborative participation across the development cycle.",
    orderIndex: 6,
  },
  {
    id: "crit-8",
    name: "Documentation and Comments",
    description: "Inline comments, function docstrings, README instructions, and architectural overviews.",
    maxMarks: 5,
    evaluationInstructions: "Inspect file header docblocks, Makefile build steps, and clear setup guidance in README.md.",
    orderIndex: 7,
  },
];
