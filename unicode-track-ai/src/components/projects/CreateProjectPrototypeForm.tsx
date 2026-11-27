"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/context/AdminDataContext";
import { Project, Student } from "@/types/admin";
import { ProjectGroup, ProjectStudentAssignment } from "@/types/project";
import { DEFAULT_ER_DIAGRAM_RUBRIC } from "@/types/er-diagram";

const BATCHES = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"] as const;

const DELIVERABLES: [string, string][] = [
  ["proposal", "Project proposal"],
  ["repo", "GitHub repo link"],
  ["er", "ER diagram"],
  ["report", "Final report"],
];

interface CreateProjectPrototypeFormProps {
  onBackToProjects?: () => void;
  standalone?: boolean;
}

export function CreateProjectPrototypeForm({
  onBackToProjects,
  standalone = false,
}: CreateProjectPrototypeFormProps) {
  const router = useRouter();
  const {
    courses: contextCourses,
    departments: contextDepartments,
    students,
    lecturers,
    activeLecturerEmail,
    addProject,
    setProjectGroups,
    setProjectStudentAssignments,
    showToast,
  } = useAdminData();

  // State matching prototype F
  const [step, setStep] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<"group" | "individual">("group");
  const [pdfName, setPdfName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedGroups, setExtractedGroups] = useState<any[] | null>(null);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handlePdfUpload = async (file: File) => {
    setPdfName(file.name);
    setPdfFile(file);
    setIsExtractingPdf(true);
    setExtractionError(null);
    setExtractionWarnings([]);
    setExtractedGroups(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("registeredStudents", JSON.stringify(students));

      const res = await fetch("/api/ai/extract-groups", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data && json.data.groups && json.data.groups.length > 0) {
        setExtractedGroups(json.data.groups);
        if (json.data.warnings && json.data.warnings.length > 0) {
          setExtractionWarnings(json.data.warnings);
        }
      } else {
        setExtractionError(
          json.error || "No groups could be identified in this PDF. Please ensure the PDF has a selectable table of group allocations."
        );
      }
    } catch (err: any) {
      setExtractionError(err?.message || "Failed to extract student groups with Gemini AI.");
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Dynamic courses linked to selected department
  const courses = React.useMemo(() => {
    if (!dept) {
      return contextCourses.map((c) => ({ c: c.code, n: c.name, departmentId: c.departmentId }));
    }
    const matchingDept = contextDepartments.find(
      (d) => d.name.toLowerCase() === dept.toLowerCase()
    );
    if (!matchingDept) {
      return contextCourses.map((c) => ({ c: c.code, n: c.name, departmentId: c.departmentId }));
    }
    const deptCourses = contextCourses.filter(
      (c) => c.departmentId === matchingDept.id
    );
    return (deptCourses.length > 0 ? deptCourses : contextCourses).map((c) => ({
      c: c.code,
      n: c.name,
      departmentId: c.departmentId,
    }));
  }, [contextCourses, contextDepartments, dept]);

  const currentLecturer =
    lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];

  const [reqs, setReqs] = useState<{ t: string; m: string }[]>([
    { t: "", m: "" },
  ]);

  const [d, setD] = useState<{
    proposal: { on: boolean; f: string; t: string };
    repo: { on: boolean; f: string; t: string };
    er: { on: boolean; f: string; t: string };
    report: { on: boolean; f: string; t: string };
  }>({
    proposal: { on: false, f: "", t: "" },
    repo: { on: false, f: "", t: "" },
    er: { on: false, f: "", t: "" },
    report: { on: false, f: "", t: "" },
  });

  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const reqTot = () => reqs.reduce((a, r) => a + (+r.m || 0), 0);

  const resetForm = () => {
    setStep(0);
    setTitle("");
    setDept("");
    setCourse("");
    setBatch("");
    setFrom("");
    setTo("");
    setType("group");
    setPdfName("");
    setPdfFile(null);
    setExtractedGroups(null);
    setExtractionWarnings([]);
    setExtractionError(null);
    setIsExtractingPdf(false);
    setReqs([{ t: "", m: "" }]);
    setD({
      proposal: { on: false, f: "", t: "" },
      repo: { on: false, f: "", t: "" },
      er: { on: false, f: "", t: "" },
      report: { on: false, f: "", t: "" },
    });
    setDone(false);
    setErr("");
  };

  const handleBackNavigation = () => {
    if (onBackToProjects) {
      onBackToProjects();
    } else {
      router.push("/dashboard/projects");
    }
  };

  const stepErr = (n: number) => {
    const e: string[] = [];
    if (n === 0) {
      if (!title.trim()) e.push("a title");
      if (!dept) e.push("a department");
      if (!course) e.push("a course");
      if (!batch) e.push("a batch");
    }
    if (n === 1) {
      if (!from || !to) e.push("start and end dates");
      if (type === "group" && !pdfName) e.push("the group PDF");
    }
    if (n === 2) {
      const f = reqs.filter((r) => r.t.trim() || r.m !== "");
      if (!f.length) e.push("at least one requirement");
      else if (f.some((r) => !r.t.trim() || !(+r.m > 0)))
        e.push("a title and marks for every requirement");
      else if (reqTot() !== 100) e.push(`marks that total 100 (now ${reqTot()})`);
    }
    if (n === 3) {
      DELIVERABLES.forEach(([k, nm]) => {
        const item = d[k as keyof typeof d];
        if (item.on && (!item.f || !item.t)) {
          e.push(`dates for ${nm.toLowerCase()}`);
        }
      });
    }
    return e;
  };

  const nextS = () => {
    const e = stepErr(step);
    if (e.length) {
      setErr("Please add " + e.join(", ") + ".");
      return;
    }
    setErr("");
    setStep((prev) => prev + 1);
  };

  const backS = () => {
    setErr("");
    setStep((prev) => prev - 1);
  };

  const publishP = async () => {
    for (let i = 0; i < 4; i++) {
      const e = stepErr(i);
      if (e.length) {
        setStep(i);
        setErr("Please add " + e.join(", ") + ".");
        return;
      }
    }
    setErr("");
    setIsPublishing(true);

    try {
      const [yearStr, semStr] = batch.split(".");
      const academicYear = (Number(yearStr) || 2) as 1 | 2 | 3 | 4;
      const semester = (Number(semStr) || 1) as 1 | 2;

      const matchingDept = contextDepartments.find(
        (dp) => dp.name.toLowerCase() === dept.toLowerCase()
      );

      const requirementsContent = reqs
        .filter((r) => r.t.trim())
        .map((r, i) => `${i + 1}. ${r.t.trim()} (${r.m}%)`)
        .join("\n");

      const projectPayload: Omit<Project, "id"> = {
        title: title.trim(),
        description: `${title.trim()} — academic project for ${course} (${dept}), Batch ${batch}.`,
        academicYear,
        semester,
        departmentId: matchingDept?.id || "dept-1",
        courseCode: course,
        deadline: to ? new Date(to).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
        type: type === "group" ? "Group Project" : "Individual Project",
        projectType: type === "group" ? "group" : "individual",
        status: "Published",
        createdAt: new Date().toISOString().split("T")[0],
        requirements: requirementsContent,
        requirementsContent: requirementsContent,
        requirementsSource: "manual",
        lecturerId: currentLecturer?.id || "faculty",
        lecturerName: currentLecturer?.name || "Lecturer",
        proposalRequired: Boolean(d.proposal.on),
        erDiagramRequired: Boolean(d.er.on),
        erDiagramDeadline: d.er.t ? new Date(d.er.t).toISOString() : undefined,
        databaseRequired: Boolean(d.er.on),
        databaseRequirements: d.er.on
          ? "Normalized relational database design (3NF), ER diagram, and DDL schema."
          : undefined,
        githubRequired: Boolean(d.repo.on),
        finalReportRequired: Boolean(d.report.on),
        assignmentFileName: pdfName || undefined,
        assignmentSourceType: pdfName ? "pdf" : "text",
        databaseDesignConfig: d.er.on
          ? {
              enabled: true,
              isRequired: true,
              deadline: d.er.t ? new Date(d.er.t).toISOString() : to,
              expectedDesignDescription: "System relational entities, cardinalities, and constraints.",
              expectedEntities: ["Entities", "Attributes", "Keys"],
              expectedRelationships: ["1:N relationships", "Foreign keys"],
              rubricCriteria: DEFAULT_ER_DIAGRAM_RUBRIC,
            }
          : undefined,
      };

      const result = addProject(projectPayload);
      if (!result.success || !result.project) {
        throw new Error(result.error || "Failed to create project record.");
      }

      const newProjectId = result.project.id;

      // If group project: seed initial group workspaces using real groups extracted from PDF by Gemini AI
      if (type === "group" && setProjectGroups) {
        let groupsToUse = extractedGroups;

        // If extraction is still pending or wasn't triggered
        if ((!groupsToUse || groupsToUse.length === 0) && pdfFile) {
          try {
            const formData = new FormData();
            formData.append("file", pdfFile);
            formData.append("registeredStudents", JSON.stringify(students));
            const res = await fetch("/api/ai/extract-groups", {
              method: "POST",
              body: formData,
            });
            const json = await res.json();
            if (json.success && json.data && json.data.groups && json.data.groups.length > 0) {
              groupsToUse = json.data.groups;
            }
          } catch (e) {
            console.warn("PDF extraction fallback error:", e);
          }
        }

        if (groupsToUse && groupsToUse.length > 0) {
          const initialGroups: ProjectGroup[] = groupsToUse.map((eg, idx) => {
            const gNum = eg.group_number || idx + 1;
            const assignedMembers = (eg.members || []).map((m: any, mIdx: number) => ({
              studentId: m.student_id || m.matchedStudent?.studentId || m.matchedStudent?.id || `ST-${gNum}-${mIdx + 1}`,
              fullName: m.full_name || m.matchedStudent?.fullName || "Student",
              email: m.email || m.matchedStudent?.email || "",
              department: dept,
              academicYear,
              semester,
              role: mIdx === 0 ? ("Team Lead" as const) : ("Member" as const),
              commitsCount: 0,
            }));

            return {
              id: `grp-${newProjectId}-${gNum}`,
              projectId: newProjectId,
              groupNumber: gNum,
              groupName: eg.group_name || `Group ${gNum}`,
              workspaceId: `ws-${newProjectId}-${gNum}`,
              members: assignedMembers,
              repoStatus: "disconnected",
              totalCommits: 0,
              status: "active",
              progress: 0,
              proposalStatus: d.proposal.on ? "submitted" : "approved",
              createdAt: new Date().toISOString().split("T")[0],
            };
          });

          setProjectGroups(newProjectId, initialGroups);
        } else {
          // Fallback only if no PDF uploaded or extraction yielded no groups
          const matchingStudents = students.filter(
            (s) =>
              (!matchingDept || s.departmentId === matchingDept.id) &&
              s.academicYear === academicYear &&
              s.semester === semester
          );
          if (matchingStudents.length > 0) {
            const groupCount = Math.max(1, Math.min(6, Math.ceil(matchingStudents.length / 4)));
            const initialGroups: ProjectGroup[] = Array.from({ length: groupCount }, (_, idx) => {
              const gNum = idx + 1;
              const assignedMembers = matchingStudents
                .filter((_, sIdx) => sIdx % groupCount === idx)
                .map((s, mIdx) => ({
                  studentId: s.studentId || s.id,
                  fullName: s.fullName,
                  email: s.email,
                  department: dept,
                  academicYear,
                  semester,
                  role: mIdx === 0 ? ("Team Lead" as const) : ("Member" as const),
                  commitsCount: 0,
                }));

              return {
                id: `grp-${newProjectId}-${gNum}`,
                projectId: newProjectId,
                groupNumber: gNum,
                groupName: `Group ${gNum}`,
                workspaceId: `ws-${newProjectId}-${gNum}`,
                members: assignedMembers,
                repoStatus: "disconnected",
                totalCommits: 0,
                status: "active",
                progress: 0,
                proposalStatus: d.proposal.on ? "submitted" : "approved",
                createdAt: new Date().toISOString().split("T")[0],
              };
            });
            setProjectGroups(newProjectId, initialGroups);
          }
        }
      }

      // If individual project: seed personal workspaces with real students
      if (type === "individual" && setProjectStudentAssignments) {
        const eligibleStudents = students.filter(
          (s) =>
            (!matchingDept || s.departmentId === matchingDept.id) &&
            s.academicYear === academicYear &&
            s.semester === semester
        );

        const assignments: ProjectStudentAssignment[] = eligibleStudents.map((s) => ({
          id: `asgn-${newProjectId}-${s.studentId || s.id}`,
          projectId: newProjectId,
          studentId: s.studentId || s.id,
          studentEmail: s.email,
          studentName: s.fullName,
          departmentId: s.departmentId || matchingDept?.id || "",
          academicYear,
          semester,
          workspaceId: `ws-ind-${newProjectId}-${(s.studentId || s.id).replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
          repoStatus: "disconnected",
          totalCommits: 0,
          status: "active",
          progress: 0,
          proposalStatus: d.proposal.on ? "submitted" : "approved",
          createdAt: new Date().toISOString().split("T")[0],
        }));

        setProjectStudentAssignments(newProjectId, assignments);
      }

      showToast("Project successfully published to cohort!", "success");
      setDone(true);
    } catch (publishErr) {
      const msg = publishErr instanceof Error ? publishErr.message : "Failed to publish project";
      setErr(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  // 1. Completion View
  if (done) {
    return (
      <div className="max-w-[1100px] mx-auto py-2 px-2.5 sm:px-4">
        <div className="crumb">
          <a onClick={handleBackNavigation}>Projects</a> / <span>Create project</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground mb-1">
          Project published
        </h1>
        <p className="text-muted-foreground text-sm mb-4">
          Students in the selected batch can now see it.
        </p>

        <div className="proj-card space-y-4">
          <b className="text-foreground text-base">{title}</b>
          <p className="text-muted-foreground text-sm">
            {course} · Batch {batch} · {type === "group" ? "Group" : "Individual"} project
          </p>
          <div className="proj-row mt-4">
            <button className="proj-btn p" onClick={handleBackNavigation}>
              Back to projects
            </button>
            <button className="proj-btn" onClick={resetForm}>
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Step 1: Details
  const renderStep0 = () => (
    <>
      <div className="proj-sec">Project title</div>
      <input
        className="proj-in text-base py-3 px-3.5 bg-muted border border-border text-foreground rounded-[10px] focus:outline-none focus:border-accent"
        placeholder="e.g. Faculty Management System"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="proj-sec">Department</div>
      <div className="proj-grid">
        {contextDepartments.length === 0 ? (
          <div className="col-span-full p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning text-xs space-y-1">
            <p className="font-semibold">No academic departments created yet.</p>
            <p className="text-[11px] text-muted-foreground">
              An administrator must create an academic department in Department Management before creating projects.
            </p>
          </div>
        ) : (
          contextDepartments.map((dItem) => (
            <div
              key={dItem.id}
              className={`proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer ${
                dept.toLowerCase() === dItem.name.toLowerCase() ? "on border-accent bg-accent/10" : ""
              }`}
              onClick={() => {
                setDept(dItem.name);
                setCourse("");
              }}
            >
              <b className="text-foreground block text-base font-semibold">{dItem.name}</b>
              <span className="text-muted-foreground text-xs block mt-0.5 font-mono">Academic Department</span>
            </div>
          ))
        )}
      </div>

      <div className="proj-sec">Course</div>
      <div className="proj-grid">
        {courses.length === 0 ? (
          <div className="col-span-full p-4 rounded-xl border border-border bg-card text-muted-foreground text-xs">
            {dept
              ? `No courses assigned under "${dept}". Please create courses for this department in Course Catalog.`
              : "Please select an academic department above to view curriculum courses."}
          </div>
        ) : (
          courses.map((cItem) => (
            <div
              key={cItem.c}
              className={`proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer ${
                course === cItem.c ? "on border-accent bg-accent/10" : ""
              }`}
              onClick={() => setCourse(cItem.c)}
            >
              <b className="text-foreground block text-base font-semibold font-mono">{cItem.c}</b>
              <span className="text-muted-foreground text-xs block mt-0.5">{cItem.n}</span>
            </div>
          ))
        )}
      </div>

      <div className="proj-sec">Batch</div>
      <div className="chips">
        {BATCHES.map((b) => (
          <div
            key={b}
            className={`chip bg-muted border border-border text-muted-foreground hover:border-accent cursor-pointer ${
              batch === b ? "on bg-accent text-background border-accent font-bold" : ""
            }`}
            onClick={() => setBatch(b)}
          >
            {b}
          </div>
        ))}
      </div>
    </>
  );

  // 3. Step 2: Schedule & Type
  const renderStep1 = () => (
    <>
      <div className="proj-sec">Project type</div>
      <div className="proj-grid">
        <div
          className={`proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer ${
            type === "group" ? "on border-accent bg-accent/10" : ""
          }`}
          onClick={() => setType("group")}
        >
          <b className="text-foreground block text-base font-semibold">Group project</b>
          <span className="text-muted-foreground text-xs block mt-0.5">Students work in groups, one repo per group</span>
        </div>
        <div
          className={`proj-card proj-tile bg-card border border-border text-foreground hover:border-accent rounded-[16px] transition-all cursor-pointer ${
            type === "individual" ? "on border-accent bg-accent/10" : ""
          }`}
          onClick={() => setType("individual")}
        >
          <b className="text-foreground block text-base font-semibold">Individual project</b>
          <span className="text-muted-foreground text-xs block mt-0.5">Each student submits their own work</span>
        </div>
      </div>

      {type === "group" && (
        <>
          <div className="proj-sec">Groups</div>
          <label className="proj-card proj-tile block border-dashed text-center p-6 cursor-pointer hover:border-accent rounded-[16px]">
            <input
              type="file"
              accept=".pdf"
              hidden
              disabled={isExtractingPdf}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePdfUpload(e.target.files[0]);
                }
              }}
            />
            <b className="text-foreground">{pdfName || "Upload group list (PDF)"}</b>
            <br />
            <span className="text-muted-foreground text-xs">
              {isExtractingPdf
                ? "Extracting groups with Gemini AI..."
                : pdfName
                ? "Click to replace PDF"
                : "Click to choose a file"}
            </span>
          </label>

          {isExtractingPdf && (
            <div className="p-4 rounded-[12px] bg-accent/10 border border-accent/30 text-accent flex items-center gap-3 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
              <div className="text-xs">
                <p className="font-semibold">Gemini AI is reading and parsing the PDF table...</p>
                <p className="text-muted-foreground text-[11px]">Extracting student groups, IDs, and members.</p>
              </div>
            </div>
          )}

          {extractionError && (
            <div className="p-3.5 rounded-[12px] bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              <b>Extraction Notice:</b> {extractionError}
            </div>
          )}

          {extractedGroups && extractedGroups.length > 0 && (
            <div className="p-4 rounded-[14px] bg-card border border-emerald-500/30 text-foreground space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-sm">✓ Gemini AI Extracted</span>
                  <span className="text-xs text-muted-foreground">
                    ({extractedGroups.length} groups, {extractedGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0)} students)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {pdfName}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {extractedGroups.map((g, gIdx) => (
                  <div key={gIdx} className="p-2.5 rounded-[8px] bg-muted/40 border border-border text-xs">
                    <p className="font-semibold text-accent">{g.group_name || `Group ${g.group_number || gIdx + 1}`}</p>
                    <p className="text-[11px] text-muted-foreground">{g.members?.length || 0} members</p>
                    <div className="mt-1 space-y-0.5 max-h-16 overflow-y-auto text-[10.5px]">
                      {(g.members || []).map((m: any, mIdx: number) => (
                        <div key={mIdx} className="truncate text-foreground/80">
                          {m.student_id ? `${m.student_id} - ` : ""}{m.full_name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="proj-sec">Project duration</div>
      <div className="proj-two">
        <div className="proj-card">
          <label className="proj-label">Starts</label>
          <input
            className="proj-in"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="proj-card">
          <label className="proj-label">Ends</label>
          <input
            className="proj-in"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>
    </>
  );

  // 4. Step 3: Requirements
  const renderStep2 = () => (
    <>
      <div className="proj-sec">What will you evaluate, and for how many marks?</div>
      {reqs.map((r, i) => (
        <div key={i} className="proj-card proj-row mb-2.5">
          <div className="proj-ic">{i + 1}</div>
          <input
            className="proj-in flex-1"
            placeholder={`Requirement ${i + 1}`}
            value={r.t}
            onChange={(e) => {
              const updated = [...reqs];
              updated[i].t = e.target.value;
              setReqs(updated);
            }}
          />
          <input
            className="proj-in w-24"
            type="number"
            min="0"
            max="100"
            placeholder="Marks"
            value={r.m}
            onChange={(e) => {
              const updated = [...reqs];
              updated[i].m = e.target.value;
              setReqs(updated);
            }}
          />
          {reqs.length > 1 && (
            <button
              className="proj-btn"
              title="Remove"
              onClick={() => {
                const updated = reqs.filter((_, idx) => idx !== i);
                setReqs(updated);
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <div
        className="proj-card proj-tile text-center border-dashed cursor-pointer py-3 rounded-[16px] hover:border-accent"
        onClick={() => setReqs([...reqs, { t: "", m: "" }])}
      >
        <b className="text-foreground">+ Add requirement</b>
      </div>

      <div className="proj-card proj-row mt-3">
        <b className="text-foreground">Total marks</b>
        <span className="proj-sp"></span>
        <b
          className="text-xl font-mono tabular-nums"
          style={{
            color: reqTot() === 100 ? "var(--success)" : "var(--warning)",
          }}
        >
          {reqTot()} / 100
        </b>
      </div>
    </>
  );

  // 5. Step 4: Deliverables
  const renderStep3 = () => (
    <>
      <div className="proj-sec">Required deliverables</div>
      {DELIVERABLES.map(([k, n]) => {
        const item = d[k as keyof typeof d];
        const initials = n
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div key={k} className="proj-card mb-3">
            <div className="proj-row">
              <div className="proj-ic">{initials}</div>
              <div>
                <b className="text-foreground">{n}</b>
                <br />
                <span className={`proj-tag ${item.on ? "ok" : "no"}`}>
                  {item.on ? "Required" : "Not required"}
                </span>
              </div>
              <span className="proj-sp"></span>
              <div className="seg s">
                <button
                  type="button"
                  className={item.on ? "on" : ""}
                  onClick={() =>
                    setD((prev) => ({
                      ...prev,
                      [k]: { ...prev[k as keyof typeof d], on: true },
                    }))
                  }
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={!item.on ? "on" : ""}
                  onClick={() =>
                    setD((prev) => ({
                      ...prev,
                      [k]: { ...prev[k as keyof typeof d], on: false },
                    }))
                  }
                >
                  No
                </button>
              </div>
            </div>

            {item.on && (
              <div className="proj-two mt-3.5 pt-3 border-t border-border">
                <div>
                  <label className="proj-label">Opens</label>
                  <input
                    className="proj-in"
                    type="datetime-local"
                    value={item.f}
                    onChange={(e) => {
                      const val = e.target.value;
                      setD((prev) => ({
                        ...prev,
                        [k]: { ...prev[k as keyof typeof d], f: val },
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="proj-label">Due</label>
                  <input
                    className="proj-in"
                    type="datetime-local"
                    value={item.t}
                    onChange={(e) => {
                      const val = e.target.value;
                      setD((prev) => ({
                        ...prev,
                        [k]: { ...prev[k as keyof typeof d], t: val },
                      }));
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="max-w-[1100px] mx-auto py-2 px-2.5 sm:px-4">
      {/* Breadcrumb matching prototype */}
      <div className="crumb">
        <a onClick={handleBackNavigation}>Projects</a> / <span>Create project</span>
      </div>

      <h1 className="text-[22px] font-bold tracking-tight text-foreground mb-1">
        Create project
      </h1>
      <p className="text-muted-foreground text-sm mb-4">Step {step + 1} of 4</p>

      {/* Step Chips matching prototype */}
      <div className="chips">
        {["Details", "Schedule", "Requirements", "Deliverables"].map((n, i) => (
          <div
            key={n}
            className={`chip bg-muted border border-border text-muted-foreground ${
              i === step ? "on bg-accent text-background border-accent font-bold" : ""
            }`}
            style={{ cursor: "default" }}
          >
            {i + 1}. {n}
          </div>
        ))}
      </div>

      {/* Step Body */}
      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Bottom Actions */}
      <div className="proj-row mt-6">
        <span className="proj-err">{err}</span>
        <span className="proj-sp"></span>
        {step === 0 ? (
          <button className="proj-btn" onClick={handleBackNavigation}>
            Cancel
          </button>
        ) : (
          <button className="proj-btn" onClick={backS}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button className="proj-btn p" onClick={nextS}>
            Next
          </button>
        ) : (
          <button
            className="proj-btn p"
            disabled={isPublishing}
            onClick={publishP}
          >
            {isPublishing ? "Publishing..." : "Publish project"}
          </button>
        )}
      </div>
    </div>
  );
}
