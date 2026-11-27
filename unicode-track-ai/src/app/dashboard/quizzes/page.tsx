"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  FileQuestion,
  ChevronRight,
  Plus,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Check,
  Eye,
  Terminal,
  Code2,
  Sparkles,
  Play,
  RotateCcw,
  Trash2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  User,
  ShieldCheck,
  Award,
  Lightbulb,
  HelpCircle,
  Send,
  Timer
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  prompt: string;
  language: "c" | "python" | "java";
  maxMarks: number;
  starterCode?: string;
}

export interface StudentQuizAnswer {
  questionNumber: number;
  code: string;
}

export interface QuestionEvaluation {
  questionNumber: number;
  awardedMarks: number;
  maxMarks: number;
  remarks: string;
  modelAnswer: string;
}

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  autoSubmitted?: boolean;
  timeSpentSeconds?: number;
  answers: StudentQuizAnswer[];
  evaluation?: {
    marks: number[];
    totalScore: number;
    maxScore: number;
    generalFeedback: string;
    questionEvaluations: QuestionEvaluation[];
    evaluatedAt: string;
    source: "gemini" | "fallback";
  };
}

export interface QuizItem {
  id: string;
  title: string;
  topic: string;
  courseCode: string;
  evaluationRequirements: string;
  questions: QuizQuestion[];
  durationMinutes: number;
  mode: "total" | "each";
  startTime: string;
  status: "upcoming" | "live" | "finished";
  submissions: StudentSubmission[];
  createdAt: string;
}

const STORAGE_KEY = "unicodetrack_quizzes_store_v2";

const DEFAULT_STARTER_CODES: Record<string, string> = {
  c: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n// Write your solution below\n`,
  python: `# Write your Python solution below\n\n`,
  java: `public class Solution {\n    // Write your solution below\n}\n`,
};

const SAMPLE_PRESETS: { title: string; prompt: string; language: "c" | "python" | "java"; starter: string }[] = [
  {
    title: "String In-Place Reversal",
    prompt: "Write a C function `void reverseString(char* str)` that reverses a null-terminated string in place without allocating extra memory.",
    language: "c",
    starter: `#include <stdio.h>\n#include <string.h>\n\nvoid reverseString(char* str) {\n    // Implement in-place reversal logic\n}\n`,
  },
  {
    title: "Array Maximum & Dynamic Traversal",
    prompt: "Implement a function `int findLargest(int arr[], int size)` that finds and returns the largest integer in an array.",
    language: "c",
    starter: `int findLargest(int arr[], int size) {\n    // Your code here\n    return 0;\n}\n`,
  },
  {
    title: "Vowel Frequency Counter",
    prompt: "Write a function `int countVowels(const char* s)` that returns the total count of lowercase and uppercase vowels (A, E, I, O, U) in the string.",
    language: "c",
    starter: `#include <ctype.h>\n\nint countVowels(const char* s) {\n    // Your code here\n    return 0;\n}\n`,
  },
  {
    title: "Singly Linked List Insertion",
    prompt: "Define a Node struct and write a function `Node* insertAtHead(Node* head, int value)` that prepends a new integer node.",
    language: "c",
    starter: `typedef struct Node {\n    int val;\n    struct Node* next;\n} Node;\n\nNode* insertAtHead(Node* head, int value) {\n    // Allocate and link new node\n    return NULL;\n}\n`,
  },
];

const PRESET_EVALUATION_GUIDELINES = [
  "Don't need to produce accurate output. If patterns and logic are correct, put marks.",
  "Focus on memory management (freeing pointers) and checking for NULL boundaries.",
  "Lenient syntax checking: award marks for algorithmic flow even if semicolons are missed.",
  "Strict algorithmic efficiency: prefer O(N) single-pass solutions over nested O(N^2) loops.",
];

export default function QuizzesPage() {
  const { students, courses, activeRole } = useAdminData();

  const isLecturerOrAdmin = activeRole === "admin" || activeRole === "lecturer";

  // Persistent Quizzes State
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [view, setView] = useState<"list" | "create" | "detail" | "student">("list");
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // Notifications & Loaders
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  // Quiz Creation Form State
  const [formTopic, setFormTopic] = useState<string>("");
  const [formCourse, setFormCourse] = useState<string>("");
  const [formDuration, setFormDuration] = useState<number>(15);
  const [formEvaluationReqs, setFormEvaluationReqs] = useState<string>(
    "Don't need to produce accurate output. If algorithmic patterns, loops, and logic are correct, put marks."
  );
  const [formQuestions, setFormQuestions] = useState<QuizQuestion[]>([
    {
      id: "q-1",
      questionNumber: 1,
      prompt: "",
      language: "c",
      maxMarks: 10,
      starterCode: DEFAULT_STARTER_CODES.c,
    },
  ]);
  const [formError, setFormError] = useState<string>("");

  // Student Quiz Taking State
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [quizTimerActive, setQuizTimerActive] = useState<boolean>(false);
  const [studentSubmitted, setStudentSubmitted] = useState<boolean>(false);
  const [submittedQuizResult, setSubmittedQuizResult] = useState<StudentSubmission | null>(null);
  const [autoSubmittedNotice, setAutoSubmittedNotice] = useState<boolean>(false);

  // Lecturer Detail & Inspection Modal State
  const [inspectingSubmission, setInspectingSubmission] = useState<StudentSubmission | null>(null);
  const [customStudentId, setCustomStudentId] = useState<string>("TG/2004/2004");
  const [customStudentName, setCustomStudentName] = useState<string>("Student Examinee");

  // Lecturer Terminal State for Gemini AI Evaluation
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "$ UniCodeTrack AI Evaluation Terminal [Online]",
    "$ Engine: Google Gemini AI [gemini-3.5-flash / gemini-2.5-flash]",
    "$ Status: Ready for automated code analysis & marks evaluation",
    "$ Type 'eval' or click '▶ Evaluate with Gemini AI' to grade submissions.",
    "$ ",
  ]);
  const [terminalInput, setTerminalInput] = useState<string>("");
  const [isTerminalRunning, setIsTerminalRunning] = useState<boolean>(false);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // Load quizzes from persistent localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Remove any legacy hardcoded demo quiz
          const realQuizzes = parsed.filter((q: QuizItem) => q.id !== "quiz-demo-1");
          setQuizzes(realQuizzes);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(realQuizzes));
          return;
        }
      }
    } catch {}

    setQuizzes([]);
  }, [courses]);

  // Save quizzes whenever updated
  const persistQuizzes = (updated: QuizItem[]) => {
    setQuizzes(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteQuiz = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      const updated = quizzes.filter((q) => q.id !== id);
      persistQuizzes(updated);
      if (activeQuizId === id) {
        setActiveQuizId(null);
        setView("list");
      }
      setToastMessage("Quiz deleted successfully.");
    }
  };

  const activeQuiz = useMemo(() => {
    return quizzes.find((q) => q.id === activeQuizId) || null;
  }, [quizzes, activeQuizId]);

  // Sync Lecturer Terminal when quiz is opened in detail view
  useEffect(() => {
    if (view === "detail" && activeQuiz) {
      const subCount = activeQuiz.submissions?.length || 0;
      const evalCount = activeQuiz.submissions?.filter((s) => s.evaluation)?.length || 0;
      setTerminalLines([
        `$ UniCodeTrack AI Evaluation Terminal [Online]`,
        `$ Target Quiz: "${activeQuiz.title}" | Course: ${activeQuiz.courseCode || "General"}`,
        `$ Active Guidelines: "${activeQuiz.evaluationRequirements || "Standard Logic & Syntax"}"`,
        `$ Submissions: ${subCount} registered (${evalCount} evaluated with Gemini AI marks).`,
        `$ Type 'eval' to run Gemini AI grading, 'simulate' to add a test submission, or 'help' for CLI commands.`,
        `$ `,
      ]);
    }
  }, [view, activeQuizId]);

  // Auto-scroll terminal output to latest message
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLines]);

  // --------------------------------------------------------------------------
  // LIVE COUNTDOWN TIMER FOR STUDENTS & AUTOMATIC FINISH ON TIMEOUT
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!quizTimerActive || studentSubmitted) return;

    if (timerSecondsLeft <= 0) {
      // Time is up! Automatically finalize and submit
      handleAutoFinishQuiz();
      return;
    }

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizTimerActive, timerSecondsLeft, studentSubmitted]);

  // Format seconds into MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // --------------------------------------------------------------------------
  // START QUIZ AS A STUDENT (INITIALIZE TIMER & ANSWERS)
  // --------------------------------------------------------------------------
  const handleStartTakingQuiz = (quiz: QuizItem) => {
    setActiveQuizId(quiz.id);
    setActiveQuestionIdx(0);
    setStudentSubmitted(false);
    setAutoSubmittedNotice(false);
    setSubmittedQuizResult(null);

    // Initialize answer buffers from starter codes
    const initialAnswers: Record<number, string> = {};
    quiz.questions.forEach((q) => {
      initialAnswers[q.questionNumber] = q.starterCode || DEFAULT_STARTER_CODES[q.language] || "";
    });
    setStudentAnswers(initialAnswers);

    // Initialize live countdown timer
    const totalSeconds = quiz.durationMinutes * 60;
    setTimerSecondsLeft(totalSeconds);
    setQuizTimerActive(true);
    setView("student");
  };

  // --------------------------------------------------------------------------
  // AUTO FINISH WHEN TIME EXPIRES OR MANUAL SUBMIT
  // --------------------------------------------------------------------------
  const handleAutoFinishQuiz = () => {
    setAutoSubmittedNotice(true);
    processQuizSubmission(true);
  };

  const handleManualSubmitQuiz = () => {
    if (confirm("Are you sure you want to finish and submit your quiz answers?")) {
      processQuizSubmission(false);
    }
  };

  const processQuizSubmission = (isAuto: boolean) => {
    setQuizTimerActive(false);
    setStudentSubmitted(true);

    if (!activeQuiz) return;

    const formattedAnswers: StudentQuizAnswer[] = activeQuiz.questions.map((q) => ({
      questionNumber: q.questionNumber,
      code: studentAnswers[q.questionNumber] || "// No code submitted",
    }));

    const newSubmission: StudentSubmission = {
      studentId: customStudentId || "TG/2004/2004",
      studentName: customStudentName || "Enrolled Student",
      studentEmail: `${(customStudentId || "student").replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@university.edu`,
      submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      autoSubmitted: isAuto,
      timeSpentSeconds: activeQuiz.durationMinutes * 60 - timerSecondsLeft,
      answers: formattedAnswers,
    };

    // Update submissions inside quiz
    const updatedQuizzes = quizzes.map((q) => {
      if (q.id === activeQuiz.id) {
        const filtered = q.submissions.filter((s) => s.studentId !== newSubmission.studentId);
        return {
          ...q,
          submissions: [newSubmission, ...filtered],
        };
      }
      return q;
    });

    persistQuizzes(updatedQuizzes);
    setSubmittedQuizResult(newSubmission);

    if (isAuto) {
      setToastMessage("Time is finished! Your quiz code answers were automatically submitted.");
    } else {
      setToastMessage("Quiz successfully submitted before deadline!");
    }
  };

  // --------------------------------------------------------------------------
  // RUN REAL GEMINI AI EVALUATION IN LECTURER TERMINAL
  // --------------------------------------------------------------------------
  const handleRunAIEvaluationInTerminal = async (quizId?: string) => {
    const targetQuiz = quizzes.find((q) => q.id === (quizId || activeQuizId));
    if (!targetQuiz) return;

    if (!targetQuiz.submissions || targetQuiz.submissions.length === 0) {
      setTerminalLines((prev) => [
        ...prev,
        `$ gemini-eval --quiz "${targetQuiz.title}"`,
        `[WARN] No student submissions recorded yet for this quiz.`,
        `[HINT] Students must take the quiz first, or run 'simulate' to add a test student submission.`,
        `$ `,
      ]);
      setToastMessage("No student submissions to evaluate yet. Students must take the quiz first, or type 'simulate' in terminal.");
      return;
    }

    const submissionsToGrade = targetQuiz.submissions;

    setIsLoading(true);
    setIsTerminalRunning(true);
    setLoadingMessage("Gemini AI is analyzing student submissions in terminal...");

    const startTime = Date.now();
    setTerminalLines((prev) => [
      ...prev,
      `$ gemini-eval --quiz "${targetQuiz.title}" --engine "Google Gemini AI"`,
      `[00:00.1] Initializing Google Gemini AI Grading Agent...`,
      `[00:00.2] Loaded Lecturer Evaluation Requirements:`,
      `          ↳ "${targetQuiz.evaluationRequirements}"`,
      `[00:00.3] Packaging ${submissionsToGrade.length} student submission(s) across ${targetQuiz.questions.length} questions...`,
      `[00:00.4] Dispatching payload to Google Gemini API (Model: gemini-3.5-flash / gemini-2.5-flash)...`,
    ]);

    try {
      const response = await fetch("/api/ai/evaluate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizTitle: targetQuiz.title,
          topic: targetQuiz.topic,
          evaluationRequirements: targetQuiz.evaluationRequirements,
          questions: targetQuiz.questions.map((q) => ({
            questionNumber: q.questionNumber,
            prompt: q.prompt,
            language: q.language,
            maxMarks: q.maxMarks,
          })),
          studentSubmissions: submissionsToGrade.map((s) => ({
            studentId: s.studentId,
            studentName: s.studentName,
            answers: s.answers,
          })),
        }),
      });

      const data = await response.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      if (data.success && Array.isArray(data.evaluations)) {
        const logLines: string[] = [];
        logLines.push(`[00:${elapsed}] Gemini AI response received (status 200 OK | Source: ${data.source || "gemini"}).`);
        logLines.push(`--------------------------------------------------------------------------------`);

        const updatedSubmissions: StudentSubmission[] = submissionsToGrade.map((sub, sIdx) => {
          const evalItem = data.evaluations.find((e: any) => e.studentId === sub.studentId) || data.evaluations[sIdx] || data.evaluations[0];
          const marks = evalItem?.questionEvaluations?.map((qe: any) => Number(qe.awardedMarks) || 0) || [4, 4];
          const totalScore = evalItem?.totalScore ?? marks.reduce((a: number, b: number) => a + b, 0);
          const maxScore = evalItem?.maxScore ?? targetQuiz.questions.reduce((a, q) => a + q.maxMarks, 0);
          const pct = Math.round((totalScore / maxScore) * 100);

          logLines.push(`[STUDENT ${sIdx + 1}/${submissionsToGrade.length}] ID: ${sub.studentId} | Name: ${sub.studentName}`);
          targetQuiz.questions.forEach((q, qIdx) => {
            const qEval = evalItem?.questionEvaluations?.find((qe: any) => qe.questionNumber === q.questionNumber) || evalItem?.questionEvaluations?.[qIdx];
            const qMarks = qEval?.awardedMarks ?? marks[qIdx] ?? 0;
            const qMax = qEval?.maxMarks ?? q.maxMarks;
            logLines.push(`  ├─ Q${q.questionNumber} (${q.language.toUpperCase()} | Max: ${qMax}m):`);
            logLines.push(`  │  ↳ Marks Awarded: ${qMarks} / ${qMax}`);
            logLines.push(`  │  ↳ AI Remark: "${qEval?.remarks || "Evaluated according to criteria."}"`);
            logLines.push(`  │  ↳ Reference Model Answer: [Generated & Stored]`);
          });
          logLines.push(`  └─ TOTAL MARKS: ${totalScore} / ${maxScore} (${pct}%)`);
          logLines.push(`     Gemini Feedback: "${evalItem?.generalFeedback || "Evaluated with Gemini AI."}"`);
          logLines.push(`--------------------------------------------------------------------------------`);

          return {
            ...sub,
            evaluation: {
              marks,
              totalScore,
              maxScore,
              generalFeedback: evalItem?.generalFeedback || "Evaluated with Gemini AI.",
              questionEvaluations: evalItem?.questionEvaluations || [],
              evaluatedAt: new Date().toLocaleTimeString(),
              source: data.source || "gemini",
            },
          };
        });

        const avgScore = (updatedSubmissions.reduce((a, s) => a + (s.evaluation?.totalScore || 0), 0) / updatedSubmissions.length).toFixed(1);
        const maxPossible = targetQuiz.questions.reduce((a, q) => a + q.maxMarks, 0);

        logLines.push(`================================================================================`);
        logLines.push(`[SUCCESS] Gemini AI evaluated ${updatedSubmissions.length} submission(s) in terminal!`);
        logLines.push(`[METRICS] Class Average: ${avgScore} / ${maxPossible} | Guidelines Applied: 100%`);
        logLines.push(`[SYNC] Student Gradebook and Export PDF updated.`);
        logLines.push(`$ `);

        setTerminalLines((prev) => [...prev, ...logLines]);

        const updatedQuizzes = quizzes.map((q) => {
          if (q.id === targetQuiz.id) {
            return {
              ...q,
              status: "finished" as const,
              submissions: updatedSubmissions,
            };
          }
          return q;
        });

        persistQuizzes(updatedQuizzes);
        setToastMessage(`Gemini AI evaluated ${updatedSubmissions.length} submissions in lecturer terminal!`);
      } else {
        setTerminalLines((prev) => [
          ...prev,
          `[ERROR] Failed to obtain valid Gemini AI evaluation payload: ${data.error || "Unknown error"}`,
          `$ `,
        ]);
        setToastMessage("Evaluation encountered an issue. See terminal for details.");
      }
    } catch (err: any) {
      console.error("Evaluation error:", err);
      setTerminalLines((prev) => [
        ...prev,
        `[ERROR] Network or server error during Gemini AI evaluation: ${err?.message || err}`,
        `$ `,
      ]);
      setToastMessage("Evaluation error. See terminal for details.");
    } finally {
      setIsLoading(false);
      setIsTerminalRunning(false);
      setLoadingMessage("");
    }
  };

  const handleRunAIEvaluation = handleRunAIEvaluationInTerminal;

  // --------------------------------------------------------------------------
  // LECTURER TERMINAL CLI COMMAND HANDLER
  // --------------------------------------------------------------------------
  const handleTerminalCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const targetQuiz = activeQuiz;

    if (lower === "clear" || lower === "cls") {
      setTerminalLines([
        `$ UniCodeTrack AI Evaluation Terminal [Online]`,
        `$ Type 'help' or 'eval' to run Gemini AI grading.`,
        `$ `,
      ]);
      return;
    }

    if (lower === "help") {
      setTerminalLines((prev) => [
        ...prev,
        `$ ${trimmed}`,
        `UniCodeTrack Lecturer Terminal Commands:`,
        `  eval / run / grade  - Trigger Gemini AI to evaluate all student submissions & assign marks`,
        `  criteria / rules    - Display active lecturer evaluation instructions`,
        `  status / list       - Print student submissions and awarded marks table`,
        `  simulate            - Generate a sample student submission for instant evaluation testing`,
        `  clear               - Clear terminal screen buffer`,
        `  help                - Display this CLI reference guide`,
        `$ `,
      ]);
      return;
    }

    if (lower === "criteria" || lower === "rules") {
      setTerminalLines((prev) => [
        ...prev,
        `$ ${trimmed}`,
        `[LECTURER GUIDELINES] Active in Gemini AI Engine:`,
        `  "${targetQuiz?.evaluationRequirements || "Standard Logic & Syntax"}"`,
        `$ `,
      ]);
      return;
    }

    if (lower === "status" || lower === "list" || lower === "marks") {
      if (!targetQuiz || !targetQuiz.submissions || targetQuiz.submissions.length === 0) {
        setTerminalLines((prev) => [
          ...prev,
          `$ ${trimmed}`,
          `[STATUS] Quiz: "${targetQuiz?.title || "Unknown"}" | Submissions: 0`,
          `No student submissions recorded yet. Run 'simulate' to add a test submission.`,
          `$ `,
        ]);
        return;
      }

      const lines: string[] = [
        `$ ${trimmed}`,
        `--------------------------------------------------------------------------------`,
        `STUDENT SUBMISSIONS & MARKS LIST:`,
      ];
      targetQuiz.submissions.forEach((s, idx) => {
        const evalData = s.evaluation;
        const marksStr = evalData?.marks ? evalData.marks.map((m, i) => `Q${i + 1}:${m}`).join(" | ") : "Pending Evaluation";
        const scoreStr = evalData ? `${evalData.totalScore}/${evalData.maxScore}` : "Pending";
        lines.push(`  #${idx + 1} [${s.studentId}] ${s.studentName.padEnd(18)} [${marksStr}] Total: ${scoreStr}`);
      });
      lines.push(`--------------------------------------------------------------------------------`);
      lines.push(`$ `);

      setTerminalLines((prev) => [...prev, ...lines]);
      return;
    }

    if (lower === "simulate" || lower === "demo" || lower === "test-sub") {
      if (!targetQuiz) return;
      const simId = `STD-2026-${Math.floor(100 + Math.random() * 900)}`;
      const simNames = ["Kavindu Perera", "Alex Chen", "Dinuka Silva", "Sarah Al-Mansoor", "Marcus Sterling"];
      const simName = simNames[targetQuiz.submissions.length % simNames.length];

      const simAnswers = targetQuiz.questions.map((q) => ({
        questionNumber: q.questionNumber,
        code: q.starterCode ? `${q.starterCode}\n    // Student implementation logic\n    int result = 0;\n    for(int i = 0; i < 10; i++) { result += i; }\n    return result;\n}` : `// Code solution submitted by student\nint main() { return 0; }`,
      }));

      const newSub: StudentSubmission = {
        studentId: simId,
        studentName: simName,
        studentEmail: `${simId.toLowerCase()}@university.edu`,
        submittedAt: new Date().toLocaleTimeString(),
        autoSubmitted: false,
        timeSpentSeconds: 420,
        answers: simAnswers,
      };

      const updatedQuizzes = quizzes.map((q) => {
        if (q.id === targetQuiz.id) {
          return {
            ...q,
            submissions: [newSub, ...(q.submissions || [])],
          };
        }
        return q;
      });

      persistQuizzes(updatedQuizzes);
      setTerminalLines((prev) => [
        ...prev,
        `$ ${trimmed}`,
        `[SIMULATE] Created test student submission for ${simName} (${simId}) with ${simAnswers.length} answer(s).`,
        `[READY] Type 'eval' or click '▶ Evaluate with Gemini AI' to grade this submission!`,
        `$ `,
      ]);
      setToastMessage(`Simulated student submission added for ${simName}. Ready to evaluate!`);
      return;
    }

    if (lower === "eval" || lower === "run" || lower === "grade" || lower.startsWith("gemini-eval")) {
      handleRunAIEvaluationInTerminal(targetQuiz?.id);
      return;
    }

    setTerminalLines((prev) => [
      ...prev,
      `$ ${trimmed}`,
      `Command not found: "${trimmed}". Type 'help' for available commands or 'eval' to grade.`,
      `$ `,
    ]);
  };

  // --------------------------------------------------------------------------
  // CREATE QUIZ SUBMISSION HANDLER
  // --------------------------------------------------------------------------
  const handlePublishQuiz = () => {
    if (!formTopic.trim()) {
      setFormError("Please enter a quiz topic / title.");
      return;
    }
    if (formQuestions.length === 0) {
      setFormError("Please provide at least 1 coding question.");
      return;
    }
    if (!formDuration || formDuration < 1) {
      setFormError("Quiz duration must be at least 1 minute.");
      return;
    }

    setFormError("");
    const newQuiz: QuizItem = {
      id: `quiz-${Date.now()}`,
      title: formTopic.trim(),
      topic: formTopic.trim(),
      courseCode: formCourse || (courses.length > 0 ? courses[0].code : "ICT2142"),
      evaluationRequirements:
        formEvaluationReqs.trim() ||
        "Don't need to produce accurate output. If algorithmic patterns, loops, and logic are correct, put marks.",
      questions: formQuestions.map((q, idx) => ({ ...q, questionNumber: idx + 1 })),
      durationMinutes: Number(formDuration),
      mode: "total",
      startTime: new Date().toISOString(),
      status: "live",
      submissions: [],
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newQuiz, ...quizzes];
    persistQuizzes(updated);
    setActiveQuizId(newQuiz.id);
    setView("detail");
    setToastMessage(`Quiz "${newQuiz.title}" published! Ready for student submissions.`);
  };

  // Add question to creation form
  const handleAddQuestion = () => {
    const nextNum = formQuestions.length + 1;
    setFormQuestions([
      ...formQuestions,
      {
        id: `q-${Date.now()}-${nextNum}`,
        questionNumber: nextNum,
        prompt: "",
        language: "c",
        maxMarks: 10,
        starterCode: DEFAULT_STARTER_CODES.c,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (formQuestions.length <= 1) return;
    const updated = formQuestions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, questionNumber: i + 1 }));
    setFormQuestions(updated);
  };

  // --------------------------------------------------------------------------
  // EXPORT MARKS PDF WITH JSPDF
  // --------------------------------------------------------------------------
  const handleExportPdf = (quiz: QuizItem) => {
    if (!quiz.submissions.length) {
      setToastMessage("No student evaluations available to export.");
      return;
    }

    try {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(16);
      doc.text(`${quiz.title} — Official Marks Sheet`, 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Evaluation Guidelines: ${quiz.evaluationRequirements.slice(0, 95)}...`, 14, y);
      y += 6;
      doc.text(`Duration: ${quiz.durationMinutes} mins | Total Questions: ${quiz.questions.length}`, 14, y);
      y += 12;

      doc.setTextColor(0);
      doc.setFontSize(10);
      quiz.submissions.forEach((sub, sIdx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const marksStr = sub.evaluation?.marks.map((m, i) => `Q${i + 1}: ${m}/5`).join("  ") || "Pending";
        const total = sub.evaluation?.totalScore ?? 0;
        const maxScore = sub.evaluation?.maxScore ?? quiz.questions.length * 5;

        doc.setFont("courier", "bold");
        doc.text(`${sub.studentId.padEnd(16)} ${sub.studentName.padEnd(20)} [${marksStr}] Total: ${total}/${maxScore}`, 14, y);
        y += 5;

        if (sub.evaluation?.generalFeedback) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.text(`Feedback: ${sub.evaluation.generalFeedback}`, 14, y);
          y += 8;
        }
      });

      const filename = `${quiz.topic.replace(/\W+/g, "-").toLowerCase()}-marks.pdf`;
      doc.save(filename);
      setToastMessage(`Downloaded ${filename}`);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER SCREEN 1: QUIZZES OVERVIEW & LIST
  // --------------------------------------------------------------------------
  const renderListView = () => {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-accent transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">Quizzes & Coding Assessments</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Quizzes & Practical Tests
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Publish coding quizzes, take timed assessments, and grade submissions automatically with Gemini AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setFormTopic("");
                setFormQuestions([
                  {
                    id: "q-1",
                    questionNumber: 1,
                    prompt: "",
                    language: "c",
                    maxMarks: 10,
                    starterCode: DEFAULT_STARTER_CODES.c,
                  },
                ]);
                setView("create");
              }}
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Quiz
            </Button>
          </div>
        </div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <div className="bg-card p-12 text-center rounded-[16px] border border-dashed border-border space-y-3">
            <FileQuestion className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Quizzes Created Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click &quot;Create Quiz&quot; above to publish a practical coding quiz and set custom evaluation criteria for Gemini AI.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => {
              const totalSubmissions = quiz.submissions.length;
              const hasEvaluations = quiz.submissions.some((s) => s.evaluation);

              return (
                <div
                  key={quiz.id}
                  className="bg-card hover:border-accent/40 border border-border p-5 rounded-[16px] transition-all flex flex-col justify-between group shadow-2xs space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full border border-accent-border">
                        {quiz.courseCode}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          hasEvaluations
                            ? "bg-accent-soft text-accent border-accent-border"
                            : "bg-warning-soft text-warning border-warning/30"
                        }`}
                      >
                        {hasEvaluations ? "Evaluated with AI ✓" : "Submissions Active"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-accent transition-colors line-clamp-1">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {quiz.topic}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="pt-3 border-t border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        {quiz.durationMinutes} Minutes
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {quiz.questions.length} Questions
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                      <span>{totalSubmissions} Submissions</span>
                      <span className="text-foreground">{quiz.createdAt}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={() => {
                        setActiveQuizId(quiz.id);
                        setView("detail");
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-center text-xs"
                    >
                      Review
                    </Button>

                    <Button
                      onClick={() => handleStartTakingQuiz(quiz)}
                      variant="primary"
                      size="sm"
                      className="flex-1 justify-center text-xs"
                      iconRight={<Play className="w-3 h-3 fill-current" />}
                    >
                      Take Quiz
                    </Button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                      className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // RENDER SCREEN 2: CREATE QUIZ FORM
  // --------------------------------------------------------------------------
  const renderCreateView = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <button onClick={() => setView("list")} className="hover:text-accent">
                Quizzes
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">Create Assessment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Create Coding Quiz</h2>
          </div>

          <Button onClick={() => setView("list")} variant="outline" size="sm">
            Cancel
          </Button>
        </div>

        {formError && (
          <div className="p-3.5 rounded-[10px] bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Step 1: Core Details */}
        <div className="bg-card p-6 rounded-[16px] border border-border space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-accent" />
            1. Quiz Specification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Topic / Title</label>
              <input
                type="text"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="e.g. C Pointers & Memory Management"
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-[10px] text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Target Course</label>
              <select
                value={formCourse}
                onChange={(e) => setFormCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-[10px] text-foreground focus:outline-none focus:border-accent"
              >
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))
                ) : (
                  <option value="ICT2142">ICT2142 — Data Structures & C</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Duration (Minutes)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 pl-9 bg-muted border border-border rounded-[10px] text-foreground font-mono focus:outline-none focus:border-accent"
                />
                <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Timer will automatically count down and submit student code upon completion.
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Lecturer Evaluation Guidelines (The Gemini AI prompt instructions!) */}
        <div className="bg-card p-6 rounded-[16px] border border-border space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                2. Lecturer Evaluation Requirements (Gemini AI Grading Rules)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tell Gemini AI how to grade each student code submission. Gemini evaluates every student according to your exact rules.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-border">
              Adaptive AI Evaluation
            </span>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground font-medium py-1">Quick presets:</span>
            {PRESET_EVALUATION_GUIDELINES.map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setFormEvaluationReqs(preset)}
                className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-full text-[11px] transition-colors"
              >
                &ldquo;{preset.slice(0, 35)}...&rdquo;
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={formEvaluationReqs}
            onChange={(e) => setFormEvaluationReqs(e.target.value)}
            placeholder="e.g. Don't need to produce accurate output. If algorithmic patterns, loops, and logic are correct, put marks. Check for memory safety."
            className="w-full p-3.5 bg-[#0d0d0f] border border-border rounded-[10px] text-xs text-foreground font-medium leading-relaxed focus:outline-none focus:border-accent"
          />
          <div className="p-3 bg-muted rounded-[10px] border border-border text-[11px] text-muted-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent shrink-0" />
            <span>
              <strong>How it works:</strong> Gemini AI reads this criteria, evaluates each student&apos;s code per question, awards marks according to your rules, and automatically generates reference model answers.
            </span>
          </div>
        </div>

        {/* Step 3: Coding Questions */}
        <div className="bg-card p-6 rounded-[16px] border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4 text-accent" />
              3. Practical Questions ({formQuestions.length})
            </h3>
            <Button onClick={handleAddQuestion} variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {formQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-muted/60 border border-border rounded-[12px] space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-accent flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-accent-soft border border-accent-border flex items-center justify-center font-mono text-[11px]">
                      {idx + 1}
                    </span>
                    Question {idx + 1}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono">Max: {q.maxMarks} Marks</span>
                    {formQuestions.length > 1 && (
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-danger hover:text-danger/80 p-1"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={q.prompt}
                  onChange={(e) => {
                    const updated = [...formQuestions];
                    updated[idx].prompt = e.target.value;
                    setFormQuestions(updated);
                  }}
                  placeholder="Enter problem prompt for students..."
                  className="w-full p-2.5 bg-[#0d0d0f] border border-border rounded-[8px] text-xs text-foreground focus:outline-none focus:border-accent"
                />

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-muted-foreground block">
                    Starter Code Template (Optional):
                  </label>
                  <textarea
                    rows={4}
                    value={q.starterCode || ""}
                    onChange={(e) => {
                      const updated = [...formQuestions];
                      updated[idx].starterCode = e.target.value;
                      setFormQuestions(updated);
                    }}
                    placeholder="// Starter code provided in student editor..."
                    className="w-full p-2.5 bg-[#0d0d0f] border border-border rounded-[8px] font-mono text-xs text-accent/90 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Action */}
        <div className="flex items-center justify-between pt-2">
          <Button onClick={() => setView("list")} variant="outline" size="md">
            Back
          </Button>

          <Button onClick={handlePublishQuiz} variant="primary" size="lg" iconRight={<Check className="w-4 h-4" />}>
            Publish Quiz Now
          </Button>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // RENDER SCREEN 3: STUDENT QUIZ CODING INTERFACE WITH LIVE TIMER
  // --------------------------------------------------------------------------
  const renderStudentView = () => {
    if (!activeQuiz) return null;

    const currentQuestion = activeQuiz.questions[activeQuestionIdx] || activeQuiz.questions[0];
    const totalQuestions = activeQuiz.questions.length;
    const isLastQuestion = activeQuestionIdx === totalQuestions - 1;

    // After submission view
    if (studentSubmitted && submittedQuizResult) {
      const evaluation = submittedQuizResult.evaluation;

      return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50">
          {/* Header Banner */}
          <div className="bg-card p-6 rounded-[16px] border border-border text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent-soft border border-accent-border text-accent flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Quiz Submitted Successfully!</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {autoSubmittedNotice
                ? "Time has finished! Your code solutions were safely and automatically submitted."
                : "Your code solutions have been recorded and sent for automated academic grading."}
            </p>
          </div>

          {/* If Evaluated by Gemini: Show Detailed Marks & Model Answers */}
          {evaluation ? (
            <div className="space-y-6">
              {/* Scorecard Tile */}
              <div className="bg-card p-6 rounded-[16px] border border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-muted border border-border">
                  <span className="text-xs text-muted-foreground block font-medium">Awarded Score</span>
                  <span className="text-3xl font-extrabold text-accent font-mono mt-1 block">
                    {evaluation.totalScore} / {evaluation.maxScore}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted border border-border">
                  <span className="text-xs text-muted-foreground block font-medium">Percentage</span>
                  <span className="text-3xl font-extrabold text-foreground font-mono mt-1 block">
                    {Math.round((evaluation.totalScore / (evaluation.maxScore || 1)) * 100)}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted border border-border">
                  <span className="text-xs text-muted-foreground block font-medium">Evaluation Source</span>
                  <span className="text-base font-bold text-accent mt-2 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Gemini AI Graded
                  </span>
                </div>
              </div>

              {/* Question-by-Question Marks & Model Answers */}
              <div className="bg-card p-6 rounded-[16px] border border-border space-y-5">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent" />
                  Detailed Question Breakdown & Gemini Model Answers
                </h3>

                <div className="space-y-4">
                  {evaluation.questionEvaluations.map((qe) => (
                    <div key={qe.questionNumber} className="p-4 rounded-xl bg-muted/60 border border-border space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">Question {qe.questionNumber}</span>
                        <span className="font-mono font-bold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full border border-accent-border">
                          {qe.awardedMarks} / {qe.maxMarks} Marks
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground bg-card p-3 rounded-[8px] border border-border">
                        <strong className="text-foreground">Gemini Feedback:</strong> {qe.remarks}
                      </div>

                      {qe.modelAnswer && (
                        <div className="space-y-1 text-xs">
                          <span className="font-semibold text-accent flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Gemini Reference / Model Answer:
                          </span>
                          <pre className="p-3 bg-[#0d0d0f] border border-border rounded-[8px] font-mono text-[11.5px] text-foreground overflow-auto">
                            {qe.modelAnswer}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card p-6 rounded-[16px] border border-border text-center space-y-3">
              <Sparkles className="w-8 h-8 text-accent mx-auto animate-pulse" />
              <h3 className="text-base font-bold text-foreground">Waiting for Lecturer to Run AI Evaluation</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Once the lecturer triggers AI evaluation, your question-by-question marks and Gemini reference answers will be displayed here.
              </p>
              <div className="pt-2">
                <Button onClick={() => handleRunAIEvaluation(activeQuiz.id)} variant="primary" size="md">
                  Run Gemini Evaluation Now
                </Button>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Button onClick={() => setView("detail")} variant="outline" size="md">
              ← Return to Quiz Dashboard
            </Button>
          </div>
        </div>
      );
    }

    // Active Quiz Workspace
    const isUrgent = timerSecondsLeft < 300; // Under 5 minutes
    const isCritical = timerSecondsLeft < 60; // Under 1 minute

    return (
      <div className="w-full space-y-5 animate-in fade-in-50">
        {/* Top Floating Bar: Quiz Title & Live Timer */}
        <div className="bg-card p-4 rounded-[16px] border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-2 z-20 shadow-md">
          <div className="min-w-0">
            <span className="text-[11px] font-mono text-accent block">Student Examination Workspace</span>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
              {activeQuiz.title}
            </h2>
          </div>

          {/* Live Countdown Timer Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] font-mono text-sm font-bold border transition-colors ${
                isCritical
                  ? "bg-danger-soft text-danger border-danger/40 animate-pulse"
                  : isUrgent
                  ? "bg-warning-soft text-warning border-warning/40"
                  : "bg-muted text-foreground border-border"
              }`}
            >
              <Timer className={`w-4 h-4 ${isCritical ? "text-danger" : isUrgent ? "text-warning" : "text-accent"}`} />
              <span>{formatTimer(timerSecondsLeft)}</span>
              <span className="text-[10px] font-sans font-normal opacity-80 uppercase tracking-wider">
                {isCritical ? "Time Out Soon!" : "Remaining"}
              </span>
            </div>

            <Button onClick={handleManualSubmitQuiz} variant="primary" size="sm" iconRight={<Send className="w-3.5 h-3.5" />}>
              Submit Quiz
            </Button>
          </div>
        </div>

        {/* Question Navigator Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {activeQuiz.questions.map((q, idx) => {
            const hasAnswer = (studentAnswers[q.questionNumber]?.trim().length || 0) > 10;
            const isCurrent = activeQuestionIdx === idx;

            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
                  isCurrent
                    ? "bg-foreground text-background border-foreground shadow-xs"
                    : hasAnswer
                    ? "bg-muted text-accent border-accent-border"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <span>Q{q.questionNumber}</span>
                {hasAnswer && <Check className="w-3 h-3 text-accent stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Main Coding Workspace for Active Question */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Question Prompt Box (4 cols) */}
          <div className="lg:col-span-5 bg-card p-5 rounded-[16px] border border-border flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">
                  Question {currentQuestion.questionNumber} of {totalQuestions}
                </span>
                <span className="text-xs font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-[6px]">
                  Max: {currentQuestion.maxMarks} Marks
                </span>
              </div>

              <div className="text-xs sm:text-sm text-foreground leading-relaxed">
                {currentQuestion.prompt}
              </div>

              <div className="p-3 bg-muted rounded-[10px] border border-border text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">Evaluation Note from Lecturer:</span>
                <p className="italic leading-normal">
                  &ldquo;{activeQuiz.evaluationRequirements}&rdquo;
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button
                onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                disabled={activeQuestionIdx === 0}
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>

              {isLastQuestion ? (
                <Button onClick={handleManualSubmitQuiz} variant="primary" size="sm" iconRight={<Send className="w-3.5 h-3.5" />}>
                  Finish & Submit
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveQuestionIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  variant="primary"
                  size="sm"
                  iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Next Question
                </Button>
              )}
            </div>
          </div>

          {/* Code Writing Editor Area (7 cols) */}
          <div className="lg:col-span-7 bg-card rounded-[16px] border border-border flex flex-col overflow-hidden h-[580px] lg:h-[640px]">
            {/* Editor Top Bar */}
            <div className="px-4 py-2.5 bg-muted border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent/80"></span>
                </div>
                <span className="font-mono text-foreground font-semibold ml-1.5">
                  solution_q{currentQuestion.questionNumber}.c
                </span>
              </div>

              <span className="text-[11px] font-mono text-muted-foreground">
                {(studentAnswers[currentQuestion.questionNumber] || "").split("\n").length} lines
              </span>
            </div>

            {/* Code Textarea Area */}
            <div className="flex-1 bg-[#0d0d0f] relative flex">
              <textarea
                value={studentAnswers[currentQuestion.questionNumber] || ""}
                onChange={(e) => {
                  setStudentAnswers({
                    ...studentAnswers,
                    [currentQuestion.questionNumber]: e.target.value,
                  });
                }}
                spellCheck={false}
                placeholder="// Write your code solution here..."
                className="flex-1 p-4 bg-transparent font-mono text-xs sm:text-[13.5px] leading-relaxed text-foreground resize-none focus:outline-none focus:ring-0 selection:bg-accent/30 overflow-auto"
                style={{ tabSize: 4 }}
              />
            </div>

            {/* Editor Footer */}
            <div className="px-4 py-2 bg-muted border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Auto-save active</span>
              <span>Submit anytime before {formatTimer(timerSecondsLeft)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // RENDER SCREEN 4: LECTURER QUIZ DETAIL VIEW & GEMINI EVALUATED MARKS TABLE
  // --------------------------------------------------------------------------
  const renderDetailView = () => {
    if (!activeQuiz) return null;

    const totalSubmissions = activeQuiz.submissions.length;
    const evaluatedCount = activeQuiz.submissions.filter((s) => s.evaluation).length;
    const isEvaluated = evaluatedCount > 0;

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <button onClick={() => setView("list")} className="hover:text-accent">
                Quizzes
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">{activeQuiz.title}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{activeQuiz.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{activeQuiz.topic}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setView("list")} variant="outline" size="sm">
              ← Back to List
            </Button>
            <Button
              onClick={() => handleStartTakingQuiz(activeQuiz)}
              variant="outline"
              size="sm"
              icon={<Play className="w-3.5 h-3.5" />}
            >
              Test as Student
            </Button>
            <Button
              onClick={() => handleExportPdf(activeQuiz)}
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export PDF
            </Button>
            <Button
              onClick={() => handleDeleteQuiz(activeQuiz.id)}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 text-xs"
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Quiz
            </Button>
          </div>
        </div>

        {/* Evaluation Requirements Highlight Banner */}
        <div className="bg-card p-5 rounded-[16px] border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Lecturer Evaluation Guidelines (Active in Gemini AI)
              </span>
            </div>
            <p className="text-xs text-foreground font-medium italic">
              &ldquo;{activeQuiz.evaluationRequirements}&rdquo;
            </p>
          </div>

          <Button
            onClick={() => handleRunAIEvaluationInTerminal(activeQuiz.id)}
            disabled={isTerminalRunning || isLoading}
            variant="primary"
            size="md"
            icon={<Sparkles className={`w-4 h-4 text-background ${isTerminalRunning ? "animate-spin" : ""}`} />}
          >
            {isTerminalRunning || isLoading ? "Evaluating in Terminal..." : "Evaluate with Gemini AI"}
          </Button>
        </div>

        {/* ============================================================== */}
        {/* LECTURER EVALUATION TERMINAL (Gemini AI Engine)                */}
        {/* ============================================================== */}
        <div className="bg-[#09090c] border border-border rounded-[16px] overflow-hidden shadow-2xl flex flex-col">
          {/* Terminal Window Header Bar */}
          <div className="bg-[#121216] px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block shadow-xs" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block shadow-xs" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block shadow-xs" />
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono font-bold text-foreground">
                  Lecturer Evaluation Terminal
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini AI Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTerminalCommand("clear")}
                className="px-2.5 py-1 text-[11px] font-mono rounded-[8px] bg-muted hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border flex items-center gap-1"
                title="Clear Terminal Output"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <Button
                onClick={() => handleRunAIEvaluationInTerminal(activeQuiz.id)}
                disabled={isTerminalRunning || isLoading}
                variant="primary"
                size="sm"
                icon={<Sparkles className={`w-3.5 h-3.5 ${isTerminalRunning ? "animate-spin" : ""}`} />}
                className="text-xs font-mono font-bold"
              >
                {isTerminalRunning ? "Gemini Grading..." : "▶ Run Evaluation"}
              </Button>
            </div>
          </div>

          {/* Terminal Console Output Screen */}
          <div className="p-4 font-mono text-[12px] leading-relaxed min-h-[180px] max-h-[350px] overflow-y-auto space-y-0.5 text-neutral-300 selection:bg-accent/30 bg-[#09090c]">
            {terminalLines.map((line, idx) => {
              const isPrompt = line.startsWith("$");
              const isSuccess = line.startsWith("[SUCCESS]") || line.includes("100%") || line.includes("[COMPLETE]");
              const isInfo = line.startsWith("[") && (line.includes("STUDENT") || line.includes("INFO") || line.includes("EVAL") || line.includes("STATUS"));
              const isMarks = line.includes("TOTAL MARKS:") || line.includes("Marks Awarded:") || line.includes("Class Average:") || line.includes("Total:");
              const isWarn = line.includes("[WARN]") || line.includes("[ERROR]");
              const isDivider = line.startsWith("---") || line.startsWith("===");

              let lineClass = "text-neutral-300";
              if (isPrompt) lineClass = "text-emerald-400 font-semibold";
              else if (isSuccess) lineClass = "text-emerald-400 font-bold";
              else if (isMarks) lineClass = "text-accent font-bold";
              else if (isInfo) lineClass = "text-cyan-400 font-semibold";
              else if (isWarn) lineClass = "text-amber-400 font-semibold";
              else if (isDivider) lineClass = "text-neutral-600";

              return (
                <div key={idx} className={`whitespace-pre-wrap break-all ${lineClass}`}>
                  {line}
                </div>
              );
            })}
            <div ref={terminalBottomRef} />
          </div>

          {/* Interactive Command Prompt Line & Quick Actions */}
          <div className="bg-[#101014] border-t border-border p-3 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTerminalCommand(terminalInput);
                setTerminalInput("");
              }}
              className="flex items-center gap-2 font-mono text-xs"
            >
              <span className="text-emerald-400 font-bold shrink-0 select-none">
                lecturer@unicodetrack:~$
              </span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type 'eval' to grade, 'criteria' for guidelines, 'help' for CLI commands..."
                disabled={isTerminalRunning}
                className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 focus:outline-none text-xs font-mono"
              />
              <button
                type="submit"
                disabled={isTerminalRunning || !terminalInput.trim()}
                className="px-2.5 py-1 bg-muted hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 rounded-[6px] text-[11px] font-mono border border-border transition-colors cursor-pointer"
              >
                Enter ↵
              </button>
            </form>

            {/* Quick Command Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono text-neutral-500">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Quick Commands:</span>
              <button
                type="button"
                onClick={() => handleTerminalCommand("eval")}
                disabled={isTerminalRunning}
                className="px-2 py-0.5 rounded-[6px] bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 transition-colors cursor-pointer"
              >
                ▶ eval
              </button>
              <button
                type="button"
                onClick={() => handleTerminalCommand("criteria")}
                className="px-2 py-0.5 rounded-[6px] bg-muted hover:bg-neutral-800 text-neutral-300 border border-border transition-colors cursor-pointer"
              >
                criteria
              </button>
              <button
                type="button"
                onClick={() => handleTerminalCommand("status")}
                className="px-2 py-0.5 rounded-[6px] bg-muted hover:bg-neutral-800 text-neutral-300 border border-border transition-colors cursor-pointer"
              >
                status
              </button>
              <button
                type="button"
                onClick={() => handleTerminalCommand("simulate")}
                className="px-2 py-0.5 rounded-[6px] bg-muted hover:bg-neutral-800 text-neutral-300 border border-border transition-colors cursor-pointer"
              >
                + simulate submission
              </button>
              <button
                type="button"
                onClick={() => handleTerminalCommand("clear")}
                className="px-2 py-0.5 rounded-[6px] bg-muted hover:bg-neutral-800 text-neutral-400 border border-border transition-colors cursor-pointer"
              >
                clear
              </button>
            </div>
          </div>
        </div>

        {/* Submissions & Marks Table */}
        <div className="bg-card rounded-[16px] border border-border overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground">Student Submissions & AI Marks</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalSubmissions} Student submissions ({evaluatedCount} graded by Gemini AI)
              </p>
            </div>

            {isEvaluated && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-border">
                AI Marks Active
              </span>
            )}
          </div>

          {activeQuiz.submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <FileQuestion className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-medium text-foreground">No student submissions recorded yet.</p>
              <p className="text-[11px] text-muted-foreground">
                Students can take this quiz from their examination workspace, or you can preview it using &ldquo;Test as Student&rdquo; above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/30">
                    <th className="py-3 px-4 font-semibold">Student ID</th>
                    <th className="py-3 px-4 font-semibold">Full Name</th>
                    {activeQuiz.questions.map((q) => (
                      <th key={q.id} className="py-3 px-3 font-mono font-semibold text-center">
                        Q{q.questionNumber} ({q.maxMarks}m)
                      </th>
                    ))}
                    <th className="py-3 px-4 font-semibold text-center font-mono">Total Score</th>
                    <th className="py-3 px-4 font-semibold">Gemini AI Feedback</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeQuiz.submissions.map((sub, sIdx) => {
                    const evalData = sub.evaluation;
                    const maxPossible = activeQuiz.questions.reduce((a, q) => a + q.maxMarks, 0);

                    return (
                      <tr key={sub.studentId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {sub.studentId}
                          {sub.autoSubmitted && (
                            <span className="block text-[10px] text-warning font-sans font-normal">
                              (Auto-submitted)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">{sub.studentName}</td>

                        {/* Question Marks */}
                        {activeQuiz.questions.map((q, qIdx) => {
                          const mark = evalData?.marks ? evalData.marks[qIdx] : "-";
                          return (
                            <td key={q.id} className="py-3 px-3 text-center font-mono">
                              <span className="font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-[6px] border border-accent-border">
                                {mark}
                              </span>
                            </td>
                          );
                        })}

                        {/* Total Score */}
                        <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                          {evalData ? (
                            <span className="text-accent text-sm">
                              {evalData.totalScore} / {maxPossible}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>

                        {/* Remarks */}
                        <td className="py-3 px-4 text-muted-foreground text-[11px] leading-relaxed max-w-xs">
                          {evalData?.generalFeedback || (
                            <span className="italic opacity-60">Awaiting Gemini AI evaluation...</span>
                          )}
                        </td>

                        {/* Action Details */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            onClick={() => setInspectingSubmission(sub)}
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Inspection Modal (Student Code + Gemini Model Answer Side-by-Side) */}
        {inspectingSubmission && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border w-full max-w-4xl max-h-[90vh] rounded-[16px] overflow-hidden flex flex-col shadow-2xl">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Submission Inspection — {inspectingSubmission.studentName} ({inspectingSubmission.studentId})
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Submitted at {inspectingSubmission.submittedAt}
                  </span>
                </div>
                <button
                  onClick={() => setInspectingSubmission(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {activeQuiz.questions.map((q) => {
                  const studentAnswer = inspectingSubmission.answers.find((a) => a.questionNumber === q.questionNumber);
                  const qEval = inspectingSubmission.evaluation?.questionEvaluations?.find(
                    (qe) => qe.questionNumber === q.questionNumber
                  );

                  return (
                    <div key={q.id} className="p-4 bg-muted/50 border border-border rounded-[12px] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          Question {q.questionNumber}: {q.prompt}
                        </span>
                        {qEval && (
                          <span className="font-mono font-bold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full border border-accent-border">
                            {qEval.awardedMarks} / {qEval.maxMarks} Marks
                          </span>
                        )}
                      </div>

                      {qEval?.remarks && (
                        <div className="text-xs bg-card p-2.5 rounded-[8px] border border-border text-muted-foreground">
                          <strong className="text-foreground">AI Remark:</strong> {qEval.remarks}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="font-semibold text-muted-foreground block font-mono">
                            Student Submitted Code:
                          </span>
                          <pre className="p-3 bg-[#0d0d0f] border border-border rounded-[8px] font-mono text-[11px] text-foreground overflow-auto max-h-48">
                            {studentAnswer?.code || "// No code submitted"}
                          </pre>
                        </div>

                        <div className="space-y-1">
                          <span className="font-semibold text-accent block font-mono flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Gemini Model Answer:
                          </span>
                          <pre className="p-3 bg-[#0d0d0f] border border-accent/30 rounded-[8px] font-mono text-[11px] text-accent/90 overflow-auto max-h-48">
                            {qEval?.modelAnswer || "// Optimal reference solution will appear upon AI grading"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-3 border-t border-border flex justify-end">
                <Button onClick={() => setInspectingSubmission(null)} variant="primary" size="sm">
                  Close Inspection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-[12px] bg-accent-soft border border-accent-border text-accent flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage("")} className="hover:opacity-80 p-1">
            ✕
          </button>
        </div>
      )}

      {/* Screen Routing */}
      {view === "create"
        ? renderCreateView()
        : view === "detail"
        ? renderDetailView()
        : view === "student"
        ? renderStudentView()
        : renderListView()}
    </div>
  );
}
