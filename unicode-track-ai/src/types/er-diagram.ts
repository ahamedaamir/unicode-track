import { z } from "zod";

export interface ERDiagramRubricCriterion {
  id: string;
  name: string;
  maxMarks: number;
  description: string;
  orderIndex?: number;
}

export interface ProjectDatabaseDesignConfig {
  enabled: boolean;
  isRequired: boolean;
  deadline?: string;
  expectedDesignDescription?: string;
  referenceDiagramUrl?: string;
  referenceDiagramName?: string;
  expectedEntities?: string[];
  expectedRelationships?: string[];
  expectedConstraints?: string[];
  rubricCriteria: ERDiagramRubricCriterion[];
}

export type ERIssueSeverity = "Critical" | "Major" | "Minor" | "Suggestion";
export type ERIssueCategory = "entities" | "keys" | "relationships" | "normalization" | "sql_implementation";
export type ERIssueStatus =
  | "Definitely incorrect"
  | "Potentially incorrect"
  | "Missing or incomplete"
  | "Cannot determine from diagram";

export interface ERDiagramIssue {
  id: string;
  title: string;
  severity: ERIssueSeverity;
  category: ERIssueCategory;
  explanation: string;
  expectedCorrection: string;
  relatedElement?: string;
  relevantCodeFile?: string;
  codeLineRange?: string;
  confidenceLevel: "High" | "Medium" | "Low";
  status: ERIssueStatus;
}

export interface ERCriterionEvaluation {
  criterionId: string;
  criterionName: string;
  maxMarks: number;
  suggestedMarks: number;
  lecturerMarks?: number;
  finalMarks: number;
  explanation: string;
  supportingEvidence: string;
  identifiedProblems: string[];
}

export interface ERDiagramAIAnalysis {
  id: string;
  submissionId: string;
  version: number;
  analyzedAt: string;
  aiModel: string;
  overallCorrectnessScore: number; // 0 - 100
  completenessScore: number; // 0 - 100
  implementationConsistencyScore: number; // 0 - 100
  totalSuggestedScore: number; // 0 - 100
  maxMarks: number;
  summary: string;
  missingEntities: string[];
  missingAttributes: string[];
  incorrectKeys: string[];
  cardinalityProblems: string[];
  normalizationConcerns: string[];
  sqlImplementationDiscrepancies: string[];
  issues: ERDiagramIssue[];
  criterionEvaluations: ERCriterionEvaluation[];
  recommendations: string[];
  repositoryCommitSha?: string;
  sqlSchemaVerified: boolean;
  sqlVerificationNote?: string;
}

export interface ERLecturerFeedback {
  id: string;
  lecturerName: string;
  reviewedAt: string;
  approvedMarks: number;
  status: "draft" | "approved" | "resubmission_requested" | "published";
  generalComments: string;
  criterionAdjustedMarks?: Record<string, number>;
  allowStudentAIFeedbackView: boolean;
  isPublished: boolean;
  publishedAt?: string;
}

export interface ERDiagramSubmission {
  id: string;
  projectId: string;
  groupId: string;
  groupNumber?: number;
  groupName?: string;
  submittedById?: string;
  submittedByName: string;
  submittedByEmail: string;
  fileName: string;
  fileSize: string;
  fileType: "pdf" | "png" | "jpg" | "jpeg";
  storagePath?: string;
  fileUrl: string;
  version: number;
  versionNote?: string;
  status: "submitted" | "analyzing" | "reviewed" | "approved" | "resubmission_requested" | "published";
  submittedAt: string;
  aiAnalysis?: ERDiagramAIAnalysis;
  lecturerFeedback?: ERLecturerFeedback;
}

/**
 * Standard Default Rubric for Database & ER Diagram Assessment (Sum = 100)
 */
export const DEFAULT_ER_DIAGRAM_RUBRIC: ERDiagramRubricCriterion[] = [
  {
    id: "er-crit-1",
    name: "ER Diagram Completeness",
    maxMarks: 15,
    description: "Evaluates whether all problem domain entities, attributes, and associations are captured in the diagram.",
  },
  {
    id: "er-crit-2",
    name: "Entity and Attribute Correctness",
    maxMarks: 15,
    description: "Evaluates appropriate entity boundaries, non-redundant naming, and atomic attribute typing.",
  },
  {
    id: "er-crit-3",
    name: "Primary and Foreign Key Correctness",
    maxMarks: 15,
    description: "Validation of surrogate/natural primary keys, foreign key pairings, and referential integrity definitions.",
  },
  {
    id: "er-crit-4",
    name: "Relationship and Cardinality Correctness",
    maxMarks: 15,
    description: "Correct representation of 1:1, 1:N, M:N cardinalities and associative bridge entities.",
  },
  {
    id: "er-crit-5",
    name: "Normalization and Redundancy",
    maxMarks: 10,
    description: "Inspection for 1NF/2NF/3NF compliance, avoiding transitive dependencies and repeating groups.",
  },
  {
    id: "er-crit-6",
    name: "ER Diagram to SQL/Code Consistency",
    maxMarks: 20,
    description: "Verifies whether CREATE TABLE schema, migrations, or ORM models in GitHub mirror the ER diagram.",
  },
  {
    id: "er-crit-7",
    name: "Database Implementation Quality",
    maxMarks: 10,
    description: "Inspects database constraints, index definitions, foreign key cascade rules, and query safety.",
  },
];

/**
 * Zod Schema for Validating Gemini AI ER Diagram Analysis Output
 */
export const erDiagramAnalysisResponseSchema = z.object({
  summary: z.string(),
  overallCorrectnessScore: z.number().min(0).max(100),
  completenessScore: z.number().min(0).max(100),
  implementationConsistencyScore: z.number().min(0).max(100),
  missingEntities: z.array(z.string()).default([]),
  missingAttributes: z.array(z.string()).default([]),
  incorrectKeys: z.array(z.string()).default([]),
  cardinalityProblems: z.array(z.string()).default([]),
  normalizationConcerns: z.array(z.string()).default([]),
  sqlImplementationDiscrepancies: z.array(z.string()).default([]),
  issues: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(["Critical", "Major", "Minor", "Suggestion"]),
      category: z.enum(["entities", "keys", "relationships", "normalization", "sql_implementation"]),
      explanation: z.string(),
      expectedCorrection: z.string(),
      relatedElement: z.string().optional(),
      relevantCodeFile: z.string().optional(),
      codeLineRange: z.string().optional(),
      confidenceLevel: z.enum(["High", "Medium", "Low"]),
      status: z.enum([
        "Definitely incorrect",
        "Potentially incorrect",
        "Missing or incomplete",
        "Cannot determine from diagram",
      ]),
    })
  ).default([]),
  criterionEvaluations: z.array(
    z.object({
      criterionId: z.string(),
      criterionName: z.string(),
      suggestedMarks: z.number().min(0),
      explanation: z.string(),
      supportingEvidence: z.string().default(""),
      identifiedProblems: z.array(z.string()).default([]),
    })
  ).default([]),
  recommendations: z.array(z.string()).default([]),
  sqlSchemaVerified: z.boolean().default(false),
  sqlVerificationNote: z.string().optional(),
});

export type ERDiagramAnalysisResponse = z.infer<typeof erDiagramAnalysisResponseSchema>;
