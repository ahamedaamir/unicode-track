"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/context/AdminDataContext";
import { Project, Student } from "@/types/admin";
import { ProjectGroup, ProjectStudentAssignment } from "@/types/project";
import { DEFAULT_ER_DIAGRAM_RUBRIC } from "@/types/er-diagram";

const BATCHES = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"] as const;

const DEPTS = [
  { name: "Computer Science", sub: "Algorithms, systems, AI" },
  { name: "Information Systems", sub: "Business and data systems" },
  { name: "Software Engineering", sub: "Design, build, test" },
];

const DEFAULT_COURSES = [
  { c: "ICT2132", n: "Software Engineering" },
  { c: "ICT2152", n: "Systems Analysis & Design" },
  { c: "ICT2162", n: "Management Information Systems" },
];

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

  // Merge available courses
  const courses = React.useMemo(() => {
    if (contextCourses && contextCourses.length > 0) {
      return contextCourses.map((c) => ({ c: c.code, n: c.name }));
    }
    return DEFAULT_COURSES;
  }, [contextCourses]);

  const currentLecturer =
    lecturers.find((l) => l.email === activeLecturerEmail) || lecturers[0];

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
        lecturerId: currentLecturer?.id || "lec-1",
        lecturerName: currentLecturer?.name || "Dr. Evelyn Reed",
        erDiagramRequired: d.er.on,
        erDiagramDeadline: d.er.t ? new Date(d.er.t).toISOString() : undefined,
        databaseRequired: d.er.on,
        databaseRequirements: d.er.on
          ? "Normalized relational database design (3NF), ER diagram, and DDL schema."
          : undefined,
        githubRequired: d.repo.on,
        finalReportRequired: d.report.on,
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

      // If group project: seed initial group workspaces
      if (type === "group" && setProjectGroups) {
        const initialGroups: ProjectGroup[] = [1, 2, 3, 4].map((gNum) => ({
          id: `grp-${newProjectId}-${gNum}`,
          projectId: newProjectId,
          groupNumber: gNum,
          groupName: `Group ${gNum}`,
          workspaceId: `ws-${newProjectId}-${gNum}`,
          members: [
            {
              studentId: `TG/2004/${2000 + gNum * 10 + 1}`,
              fullName: `Student Alpha ${gNum}`,
              email: `student.${gNum}.1@university.edu`,
              department: dept,
              academicYear,
              semester,
              role: "Team Lead",
              commitsCount: 12,
            },
            {
              studentId: `TG/2004/${2000 + gNum * 10 + 2}`,
              fullName: `Student Beta ${gNum}`,
              email: `student.${gNum}.2@university.edu`,
              department: dept,
              academicYear,
              semester,
              role: "Member",
              commitsCount: 8,
            },
            {
              studentId: `TG/2004/${2000 + gNum * 10 + 3}`,
              fullName: `Student Gamma ${gNum}`,
              email: `student.${gNum}.3@university.edu`,
              department: dept,
              academicYear,
              semester,
              role: "Member",
              commitsCount: 6,
            },
            {
              studentId: `TG/2004/${2000 + gNum * 10 + 4}`,
              fullName: `Student Delta ${gNum}`,
              email: `student.${gNum}.4@university.edu`,
              department: dept,
              academicYear,
              semester,
              role: "Member",
              commitsCount: 4,
            },
          ],
          repoStatus: "connected",
          repoName: `uor-ict/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-group-${gNum}`,
          repoUrl: `https://github.com/uor-ict/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-group-${gNum}`,
          totalCommits: 30,
          status: "active",
          progress: 50,
          proposalStatus: d.proposal.on ? "submitted" : "approved",
          createdAt: new Date().toISOString().split("T")[0],
        }));

        setProjectGroups(newProjectId, initialGroups);
      }

      // If individual project: seed personal workspaces
      if (type === "individual" && setProjectStudentAssignments) {
        const eligibleStudents = students.filter(
          (s) => s.academicYear === academicYear && s.semester === semester
        );
        const targetStudents =
          eligibleStudents.length > 0 ? eligibleStudents.slice(0, 5) : students.slice(0, 5);

        const assignments: ProjectStudentAssignment[] = targetStudents.map((s) => ({
          id: `asgn-${newProjectId}-${s.studentId || s.id}`,
          projectId: newProjectId,
          studentId: s.studentId || s.id,
          studentEmail: s.email,
          studentName: s.fullName,
          departmentId: s.departmentId || matchingDept?.id || "dept-1",
          academicYear,
          semester,
          workspaceId: `ws-ind-${newProjectId}-${(s.studentId || s.id).replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
          repoStatus: d.repo.on ? "connected" : "disconnected",
          repoName: `uor-ict/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${s.studentId?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "student"}`,
          repoUrl: `https://github.com/uor-ict/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${s.studentId?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "student"}`,
          totalCommits: 14,
          status: "active",
          progress: 40,
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
      <div className="max-w-[1100px] mx-auto py-2 px-1 sm:px-4">
        <div className="crumb">
          <a onClick={handleBackNavigation}>Projects</a> / <span>Create project</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-white mb-1">
          Project published
        </h1>
        <p className="text-slate-400 text-sm mb-4">
          Students in the selected batch can now see it.
        </p>

        <div className="proj-card space-y-4">
          <b className="text-white text-base">{title}</b>
          <p className="text-slate-400 text-sm">
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
        className="proj-in text-base py-3 px-3.5 bg-[#0e1626] border border-[#1e293b] text-white rounded-lg focus:outline-none focus:border-teal-500"
        placeholder="e.g. Faculty Management System"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="proj-sec">Department</div>
      <div className="proj-grid">
        {DEPTS.map((dItem) => (
          <div
            key={dItem.name}
            className={`proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all ${
              dept === dItem.name ? "on border-teal-500 bg-teal-500/15" : ""
            }`}
            onClick={() => setDept(dItem.name)}
          >
            <b className="text-white block text-base font-semibold">{dItem.name}</b>
            <span className="text-slate-400 text-xs block mt-0.5">{dItem.sub}</span>
          </div>
        ))}
      </div>

      <div className="proj-sec">Course</div>
      <div className="proj-grid">
        {courses.map((cItem) => (
          <div
            key={cItem.c}
            className={`proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all ${
              course === cItem.c ? "on border-teal-500 bg-teal-500/15" : ""
            }`}
            onClick={() => setCourse(cItem.c)}
          >
            <b className="text-white block text-base font-semibold">{cItem.c}</b>
            <span className="text-slate-400 text-xs block mt-0.5">{cItem.n}</span>
          </div>
        ))}
      </div>

      <div className="proj-sec">Batch</div>
      <div className="chips">
        {BATCHES.map((b) => (
          <div
            key={b}
            className={`chip bg-[#0e1626] border border-[#1e293b] text-slate-300 hover:border-teal-500 ${
              batch === b ? "on bg-teal-500 border-teal-500 text-[#070b13] font-bold" : ""
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
          className={`proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all ${
            type === "group" ? "on border-teal-500 bg-teal-500/15" : ""
          }`}
          onClick={() => setType("group")}
        >
          <b className="text-white block text-base font-semibold">Group project</b>
          <span className="text-slate-400 text-xs block mt-0.5">Students work in groups, one repo per group</span>
        </div>
        <div
          className={`proj-card proj-tile bg-[#0e1626] border border-[#1e293b] text-white hover:border-teal-500 rounded-xl transition-all ${
            type === "individual" ? "on border-teal-500 bg-teal-500/15" : ""
          }`}
          onClick={() => setType("individual")}
        >
          <b className="text-white block text-base font-semibold">Individual project</b>
          <span className="text-slate-400 text-xs block mt-0.5">Each student submits their own work</span>
        </div>
      </div>

      {type === "group" && (
        <>
          <div className="proj-sec">Groups</div>
          <label className="proj-card proj-tile block border-dashed text-center p-6 cursor-pointer hover:border-teal-500">
            <input
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setPdfName(e.target.files[0].name);
                  setPdfFile(e.target.files[0]);
                }
              }}
            />
            <b>{pdfName || "Upload group list (PDF)"}</b>
            <br />
            <span className="text-slate-400 text-xs">
              {pdfName ? "Click to replace" : "Click to choose a file"}
            </span>
          </label>
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
        className="proj-card proj-tile text-center border-dashed cursor-pointer py-3"
        onClick={() => setReqs([...reqs, { t: "", m: "" }])}
      >
        <b>+ Add requirement</b>
      </div>

      <div className="proj-card proj-row mt-3">
        <b>Total marks</b>
        <span className="proj-sp"></span>
        <b
          className="text-xl"
          style={{
            color: reqTot() === 100 ? "#16a34a" : "#d97706",
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
                <b>{n}</b>
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
              <div className="proj-two mt-3.5 pt-3 border-t border-[#1e293b]">
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
    <div className="max-w-[1100px] mx-auto py-2 px-1 sm:px-4">
      {/* Breadcrumb matching prototype */}
      <div className="crumb">
        <a onClick={handleBackNavigation}>Projects</a> / <span>Create project</span>
      </div>

      <h1 className="text-[22px] font-bold tracking-tight text-white mb-1">
        Create project
      </h1>
      <p className="text-slate-400 text-sm mb-4">Step {step + 1} of 4</p>

      {/* Step Chips matching prototype */}
      <div className="chips">
        {["Details", "Schedule", "Requirements", "Deliverables"].map((n, i) => (
          <div
            key={n}
            className={`chip bg-[#0e1626] border border-[#1e293b] text-slate-300 ${
              i === step ? "on bg-teal-500 border-teal-500 text-[#070b13] font-bold" : ""
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
