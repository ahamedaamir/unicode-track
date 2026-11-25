"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";

interface StudentQuizResult {
  s: string; // student index e.g. TG/2004/2004
  m: number[]; // marks per question (each out of 5)
  rem: string; // Gemini remark
}

interface QuizItem {
  id: number;
  topic: string;
  start: string;
  mode: "total" | "each";
  mins: number;
  q: string[];
  st: "up" | "fin"; // up = upcoming, fin = finished / marks ready
  res: StudentQuizResult[] | null;
  saved: boolean;
}

const SAMPLE_QUESTIONS = [
  "Write a C function that reverses a string in place.",
  "Return the largest value in an int array.",
  "Count the vowels in a line of input.",
  "Insert a node at the head of a linked list.",
];

const STUDENT_LIST = [
  "TG/2004/2004",
  "TG/2004/2011",
  "TG/2004/2037",
  "TG/2004/2058",
  "TG/2004/2063",
];

const REMARKS_LIST = [
  "Correct logic, minor style issues",
  "Works for main cases, misses an edge case",
  "Partly correct, memory not freed",
  "Compiles, output differs from the spec",
  "Strong, clean solution",
];

function generateQuizResults(questionCount: number): StudentQuizResult[] {
  return STUDENT_LIST.map((studentId, studentIndex) => ({
    s: studentId,
    m: Array.from({ length: questionCount }, (_, qIndex) => {
      const val = 5 - ((studentIndex * 3 + qIndex * 2) % 4);
      return Math.max(1, Math.min(5, val));
    }),
    rem: REMARKS_LIST[studentIndex % REMARKS_LIST.length],
  }));
}

const INITIAL_QUIZZES: QuizItem[] = [];

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>(INITIAL_QUIZZES);
  const [view, setView] = useState<"list" | "create" | "done" | "detail" | "student">("list");
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);

  // Loaders & feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  // Create Form State
  const [formTopic, setFormTopic] = useState<string>("");
  const [formPdfName, setFormPdfName] = useState<string>("");
  const [formStart, setFormStart] = useState<string>("");
  const [formMode, setFormMode] = useState<"total" | "each">("total");
  const [formMins, setFormMins] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // Student Preview State
  const [studentQuestionIndex, setStudentQuestionIndex] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [studentSubmitted, setStudentSubmitted] = useState<boolean>(false);
  const [studentShowMarks, setStudentShowMarks] = useState<boolean>(false);

  const activeQuiz = useMemo(() => {
    return quizzes.find((q) => q.id === activeQuizId) || null;
  }, [quizzes, activeQuizId]);

  const calculateSum = (marksArr: number[]): number => {
    return marksArr.reduce((a, b) => a + (Number(b) || 0), 0);
  };

  const formatQuizTiming = (z: QuizItem): string => {
    return `${z.mins} ${z.mode === "total" ? "min total" : "min per question"}`;
  };

  // --------------------------------------------------------------------------
  // PUBLISH QUIZ WITH GEMINI PDF READING SIMULATION
  // --------------------------------------------------------------------------
  const handlePublishQuiz = () => {
    const errors: string[] = [];
    if (!formTopic.trim()) errors.push("a topic");
    if (!formPdfName) errors.push("the questions PDF");
    if (!formStart) errors.push("a start time");
    if (!formMins || Number(formMins) <= 0) errors.push("the time in minutes");

    if (errors.length > 0) {
      setFormError(`Please add ${errors.join(", ")}.`);
      return;
    }

    setFormError("");
    setIsLoading(true);
    setLoadingMessage("Gemini is reading the PDF and finding questions in order…");

    setTimeout(() => {
      const newQuiz: QuizItem = {
        id: Date.now(),
        topic: formTopic.trim(),
        start: formStart,
        mode: formMode,
        mins: Number(formMins),
        q: SAMPLE_QUESTIONS.slice(0, 4),
        st: "up",
        res: null,
        saved: false,
      };

      setQuizzes((prev) => [newQuiz, ...prev]);
      setIsLoading(false);
      setLoadingMessage("");
      setActiveQuizId(newQuiz.id);
      setView("done");
    }, 3000);
  };

  // --------------------------------------------------------------------------
  // SIMULATE QUIZ END: GEMINI EVALUATES EVERY STUDENT
  // --------------------------------------------------------------------------
  const handleSimulateQuizEnd = (quizId: number) => {
    setIsLoading(true);
    setLoadingMessage("Gemini is checking every student's code and answers…");

    setTimeout(() => {
      setQuizzes((prev) =>
        prev.map((q) => {
          if (q.id === quizId) {
            return {
              ...q,
              st: "fin",
              res: generateQuizResults(q.q.length),
              saved: false,
            };
          }
          return q;
        })
      );

      setIsLoading(false);
      setLoadingMessage("");
      setToastMessage("Quiz ended. Gemini has marked every student's answers.");
    }, 3000);
  };

  // --------------------------------------------------------------------------
  // EDIT SCORE IN LIVE LECTURER TABLE
  // --------------------------------------------------------------------------
  const handleUpdateStudentMark = (studentIndex: number, questionIndex: number, val: number) => {
    if (!activeQuiz) return;
    const cleanVal = Math.max(0, Math.min(5, Number(val) || 0));

    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === activeQuiz.id && q.res) {
          const updatedRes = [...q.res];
          const studentResult = { ...updatedRes[studentIndex] };
          const updatedMarks = [...studentResult.m];
          updatedMarks[questionIndex] = cleanVal;
          studentResult.m = updatedMarks;
          updatedRes[studentIndex] = studentResult;

          return {
            ...q,
            res: updatedRes,
            saved: false,
          };
        }
        return q;
      })
    );
  };

  // --------------------------------------------------------------------------
  // SAVE QUIZ MARKS TO PDF USING JSPDF
  // --------------------------------------------------------------------------
  const handleSavePdf = (quiz: QuizItem) => {
    if (!quiz.res) return;

    try {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(18);
      doc.text(`${quiz.topic} — Quiz Marks`, 14, y);
      y += 8;

      doc.setFontSize(11);
      doc.text(
        `Start: ${quiz.start.replace("T", " ")}  |  Timing: ${formatQuizTiming(quiz)}  |  Questions: ${quiz.q.length}`,
        14,
        y
      );
      y += 12;

      quiz.res.forEach((r) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const qMarksText = r.m.map((m, i) => `Q${i + 1}: ${m}/5`).join("   ");
        const total = calculateSum(r.m);
        doc.setFontSize(11);
        doc.text(
          `${r.s.padEnd(16)}  ${qMarksText}   Total: ${total} / ${quiz.q.length * 5}`,
          14,
          y
        );
        y += 6;

        doc.setFontSize(9);
        doc.text(`   Feedback: ${r.rem}`, 14, y);
        y += 8;
      });

      const filename = `${quiz.topic.replace(/\W+/g, "-").toLowerCase()}-quiz-marks.pdf`;
      doc.save(filename);
      setToastMessage(`Downloaded ${filename}`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  // --------------------------------------------------------------------------
  // SCREEN 1: QUIZZES LIST VIEW
  // --------------------------------------------------------------------------
  const renderListView = () => {
    return (
      <>
        {/* Breadcrumb */}
        <div className="crumb">
          <Link href="/dashboard" className="hover:text-teal-400">
            Dashboard
          </Link>{" "}
          / <span>Quizzes</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Quizzes</h1>
        <p className="sub text-sm text-muted-foreground mb-4">
          Practical coding quizzes for your students.
        </p>

        {/* Action Button */}
        <div className="proj-row mb-4">
          <button
            className="proj-btn p flex items-center gap-1.5"
            onClick={() => {
              setFormTopic("");
              setFormPdfName("");
              setFormStart("");
              setFormMode("total");
              setFormMins("");
              setFormError("");
              setView("create");
            }}
          >
            <Plus className="w-4 h-4" />
            Create quiz
          </button>
        </div>

        {/* Quizzes Grid */}
        {quizzes.length === 0 ? (
          <div className="proj-card text-center py-12 text-muted-foreground border border-dashed border-border rounded-[16px]">
            <p className="text-sm font-medium text-foreground">No quizzes created yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Create quiz&quot; above to publish a practical coding quiz from a PDF or custom questions.
            </p>
          </div>
        ) : (
          <div className="proj-grid">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="proj-card proj-tile"
                onClick={() => {
                  setActiveQuizId(quiz.id);
                  setView("detail");
                }}
              >
                <b>{quiz.topic}</b>
                <span>
                  {quiz.start.replace("T", " ")} · {formatQuizTiming(quiz)}
                </span>
                <br />
                <span className={`proj-tag ${quiz.st === "fin" ? "ok" : "no"}`}>
                  {quiz.st === "fin" ? "Finished · marks ready" : "Upcoming"}
                </span>{" "}
                <span className="proj-tag">{quiz.q.length} questions</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 2: CREATE QUIZ FORM
  // --------------------------------------------------------------------------
  const renderCreateView = () => {
    if (isLoading) {
      return (
        <>
          <div className="crumb">
            <Link href="/dashboard">Dashboard</Link> /{" "}
            <a onClick={() => setView("list")}>Quizzes</a> / <span>Create</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create quiz</h1>
          <div className="proj-card text-center py-14 space-y-3">
            <span className="sp2"></span>
            <b className="text-base text-white block">Gemini is reading the PDF…</b>
            <p className="text-xs text-muted-foreground">
              Finding each question and putting them in order.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        {/* Breadcrumb */}
        <div className="crumb">
          <Link href="/dashboard">Dashboard</Link> /{" "}
          <a onClick={() => setView("list")}>Quizzes</a> / <span>Create</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Create quiz</h1>
        <p className="sub text-sm text-muted-foreground mb-4">
          Upload the questions and set the time.
        </p>

        {/* 1. Topic */}
        <div className="proj-sec">Topic</div>
        <input
          className="proj-in text-base py-3 px-3.5 bg-muted border border-border text-foreground rounded-[10px] focus:outline-none focus:border-accent mb-4"
          placeholder="e.g. Pointers in C"
          value={formTopic}
          onChange={(e) => setFormTopic(e.target.value)}
        />

        {/* 2. Practical Questions Upload */}
        <div className="proj-sec">Practical questions</div>
        <label className="proj-card proj-tile block border-dashed text-center p-6 cursor-pointer hover:border-accent mb-4 rounded-[16px]">
          <input
            type="file"
            accept=".pdf"
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFormPdfName(e.target.files[0].name);
              }
            }}
          />
          <b className="text-foreground text-base">
            {formPdfName || "Upload questions PDF"}
          </b>
          <br />
          <span className="text-muted-foreground text-xs">
            {formPdfName
              ? "Click to replace"
              : "Number the questions in the PDF. Gemini will put them in order."}
          </span>
        </label>

        {/* 3. Start and Time */}
        <div className="proj-sec">Start and time</div>
        <div className="proj-two mb-6">
          <div className="proj-card">
            <label className="proj-label">Starting time</label>
            <input
              type="datetime-local"
              className="proj-in"
              value={formStart}
              onChange={(e) => setFormStart(e.target.value)}
            />
          </div>

          <div className="proj-card">
            <label className="proj-label">Timing</label>
            <div className="proj-row">
              <div className="seg s">
                <button
                  type="button"
                  className={formMode === "total" ? "on" : ""}
                  onClick={() => setFormMode("total")}
                >
                  Total time
                </button>
                <button
                  type="button"
                  className={formMode === "each" ? "on" : ""}
                  onClick={() => setFormMode("each")}
                >
                  Per question
                </button>
              </div>
              <input
                type="number"
                min="1"
                className="proj-in w-24 text-center font-mono"
                placeholder="Minutes"
                value={formMins}
                onChange={(e) => setFormMins(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="proj-row mt-6">
          {formError && <span className="proj-err text-xs">{formError}</span>}
          <span className="proj-sp"></span>
          <button className="proj-btn" onClick={() => setView("list")}>
            Cancel
          </button>
          <button className="proj-btn p" onClick={handlePublishQuiz}>
            Publish quiz
          </button>
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 3: QUIZ PUBLISHED CONFIRMATION
  // --------------------------------------------------------------------------
  const renderDoneView = () => {
    if (!activeQuiz) return null;

    return (
      <>
        <div className="crumb">
          <Link href="/dashboard">Dashboard</Link> /{" "}
          <a onClick={() => setView("list")}>Quizzes</a> / <span>Published</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Quiz published</h1>
        <p className="sub text-sm text-muted-foreground mb-4">
          Students can open it at the start time.
        </p>

        <div className="proj-card space-y-4">
          <b className="text-lg text-white block">{activeQuiz.topic}</b>
          <p className="text-xs text-muted-foreground">
            {activeQuiz.start.replace("T", " ")} · {formatQuizTiming(activeQuiz)}
          </p>

          <div className="proj-sec" style={{ marginTop: 12 }}>
            Questions found and ordered by Gemini
          </div>
          <div className="space-y-2">
            {activeQuiz.q.map((questionText: string, idx: number) => (
              <div
                key={idx}
                className="proj-row py-2.5 px-3 rounded-[10px] bg-[#0d0d0f] border border-border"
              >
                <div className="proj-ic text-xs font-mono">{idx + 1}</div>
                <span className="text-xs text-foreground">{questionText}</span>
              </div>
            ))}
          </div>

          <div className="proj-row pt-3 border-t border-border">
            <button className="proj-btn p" onClick={() => setView("list")}>
              Back to quizzes
            </button>
            <button
              className="proj-btn flex items-center gap-1.5"
              onClick={() => {
                setStudentQuestionIndex(0);
                setStudentAnswers([]);
                setStudentSubmitted(false);
                setStudentShowMarks(false);
                setView("student");
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview student view
            </button>
          </div>
        </div>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 4: QUIZ DETAIL VIEW (LECTURER TABLE & MARKS)
  // --------------------------------------------------------------------------
  const renderDetailView = () => {
    if (!activeQuiz) return null;

    const isFinished = activeQuiz.st === "fin";
    const questionCount = activeQuiz.q.length;

    if (isLoading) {
      return (
        <>
          <div className="crumb">
            <Link href="/dashboard">Dashboard</Link> /{" "}
            <a onClick={() => setView("list")}>Quizzes</a> / <span>{activeQuiz.topic}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{activeQuiz.topic}</h1>
          <div className="proj-card text-center py-14 space-y-3">
            <span className="sp2"></span>
            <b className="text-base text-white block">
              Gemini is checking every student&apos;s code and answers…
            </b>
          </div>
        </>
      );
    }

    return (
      <>
        {/* Breadcrumb */}
        <div className="crumb">
          <Link href="/dashboard">Dashboard</Link> /{" "}
          <a onClick={() => setView("list")}>Quizzes</a> / <span>{activeQuiz.topic}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">{activeQuiz.topic}</h1>
        <p className="sub text-sm text-muted-foreground mb-4">
          {activeQuiz.start.replace("T", " ")} · {formatQuizTiming(activeQuiz)} ·{" "}
          {questionCount} questions
        </p>

        {/* Action Row */}
        <div className="proj-row mb-4">
          <button
            className="proj-btn flex items-center gap-1.5"
            onClick={() => {
              setStudentQuestionIndex(0);
              setStudentAnswers([]);
              setStudentSubmitted(false);
              setStudentShowMarks(false);
              setView("student");
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview student view
          </button>

          <span className="proj-sp"></span>

          {isFinished ? (
            <>
              <button
                className="proj-btn flex items-center gap-1.5"
                onClick={() => handleSavePdf(activeQuiz)}
              >
                <Download className="w-3.5 h-3.5" />
                Save as PDF
              </button>
              <button
                className="proj-btn p flex items-center gap-1.5"
                onClick={() => {
                  setQuizzes((prev) =>
                    prev.map((q) => (q.id === activeQuiz.id ? { ...q, saved: true } : q))
                  );
                  setToastMessage("Marks saved to the database successfully.");
                }}
              >
                <Check className="w-3.5 h-3.5" />
                {activeQuiz.saved ? "Marks saved ✓" : "Save marks"}
              </button>
            </>
          ) : (
            <button
              className="proj-btn p flex items-center gap-1.5"
              onClick={() => handleSimulateQuizEnd(activeQuiz.id)}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulate: quiz ends
            </button>
          )}
        </div>

        {/* Upcoming Questions List OR Full Lecturer Marks Table */}
        {!isFinished ? (
          <div className="proj-card space-y-3">
            <b className="text-sm text-foreground block">Questions (in order)</b>
            {activeQuiz.q.map((questionText: string, idx: number) => (
              <div
                key={idx}
                className="proj-row py-2.5 px-3 rounded-[10px] bg-[#0d0d0f] border border-border"
              >
                <div className="proj-ic text-xs font-mono">{idx + 1}</div>
                <span className="text-xs text-foreground">{questionText}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="proj-card overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 px-2">Student</th>
                  {activeQuiz.q.map((_: unknown, i: number) => (
                    <th key={i} className="py-2.5 px-2 text-center font-mono">
                      Q{i + 1}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center">Total</th>
                  <th className="py-2.5 px-2">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeQuiz.res?.map((record: StudentQuizResult, sIdx: number) => {
                  const studentTotal = calculateSum(record.m);

                  return (
                    <tr key={record.s}>
                      <td className="py-2.5 px-2 font-mono font-semibold text-foreground whitespace-nowrap">
                        {record.s}
                      </td>
                      {record.m.map((scoreVal: number, qIdx: number) => (
                        <td key={qIdx} className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            className="w-12 p-1 text-center border border-border bg-muted text-foreground rounded-[10px] font-mono text-xs focus:border-accent focus:outline-none"
                            value={scoreVal}
                            onChange={(e) =>
                              handleUpdateStudentMark(sIdx, qIdx, Number(e.target.value))
                            }
                          />
                        </td>
                      ))}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono">
                        <b className="text-accent">{studentTotal}</b> / {questionCount * 5}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground text-[11px] leading-relaxed">
                        {record.rem}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">
              Each question is out of 5. Students only see their own marks.
            </p>
          </div>
        )}
      </>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 5: STUDENT PREVIEW VIEW
  // --------------------------------------------------------------------------
  const renderStudentView = () => {
    if (!activeQuiz) return null;

    const questionCount = activeQuiz.q.length;
    const isLastQuestion = studentQuestionIndex === questionCount - 1;

    const topBanner = (
      <>
        <div className="crumb">
          <a onClick={() => setView("detail")}>← Back to lecturer view</a>
        </div>
        <div className="proj-card proj-row mb-4">
          <div>
            <b className="text-base text-white block">{activeQuiz.topic}</b>
            <span className="text-xs text-muted-foreground">
              Student preview · TG/2004/2004
            </span>
          </div>
          <span className="proj-sp"></span>
          <span className="proj-tag" style={{ margin: 0 }}>
            {activeQuiz.mode === "total"
              ? `${activeQuiz.mins}:00 left`
              : `${activeQuiz.mins} min for this question`}
          </span>
        </div>
      </>
    );

    if (studentSubmitted) {
      const studentMarks = activeQuiz.res
        ? activeQuiz.res[0].m
        : activeQuiz.q.map((_: unknown, i: number) => [4, 3, 5, 4][i % 4]);
      const totalScore = calculateSum(studentMarks);

      return (
        <>
          {topBanner}
          <div className="proj-card text-center py-12 space-y-4">
            <b className="text-lg text-foreground block">Quiz submitted</b>
            <p className="text-xs text-muted-foreground">
              Your marks appear here when the quiz ends.
            </p>

            {studentShowMarks ? (
              <div className="proj-card max-w-[280px] mx-auto py-4 bg-[#0d0d0f] border border-accent/40 animate-in fade-in-50">
                <b className="text-3xl text-accent block font-mono">
                  {totalScore} / {questionCount * 5}
                </b>
                <span className="text-xs text-muted-foreground mt-1 block">Your marks</span>
              </div>
            ) : (
              <button
                className="proj-btn p text-xs"
                onClick={() => setStudentShowMarks(true)}
              >
                Preview: after the quiz ends
              </button>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        {topBanner}
        <div className="proj-card space-y-3">
          <div className="proj-row">
            <b className="text-sm text-foreground">
              Question {studentQuestionIndex + 1} of {questionCount}
            </b>
          </div>

          <p className="text-xs text-foreground leading-relaxed">
            {activeQuiz.q[studentQuestionIndex]}
          </p>

          <textarea
            className="w-full p-3 font-mono text-xs text-foreground bg-[#0d0d0f] border border-border rounded-[10px] focus:outline-none focus:border-accent leading-relaxed resize-none"
            rows={10}
            placeholder="// type your C code here"
            value={studentAnswers[studentQuestionIndex] || ""}
            onChange={(e) => {
              const updated = [...studentAnswers];
              updated[studentQuestionIndex] = e.target.value;
              setStudentAnswers(updated);
            }}
          />

          <div className="proj-row pt-2">
            <button
              className="proj-btn text-xs disabled:opacity-50"
              disabled={studentQuestionIndex === 0}
              onClick={() => setStudentQuestionIndex((prev) => prev - 1)}
            >
              Previous
            </button>
            <span className="proj-sp"></span>
            {isLastQuestion ? (
              <button
                className="proj-btn p text-xs"
                onClick={() => setStudentSubmitted(true)}
              >
                Finish quiz
              </button>
            ) : (
              <button
                className="proj-btn p text-xs"
                onClick={() => setStudentQuestionIndex((prev) => prev + 1)}
              >
                Next question
              </button>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-[1100px] mx-auto py-3 px-2.5 sm:px-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="proj-card mb-4 border-emerald-500/40 bg-emerald-950/20 text-emerald-300 flex items-center justify-between text-xs p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <b className="font-semibold">{toastMessage}</b>
          </div>
          <button
            onClick={() => setToastMessage("")}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Screen Router */}
      {view === "create"
        ? renderCreateView()
        : view === "done"
        ? renderDoneView()
        : view === "student"
        ? renderStudentView()
        : view === "detail"
        ? renderDetailView()
        : renderListView()}
    </div>
  );
}
