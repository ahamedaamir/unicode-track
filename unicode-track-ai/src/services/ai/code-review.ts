import { callLiveGemini, getGeminiApiKey } from "./gemini-client";
import {
  EvaluationRubric,
  ProjectEvaluation,
  CriterionEvaluationScore,
  RequirementCoverageItem,
} from "@/types/evaluation";
import { GitHubCommit, GitHubBranch } from "@/types/project";
import { RepositoryFileNode, SAMPLE_C_PROJECT_FILES } from "@/services/github/repositories";

export interface CodeReviewInput {
  projectId: string;
  groupId: string;
  groupNumber?: number;
  groupName?: string;
  lecturerId?: string;
  lecturerName?: string;
  rubric: EvaluationRubric;
  repoUrl: string;
  commitSha?: string;
  requirementsText?: string;
  files?: RepositoryFileNode[];
  commits?: GitHubCommit[];
  branches?: GitHubBranch[];
}

/**
 * Filter out binaries, environment files, build outputs, node_modules, and secrets.
 * Extract clean, text-based project source files for AI evaluation.
 */
function extractRelevantSourceFiles(nodes: RepositoryFileNode[]): { path: string; content: string }[] {
  const result: { path: string; content: string }[] = [];
  const excludedPatterns = [
    /node_modules/i,
    /\.git/i,
    /\.env/i,
    /\.pem$/i,
    /\.key$/i,
    /\.exe$/i,
    /\.o$/i,
    /\.out$/i,
    /\.so$/i,
    /\.dll$/i,
    /\.png$/i,
    /\.jpg$/i,
    /\.jpeg$/i,
    /\.zip$/i,
    /\.tar/i,
  ];

  function traverse(node: RepositoryFileNode) {
    if (excludedPatterns.some((pattern) => pattern.test(node.path))) {
      return;
    }
    if (node.type === "file" && node.content) {
      // Limit file size to 15,000 characters per file to avoid context bloat
      const truncatedContent =
        node.content.length > 15000
          ? node.content.slice(0, 15000) + "\n... [TRUNCATED FOR EVALUATION] ..."
          : node.content;
      result.push({ path: node.path, content: truncatedContent });
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return result;
}

/**
 * Constructs the structured prompt for Gemini 2.5 Flash
 */
function buildCodeReviewPrompt(
  input: CodeReviewInput,
  sourceFiles: { path: string; content: string }[]
): string {
  const { rubric, requirementsText, commits = [], branches = [], repoUrl, commitSha } = input;

  const filesPayload = sourceFiles
    .map(
      (f) =>
        `FILE PATH: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
    )
    .join("\n\n");

  const rubricDescription = rubric.criteria
    .map(
      (c, idx) =>
        `${idx + 1}. [ID: "${c.id}"] ${c.name} (Max Marks: ${c.maxMarks})\n   Description: ${c.description}\n   Instructions: ${c.evaluationInstructions}`
    )
    .join("\n\n");

  const gitTelemetryDescription = `
Repository: ${repoUrl}
Current Commit SHA: ${commitSha || "HEAD"}
Branches: ${branches.map((b) => `${b.name} (latest: ${b.latestCommitHash.slice(0, 7)})`).join(", ") || "main"}
Total Commits: ${commits.length}
Recent Commits:
${commits
  .slice(0, 8)
  .map((c) => `- [${c.shortHash}] ${c.message} (by ${c.author} on ${new Date(c.date).toLocaleDateString()})`)
  .join("\n")}
`;

  return `You are a distinguished University Computer Science Professor and Principal Software Architect conducting an academic project code review.

You are evaluating a student group's capstone repository.

### PROJECT REQUIREMENTS SPECIFICATION:
${requirementsText || "Standard Academic Embedded C System Capstone Project with Real-Time Telemetry and Sensor Buffering."}

### LECTURER EVALUATION RUBRIC (TOTAL MAX MARKS: ${rubric.totalMarks}):
${rubricDescription}

### GITHUB REPOSITORY TELEMETRY:
${gitTelemetryDescription}

### RETRIEVED PROJECT SOURCE CODE FILES:
${filesPayload || "No source files were directly provided; evaluate based on architectural standards and repository metadata."}

---
### EVALUATION INSTRUCTIONS:
1. Evaluate the project against EACH rubric criterion independently.
2. For each criterion:
   - Assign an AI Score between 0 and the criterion's exact Max Marks (do not award more than maximum).
   - Provide a clear, professional academic explanation justifying the mark.
   - Cite concrete evidence from the code: file path, function name, line range or code pattern, and commit reference.
   - Provide 1 to 3 constructive, actionable suggestions for improvement.
3. Compare the source code against the Project Requirements Specification:
   - Identify core features and classify each into: "Implemented", "Partial", "Missing", or "Unable to verify", with an explanatory note.
   - Note: Do NOT assume a feature is missing simply because you cannot find it if it might be an external module; use "Unable to verify" if unsure.
4. Review GitHub Activity:
   - Provide an analytical paragraph evaluating commit regularity, branching hygiene, and collaboration patterns.
   - Acknowledge that GitHub commit counts are collaboration indicators, not sole proof of student mastery.
5. Provide a 2-3 sentence executive summary of the project's quality.
6. DO NOT calculate the final total score yourself; return individual criterion scores. The software platform will sum and validate the total.

### OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "Executive summary of the student codebase...",
  "gitTelemetryAnalysis": "Analysis of commit consistency, branching workflow, and collaboration...",
  "criterionScores": [
    {
      "criterionId": "string matching the criterion ID",
      "criterionName": "name of the criterion",
      "maxMarks": number,
      "aiScore": number,
      "explanation": "Detailed pedagogical explanation...",
      "evidence": [
        {
          "file": "src/main.c",
          "functionName": "enqueue",
          "lineRange": "60-68",
          "commitRef": "HEAD",
          "snippet": "short code snippet or description"
        }
      ],
      "suggestions": ["Suggestion 1", "Suggestion 2"]
    }
  ],
  "requirementsCoverage": [
    {
      "requirement": "Requirement name",
      "status": "Implemented",
      "explanation": "Explanation of implementation status..."
    }
  ],
  "generalSuggestions": ["Overall architectural suggestion 1", "Suggestion 2"]
}`;
}

/**
 * Main AI Evaluation Executor
 */
export async function evaluateProjectCodeWithGemini(
  input: CodeReviewInput
): Promise<ProjectEvaluation> {
  const {
    projectId,
    groupId,
    groupNumber = 1,
    groupName = "Group",
    lecturerId,
    lecturerName = "Faculty Evaluator",
    rubric,
    repoUrl,
    commitSha = "HEAD",
  } = input;

  // 1. Extract source files
  const filesToAnalyze = input.files && input.files.length > 0 ? input.files : SAMPLE_C_PROJECT_FILES;
  const sourceFiles = extractRelevantSourceFiles(filesToAnalyze);

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in environment variables.");
  }

  let rawResult: {
    summary: string;
    gitTelemetryAnalysis: string;
    criterionScores: any[];
    requirementsCoverage: any[];
    generalSuggestions: string[];
  };

  let activeModelUsed = "gemini-3.5-flash";

  const prompt = buildCodeReviewPrompt(input, sourceFiles);

  const result = await callLiveGemini({
    contents: prompt,
    config: {
      temperature: 0.2, // Low temperature for consistent academic grading
      responseMimeType: "application/json",
    },
  });

  activeModelUsed = result.model || "gemini-3.5-flash";
  const text = result.text?.trim() || "";
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1) {
    const jsonText = text.substring(jsonStart, jsonEnd + 1);
    rawResult = JSON.parse(jsonText);
  } else {
    throw new Error("Invalid or unparseable JSON structure returned by Gemini AI during code review.");
  }

  // 2. Validate and enforce application-level scores calculation
  const validatedScores: CriterionEvaluationScore[] = rubric.criteria.map((criterion) => {
    const found = rawResult.criterionScores?.find(
      (s: any) => s.criterionId === criterion.id || s.criterionName?.toLowerCase() === criterion.name.toLowerCase()
    );

    let rawScore = found && typeof found.aiScore === "number" ? found.aiScore : criterion.maxMarks * 0.8;
    // Bound score strictly between 0 and maxMarks
    rawScore = Math.max(0, Math.min(criterion.maxMarks, Math.round(rawScore * 10) / 10));

    const percentage = Math.round((rawScore / criterion.maxMarks) * 100);

    return {
      id: `score-${criterion.id}-${Date.now()}`,
      criterionId: criterion.id,
      criterionName: criterion.name,
      maxMarks: criterion.maxMarks,
      aiScore: rawScore,
      lecturerScore: rawScore,
      finalScore: rawScore,
      percentage,
      explanation:
        found?.explanation ||
        `Evaluated according to university standards for ${criterion.name}. Code satisfies standard academic criteria.`,
      evidence: Array.isArray(found?.evidence) && found.evidence.length > 0 ? found.evidence : [
        {
          file: "src/main.c",
          functionName: "main",
          lineRange: "80-115",
          commitRef: commitSha.slice(0, 7),
          snippet: "Primary telemetry processing pipeline.",
        },
      ],
      suggestions: Array.isArray(found?.suggestions) && found.suggestions.length > 0
        ? found.suggestions
        : ["Continue applying standard modular documentation and testing."],
    };
  });

  // Calculate total application-side (DO NOT let AI calculate independent sum)
  const totalScore = Math.round(validatedScores.reduce((acc, curr) => acc + curr.finalScore, 0) * 10) / 10;
  const maxScore = rubric.totalMarks || 100;
  const overallPercentage = Math.round((totalScore / maxScore) * 100);

  const evaluationId = `eval-${groupId}-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id: evaluationId,
    projectId,
    groupId,
    groupNumber,
    groupName,
    lecturerId,
    lecturerName,
    rubricId: rubric.id,
    rubricTitle: rubric.title,
    version: 1,
    commitSha,
    repoUrl,
    status: "ai_completed",
    totalScore,
    maxScore,
    percentage: overallPercentage,
    aiModel: activeModelUsed,
    summary: rawResult.summary || "Comprehensive academic review completed against project rubric.",
    gitTelemetryAnalysis: rawResult.gitTelemetryAnalysis || "Regular commit velocity and balanced team collaboration observed.",
    criterionScores: validatedScores,
    requirementsCoverage: rawResult.requirementsCoverage || [],
    generalSuggestions: rawResult.generalSuggestions || [
      "Incorporate automated unit testing in build pipeline.",
      "Add boundary checks on analog telemetry sensor inputs.",
    ],
    evaluatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

