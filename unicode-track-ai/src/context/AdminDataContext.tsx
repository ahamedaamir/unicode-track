"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Department, Course, Lecturer, Student, ActivityLog, Project } from "@/types/admin";
import { ProjectGroup, ProjectTimelineActivity, ProposalSubmission, LecturerFeedback, GitHubCommit, GitHubBranch, ProjectStudentAssignment } from "@/types/project";
import { EvaluationRubric, ProjectEvaluation, DEFAULT_ACADEMIC_RUBRIC_CRITERIA } from "@/types/evaluation";
import {
  ERDiagramSubmission,
  ERDiagramAIAnalysis,
  ERLecturerFeedback,
  DEFAULT_ER_DIAGRAM_RUBRIC,
  ProjectDatabaseDesignConfig,
} from "@/types/er-diagram";
import { getDemoCProjectCommits } from "@/services/github/client";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AdminDataContextType {
  departments: Department[];
  courses: Course[];
  lecturers: Lecturer[];
  students: Student[];
  activities: ActivityLog[];
  addDepartment: (name: string) => { success: boolean; error?: string };
  editDepartment: (id: string, name: string) => { success: boolean; error?: string };
  deleteDepartment: (id: string) => void;
  addCourse: (code: string, name: string, departmentId?: string) => { success: boolean; error?: string };
  editCourse: (id: string, code: string, name: string, departmentId?: string) => { success: boolean; error?: string };
  deleteCourse: (id: string) => void;
  addLecturer: (data: {
    name: string;
    email: string;
    position: "Senior" | "Probationary";
    departmentId?: string;
    assignedCourses: string[];
  }) => { success: boolean; lecturer?: Lecturer; error?: string };
  editLecturer: (id: string, updates: Partial<Lecturer>) => { success: boolean; error?: string };
  toggleLecturerStatus: (id: string) => void;
  deleteLecturer: (id: string) => void;
  changeLecturerPassword: (email: string, newPass: string) => boolean;
  findLecturerByEmail: (email: string) => Lecturer | undefined;

  // Student Management
  addStudent: (data: {
    fullName: string;
    email: string;
    departmentId: string;
    academicYear: 1 | 2 | 3 | 4;
    semester: 1 | 2;
    defaultPassword: string;
  }) => { success: boolean; student?: Student; error?: string };
  editStudent: (
    id: string,
    updates: Partial<Omit<Student, "id" | "createdAt">>
  ) => { success: boolean; error?: string };
  toggleStudentStatus: (id: string) => void;
  deleteStudent: (id: string) => void;
  findStudentByEmail: (email: string) => Student | undefined;
  changeStudentPassword: (email: string, newPass: string) => boolean;

  // Project Management (Lecturer & Admin)
  projects: Project[];
  addProject: (
    data: Omit<Project, "id" | "createdAt">,
    initialProjectGroups?: ProjectGroup[]
  ) => { success: boolean; project?: Project; error?: string };
  editProject: (id: string, updates: Partial<Project>) => { success: boolean; error?: string };
  publishProject: (id: string) => void;
  archiveProject: (id: string) => void;
  deleteProject: (id: string) => void;
  getProjectsForStudent: (studentEmail?: string) => Project[];
  getStudentAssignedGroup: (projectId: string, studentEmail?: string) => ProjectGroup | undefined;

  // Academic Group Workspaces & GitHub Integration
  groups: ProjectGroup[];
  addGroup: (data: Omit<ProjectGroup, "id" | "createdAt">) => { success: boolean; group?: ProjectGroup };
  setProjectGroups: (projectId: string, newGroups: ProjectGroup[]) => void;
  updateGroup: (id: string, updates: Partial<ProjectGroup>) => { success: boolean };

  // Individual Student Personal Workspaces
  studentAssignments: ProjectStudentAssignment[];
  setProjectStudentAssignments: (projectId: string, assignments: ProjectStudentAssignment[]) => void;
  getStudentAssignment: (projectId: string, studentEmail?: string) => ProjectStudentAssignment | undefined;
  getAssignmentsForProject: (projectId: string) => ProjectStudentAssignment[];
  connectRepoToGroup: (groupId: string, repoUrl: string) => Promise<{ success: boolean; error?: string }>;
  syncGroupRepo: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  submitProposal: (
    groupId: string,
    data: {
      title: string;
      description: string;
      fileName: string;
      fileSize: string;
      submittedBy: string;
      submittedByEmail: string;
    }
  ) => { success: boolean; proposal?: ProposalSubmission };
  reviewProposal: (
    groupId: string,
    decision: "approved" | "changes_requested",
    comments: string,
    rubricScore?: number
  ) => { success: boolean };

  // Project Activity Timeline
  timelineActivities: ProjectTimelineActivity[];
  addTimelineActivity: (activity: Omit<ProjectTimelineActivity, "id" | "timestamp">) => void;

  // Evaluation Rubrics & Reviews
  rubrics: Record<string, EvaluationRubric>;
  getRubricForProject: (projectId: string) => EvaluationRubric;
  saveRubric: (projectId: string, rubric: EvaluationRubric) => { success: boolean };
  evaluations: ProjectEvaluation[];
  getEvaluationForGroup: (groupId: string) => ProjectEvaluation | undefined;
  saveEvaluation: (evaluation: ProjectEvaluation) => { success: boolean };
  updateEvaluationCriterionScore: (
    evaluationId: string,
    criterionId: string,
    lecturerScore: number,
    lecturerNotes?: string
  ) => { success: boolean };
  approveEvaluation: (evaluationId: string, lecturerComments?: string) => { success: boolean };
  publishEvaluation: (evaluationId: string) => { success: boolean };

  // ER Diagram & Database Evaluation
  erSubmissions: ERDiagramSubmission[];
  getERSubmissionForGroup: (groupId: string) => ERDiagramSubmission | undefined;
  submitERDiagram: (
    groupId: string,
    data: {
      fileName: string;
      fileSize: string;
      fileType: "pdf" | "png" | "jpg" | "jpeg";
      fileUrl: string;
      versionNote?: string;
      submittedByName: string;
      submittedByEmail: string;
    }
  ) => { success: boolean; submission?: ERDiagramSubmission };
  saveERAnalysis: (submissionId: string, analysis: ERDiagramAIAnalysis) => { success: boolean };
  saveERFeedback: (submissionId: string, feedback: ERLecturerFeedback) => { success: boolean };
  publishERFeedback: (submissionId: string) => { success: boolean };

  // Active Role & Personas
  activeRole: "admin" | "lecturer" | "student";
  setActiveRole: (role: "admin" | "lecturer" | "student") => void;
  activeAdminEmail: string;
  setActiveAdminEmail: (email: string) => void;
  activeLecturerEmail: string;
  setActiveLecturerEmail: (email: string) => void;
  activeStudentEmail: string;
  setActiveStudentEmail: (email: string) => void;

  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  dismissToast: () => void;
}

const STORAGE_KEY = "unicodetrack_admin_store_v2";

const initialDepartments: Department[] = [];
const initialCourses: Course[] = [];
const initialLecturers: Lecturer[] = [];
const initialStudents: Student[] = [];
const initialProjects: Project[] = [];
const initialGroups: ProjectGroup[] = [];
const initialStudentAssignments: ProjectStudentAssignment[] = [];
const initialTimelineActivities: ProjectTimelineActivity[] = [];
const initialRubrics: Record<string, EvaluationRubric> = {};
const initialEvaluations: ProjectEvaluation[] = [];
const initialERSubmissions: ERDiagramSubmission[] = [];
const initialActivities: ActivityLog[] = [];

const logSupabaseNotice = (operation: string, error: any) => {
  if (!error) return;
  const msg = error.message || String(error);
  if (
    error.code === "PGRST205" ||
    msg.includes("schema cache") ||
    msg.includes("relation") ||
    msg.includes("does not exist")
  ) {
    console.warn(`[Supabase Storage Notice] Remote table not yet migrated during '${operation}' (${msg}). Action was successfully preserved in local persistence.`);
  } else {
    console.warn(`[Supabase Notice] ${operation}:`, msg);
  }
};

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  // Master state arrays (storing all academic entities across all tenant admins)
  const [masterDepartments, setMasterDepartments] = useState<Department[]>(initialDepartments);
  const [masterCourses, setMasterCourses] = useState<Course[]>(initialCourses);
  const [masterLecturers, setMasterLecturers] = useState<Lecturer[]>(initialLecturers);
  const [masterStudents, setMasterStudents] = useState<Student[]>(initialStudents);
  const [masterActivities, setMasterActivities] = useState<ActivityLog[]>(initialActivities);
  const [masterProjects, setMasterProjects] = useState<Project[]>(initialProjects);

  const [activeRole, setActiveRole] = useState<"admin" | "lecturer" | "student">("admin");
  const [activeAdminEmail, setActiveAdminEmail] = useState<string>("admin@university.edu");
  const [activeLecturerEmail, setActiveLecturerEmail] = useState<string>("");
  const [activeStudentEmail, setActiveStudentEmail] = useState<string>("");

  const [groups, setGroups] = useState<ProjectGroup[]>(initialGroups);
  const [studentAssignments, setStudentAssignments] = useState<ProjectStudentAssignment[]>(initialStudentAssignments);
  const [timelineActivities, setTimelineActivities] = useState<ProjectTimelineActivity[]>(initialTimelineActivities);
  const [rubrics, setRubrics] = useState<Record<string, EvaluationRubric>>(initialRubrics);
  const [evaluations, setEvaluations] = useState<ProjectEvaluation[]>(initialEvaluations);
  const [erSubmissions, setERSubmissions] = useState<ERDiagramSubmission[]>(initialERSubmissions);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Hydrate client-only storage on mount to eliminate SSR hydration mismatches
  useEffect(() => {
    try {
      const storedRole = sessionStorage.getItem("unicodetrack_pending_user_role");
      if (storedRole === "admin" || storedRole === "lecturer" || storedRole === "student") {
        setActiveRole(storedRole);
      }
      const storedAdmin = sessionStorage.getItem("unicodetrack_active_admin_email");
      if (storedAdmin) {
        setActiveAdminEmail(storedAdmin.trim().toLowerCase());
      }
      const user = sessionStorage.getItem("unicodetrack_authenticated_user");
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.email) {
          if (parsed.role === "admin") {
            setActiveAdminEmail(parsed.email.trim().toLowerCase());
          } else if (parsed.role === "lecturer") {
            setActiveLecturerEmail(parsed.email.trim().toLowerCase());
          } else if (parsed.role === "student") {
            setActiveStudentEmail(parsed.email.trim().toLowerCase());
          }
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.departments && Array.isArray(parsed.departments)) {
          setMasterDepartments(parsed.departments.map((d: Department) => ({ ...d, adminEmail: d.adminEmail || "admin@university.edu" })));
        }
        if (parsed.courses && Array.isArray(parsed.courses)) {
          setMasterCourses(parsed.courses.map((c: Course) => ({ ...c, adminEmail: c.adminEmail || "admin@university.edu" })));
        }
        if (parsed.lecturers && Array.isArray(parsed.lecturers)) {
          setMasterLecturers(
            parsed.lecturers
              .map((l: Lecturer) => ({
                ...l,
                adminEmail: l.adminEmail || "admin@university.edu",
                defaultPassword: l.defaultPassword === "UniCode@2004" ? "12345678" : (l.defaultPassword || "12345678"),
              }))
          );
        }
        if (parsed.students && Array.isArray(parsed.students)) {
          setMasterStudents(
            parsed.students.map((s: Student) => ({ ...s, adminEmail: s.adminEmail || "admin@university.edu" }))
          );
        }
        if (parsed.activities && Array.isArray(parsed.activities)) {
          setMasterActivities(
            parsed.activities.map((a: ActivityLog) => ({ ...a, adminEmail: a.adminEmail || "admin@university.edu" }))
          );
        }
        if (parsed.projects && Array.isArray(parsed.projects)) {
          setMasterProjects(
            parsed.projects.map((p: Project) => ({ ...p, adminEmail: p.adminEmail || "admin@university.edu" }))
          );
        }
        if (parsed.groups && Array.isArray(parsed.groups)) {
          setGroups(parsed.groups);
        }
        if (parsed.timelineActivities && Array.isArray(parsed.timelineActivities)) {
          setTimelineActivities(parsed.timelineActivities);
        }
      }

      const savedAssignments = localStorage.getItem("unicodetrack_student_assignments_v1");
      if (savedAssignments) {
        setStudentAssignments(JSON.parse(savedAssignments));
      }
      const savedRubrics = localStorage.getItem("unicodetrack_rubrics_store");
      if (savedRubrics) {
        setRubrics(JSON.parse(savedRubrics));
      }
      const savedEvaluations = localStorage.getItem("unicodetrack_evaluations_store");
      if (savedEvaluations) {
        setEvaluations(JSON.parse(savedEvaluations));
      }
      const savedER = localStorage.getItem("unicodetrack_er_submissions_store");
      if (savedER) {
        setERSubmissions(JSON.parse(savedER));
      }
    } catch { }
  }, []);

  // Sync real database tables from Supabase on mount
  useEffect(() => {
    if (typeof window === "undefined" || !isSupabaseConfigured()) return;
    try {
      const supabase = createClient();

      // 1. Fetch departments
      supabase.from("departments").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setMasterDepartments((prev) => {
            const dbDepts = data.map((d: any) => ({
              id: d.id,
              name: d.name,
              createdAt: d.created_at ? d.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
              adminEmail: d.admin_email || "admin@university.edu",
            }));
            const map = new Map(prev.map((item) => [item.id, item]));
            dbDepts.forEach((d: Department) => map.set(d.id, { ...map.get(d.id), ...d }));
            return Array.from(map.values());
          });
        }
      });

      // 2. Fetch courses
      supabase.from("courses").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setMasterCourses((prev) => {
            const dbCourses = data.map((c: any) => ({
              id: c.id,
              code: c.course_code || c.code,
              name: c.course_name || c.name,
              createdAt: c.created_at ? c.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
              adminEmail: c.admin_email || "admin@university.edu",
            }));
            const map = new Map(prev.map((item) => [item.id, item]));
            dbCourses.forEach((c: Course) => map.set(c.id, { ...map.get(c.id), ...c }));
            return Array.from(map.values());
          });
        }
      });

      // 3. Fetch lecturers from Supabase
      supabase.from("lecturers").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const dbLecturers: Lecturer[] = data
            .map((l: any) => ({
              id: l.id,
              name: l.name,
              email: l.email,
              position: l.position || "Senior",
              assignedCourses: l.assigned_courses || [],
              status: l.status || "Active",
              hasChangedDefaultPassword: Boolean(l.has_changed_default_password),
              defaultPassword: l.default_password || "",
              createdAt: l.created_at ? l.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
              adminEmail: l.admin_email || "admin@university.edu",
            }));
          if (dbLecturers.length > 0) {
            setMasterLecturers((prev) => {
              const map = new Map(prev.map((item) => [item.id, item]));
              dbLecturers.forEach((l) => map.set(l.id, { ...map.get(l.id), ...l }));
              return Array.from(map.values());
            });
          }
        }
      });

      // 4. Fetch students from Supabase
      supabase.from("students").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const dbStudents: Student[] = data.map((s: any) => ({
            id: s.student_id || s.id,
            studentId: s.student_id,
            fullName: s.full_name,
            email: s.email,
            departmentId: s.department_id || "",
            academicYear: s.academic_year || 1,
            semester: s.semester || 1,
            defaultPassword: s.default_password || "",
            profilePhotoUrl: s.profile_photo_url || null,
            accountStatus: s.account_status || "active",
            mustChangePassword: Boolean(s.must_change_password),
            createdAt: s.created_at ? s.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            adminEmail: s.admin_email || "admin@university.edu",
          }));
          if (dbStudents.length > 0) {
            setMasterStudents((prev) => {
              const map = new Map(prev.map((item) => [item.id, item]));
              dbStudents.forEach((s) => map.set(s.id, { ...map.get(s.id), ...s }));
              return Array.from(map.values());
            });
          }
        }
      });

      // 5. Fetch projects
      supabase.from("projects").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const dbProjects: Project[] = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            type: p.type || (p.project_type === "individual" ? "Individual Project" : "Group Project"),
            departmentId: p.department_id,
            courseCode: p.course_code,
            academicYear: p.academic_year || 1,
            semester: p.semester || 1,
            deadline: p.deadline,
            status: p.status || "Draft",
            lecturerId: p.lecturer_id,
            lecturerName: p.lecturer_name,
            requirements: p.requirements,
            proposalRequired: p.proposal_required !== undefined ? Boolean(p.proposal_required) : undefined,
            githubRequired: p.github_required !== undefined ? Boolean(p.github_required) : undefined,
            erDiagramRequired: p.er_diagram_required !== undefined ? Boolean(p.er_diagram_required) : undefined,
            databaseRequired: p.database_required !== undefined ? Boolean(p.database_required) : undefined,
            finalReportRequired: p.final_report_required !== undefined ? Boolean(p.final_report_required) : undefined,
            createdAt: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            adminEmail: p.admin_email || "admin@university.edu",
          }));
          setMasterProjects((prev) => {
            const map = new Map(prev.map((item) => [item.id, item]));
            dbProjects.forEach((p) => map.set(p.id, { ...map.get(p.id), ...p }));
            return Array.from(map.values());
          });
        }
      });

      // 6. Fetch student groups
      supabase.from("student_groups").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setGroups(data.map((g: any, index: number) => ({
            id: g.id,
            projectId: g.project_id || "",
            groupNumber: index + 1,
            groupName: g.group_name || `Group 0${index + 1}`,
            proposalStatus: "submitted",
            githubRepoStatus: "connected",
            members: [],
          } as any)));
        }
      });
    } catch { }
  }, []);

  // Sync projects from Supabase API on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.projects && data.projects.length > 0) {
          setMasterProjects((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newFromDb = data.projects.filter((p: Project) => !existingIds.has(p.id));
            if (newFromDb.length > 0) {
              return [...prev, ...newFromDb];
            }
            return prev;
          });
        }
      })
      .catch(() => { });
  }, []);

  // Resolve which Admin faculty this session belongs to
  const effectiveAdminEmail = useMemo(() => {
    if (activeRole === "admin") {
      return (activeAdminEmail || "admin@university.edu").trim().toLowerCase();
    }
    if (activeRole === "lecturer") {
      const currentLec = masterLecturers.find(
        (l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase()
      );
      return (currentLec?.adminEmail || activeAdminEmail || "admin@university.edu").trim().toLowerCase();
    }
    if (activeRole === "student") {
      const currentStd = masterStudents.find(
        (s) => s.email.toLowerCase() === activeStudentEmail.toLowerCase()
      );
      return (currentStd?.adminEmail || activeAdminEmail || "admin@university.edu").trim().toLowerCase();
    }
    return (activeAdminEmail || "admin@university.edu").trim().toLowerCase();
  }, [activeRole, activeAdminEmail, activeLecturerEmail, activeStudentEmail, masterLecturers, masterStudents]);

  const currentLecturer = useMemo(() => {
    return masterLecturers.find((l) => l.email.toLowerCase() === activeLecturerEmail.toLowerCase());
  }, [masterLecturers, activeLecturerEmail]);

  // Scoped views for the current active admin/faculty
  // Multi-tenancy: One admin cannot see or access another admin's lecturers, students, courses, or departments
  const departments = useMemo(() => {
    return masterDepartments.filter((d) => {
      const email = (d.adminEmail || "admin@university.edu").toLowerCase();
      return email === effectiveAdminEmail || (effectiveAdminEmail === "admin@university.edu" && !d.adminEmail);
    });
  }, [masterDepartments, effectiveAdminEmail]);

  const courses = useMemo(() => {
    return masterCourses.filter((c) => {
      const crsAdmin = (c.adminEmail || "admin@university.edu").toLowerCase();
      if (crsAdmin === effectiveAdminEmail || (effectiveAdminEmail === "admin@university.edu" && !c.adminEmail)) {
        return true;
      }
      if (activeRole === "lecturer" && currentLecturer) {
        if (currentLecturer.assignedCourses?.includes(c.code)) return true;
      }
      return false;
    });
  }, [masterCourses, effectiveAdminEmail, activeRole, currentLecturer]);

  const lecturers = useMemo(() => {
    return masterLecturers.filter((l) => {
      const email = (l.adminEmail || "admin@university.edu").toLowerCase();
      return email === effectiveAdminEmail || (effectiveAdminEmail === "admin@university.edu" && !l.adminEmail);
    });
  }, [masterLecturers, effectiveAdminEmail]);

  const students = useMemo(() => {
    return masterStudents.filter((s) => {
      const email = (s.adminEmail || "admin@university.edu").toLowerCase();
      return email === effectiveAdminEmail || (effectiveAdminEmail === "admin@university.edu" && !s.adminEmail);
    });
  }, [masterStudents, effectiveAdminEmail]);

  const projects = useMemo(() => {
    return masterProjects.filter((p) => {
      const projAdmin = (p.adminEmail || "admin@university.edu").toLowerCase();
      if (projAdmin === effectiveAdminEmail || (effectiveAdminEmail === "admin@university.edu" && !p.adminEmail)) {
        return true;
      }
      if (activeRole === "lecturer" && currentLecturer) {
        if (currentLecturer.assignedCourses?.includes(p.courseCode)) return true;
      }
      return false;
    });
  }, [masterProjects, effectiveAdminEmail, activeRole, currentLecturer]);

  const activities = useMemo(() => {
    return masterActivities.filter((a) => {
      const email = (a.adminEmail || "admin@university.edu").toLowerCase();
      return email === effectiveAdminEmail || (effectiveAdminEmail === "admin@university.edu" && !a.adminEmail);
    });
  }, [masterActivities, effectiveAdminEmail]);

  // Sync to localStorage with persistent non-destructive merging
  const persist = (
    deptList?: Department[],
    crsList?: Course[],
    lecList?: Lecturer[],
    stdList?: Student[],
    actList?: ActivityLog[],
    projList?: Project[],
    grpList?: ProjectGroup[],
    timelineList?: ProjectTimelineActivity[]
  ) => {
    try {
      let existing: any = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) existing = JSON.parse(raw);
      } catch { }

      const departmentsToSave = deptList !== undefined ? deptList : (masterDepartments.length > 0 ? masterDepartments : (existing.departments || []));
      const coursesToSave = crsList !== undefined ? crsList : (masterCourses.length > 0 ? masterCourses : (existing.courses || []));
      const lecturersToSave = lecList !== undefined ? lecList : (masterLecturers.length > 0 ? masterLecturers : (existing.lecturers || []));
      const studentsToSave = stdList !== undefined ? stdList : (masterStudents.length > 0 ? masterStudents : (existing.students || []));
      const activitiesToSave = actList !== undefined ? actList : (masterActivities.length > 0 ? masterActivities : (existing.activities || []));
      const projectsToSave = projList !== undefined ? projList : (masterProjects.length > 0 ? masterProjects : (existing.projects || []));
      const groupsToSave = grpList !== undefined ? grpList : (groups.length > 0 ? groups : (existing.groups || []));
      const timelineToSave = timelineList !== undefined ? timelineList : (timelineActivities.length > 0 ? timelineActivities : (existing.timelineActivities || []));

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          departments: departmentsToSave,
          courses: coursesToSave,
          lecturers: lecturersToSave,
          students: studentsToSave,
          activities: activitiesToSave,
          projects: projectsToSave,
          groups: groupsToSave,
          timelineActivities: timelineToSave,
        })
      );
    } catch { }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  const dismissToast = () => setToast(null);

  const addActivity = (action: string, target: string, type: ActivityLog["type"]) => {
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      user: activeRole === "admin" ? "Administrator" : "User",
      action,
      target,
      time: "Just now",
      type,
      adminEmail: effectiveAdminEmail,
    };
    const updated = [newAct, ...masterActivities.slice(0, 49)];
    setMasterActivities(updated);
    return updated;
  };

  // ==========================================
  // Department Actions (Admin Only)
  // ==========================================
  const addDepartment = (name: string) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can create departments." };
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Department Name is required" };
    }
    const exists = departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return { success: false, error: "A department with this name already exists in your faculty" };
    }

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString().split("T")[0],
      adminEmail: effectiveAdminEmail,
    };
    const updatedDepts = [newDept, ...masterDepartments];
    setMasterDepartments(updatedDepts);
    const updatedActs = addActivity("created new department", trimmed, "department");
    persist(updatedDepts, masterCourses, masterLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("departments").insert({
          id: newDept.id,
          name: newDept.name,
          admin_email: newDept.adminEmail,
        }).then(({ error }) => {
          if (error) logSupabaseNotice("insert department", error);
        });
      } catch { }
    }
    showToast(`Department "${trimmed}" created successfully!`, "success");
    return { success: true };
  };

  const editDepartment = (id: string, name: string) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can edit departments." };
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Department Name is required" };
    }
    const exists = departments.some(
      (d) => d.id !== id && d.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return { success: false, error: "Another department in your faculty already has this name" };
    }

    const updatedDepts = masterDepartments.map((d) => (d.id === id ? { ...d, name: trimmed } : d));
    setMasterDepartments(updatedDepts);
    const updatedActs = addActivity("updated department name to", trimmed, "department");
    persist(updatedDepts, masterCourses, masterLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("departments").update({ name: trimmed }).eq("id", id).then(({ error }) => {
          if (error) logSupabaseNotice("update department", error);
        });
      } catch { }
    }
    showToast(`Department updated to "${trimmed}"`, "success");
    return { success: true };
  };

  const deleteDepartment = (id: string) => {
    if (activeRole !== "admin") return;
    const dept = masterDepartments.find((d) => d.id === id);
    const updatedDepts = masterDepartments.filter((d) => d.id !== id);
    setMasterDepartments(updatedDepts);
    const updatedActs = addActivity("deleted department", dept?.name || id, "department");
    persist(updatedDepts, masterCourses, masterLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("departments").delete().eq("id", id).then(({ error }) => {
          if (error) logSupabaseNotice("delete department", error);
        });
      } catch { }
    }
    showToast(`Department "${dept?.name}" removed`, "info");
  };

  // ==========================================
  // Course Actions (Admin Only)
  // ==========================================
  const addCourse = (code: string, name: string, departmentId?: string) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can create courses." };
    }
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) return { success: false, error: "Course Code is required" };
    if (!trimmedName) return { success: false, error: "Course Name is required" };

    const duplicateCode = courses.some((c) => c.code.toUpperCase() === trimmedCode);
    if (duplicateCode) {
      return { success: false, error: `Course Code "${trimmedCode}" already exists in your faculty` };
    }

    const deptObj = departmentId ? masterDepartments.find((d) => d.id === departmentId) : undefined;

    const newCourse: Course = {
      id: `crs-${Date.now()}`,
      code: trimmedCode,
      name: trimmedName,
      departmentId: departmentId || (masterDepartments.length > 0 ? masterDepartments[0].id : undefined),
      departmentName: deptObj?.name || (masterDepartments.length > 0 ? masterDepartments[0].name : undefined),
      createdAt: new Date().toISOString().split("T")[0],
      adminEmail: effectiveAdminEmail,
    };
    const updatedCourses = [newCourse, ...masterCourses];
    setMasterCourses(updatedCourses);
    const updatedActs = addActivity("added course", `${trimmedCode}: ${trimmedName}`, "course");
    persist(masterDepartments, updatedCourses, masterLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("courses").insert({
          id: newCourse.id,
          code: newCourse.code,
          course_code: newCourse.code,
          name: newCourse.name,
          course_name: newCourse.name,
          department_id: newCourse.departmentId,
          admin_email: newCourse.adminEmail,
        }).then(({ error }) => {
          if (error) logSupabaseNotice("insert course", error);
        });
      } catch { }
    }
    showToast(`Course "${trimmedCode} - ${trimmedName}" added successfully!`, "success");
    return { success: true };
  };

  const editCourse = (id: string, code: string, name: string, departmentId?: string) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can edit courses." };
    }
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) return { success: false, error: "Course Code is required" };
    if (!trimmedName) return { success: false, error: "Course Name is required" };

    const duplicateCode = courses.some(
      (c) => c.id !== id && c.code.toUpperCase() === trimmedCode
    );
    if (duplicateCode) {
      return { success: false, error: `Course Code "${trimmedCode}" is already in use in your faculty` };
    }

    const deptObj = departmentId ? masterDepartments.find((d) => d.id === departmentId) : undefined;

    const updatedCourses = masterCourses.map((c) =>
      c.id === id ? {
        ...c,
        code: trimmedCode,
        name: trimmedName,
        departmentId: departmentId ?? c.departmentId,
        departmentName: deptObj?.name ?? c.departmentName,
      } : c
    );
    setMasterCourses(updatedCourses);
    const updatedActs = addActivity("updated course details for", trimmedCode, "course");
    persist(masterDepartments, updatedCourses, masterLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("courses").update({
          code: trimmedCode,
          course_code: trimmedCode,
          name: trimmedName,
          course_name: trimmedName,
          department_id: departmentId,
        }).eq("id", id).then(({ error }) => {
          if (error) logSupabaseNotice("update course", error);
        });
      } catch { }
    }
    showToast(`Course ${trimmedCode} updated`, "success");
    return { success: true };
  };

  const deleteCourse = (id: string) => {
    if (activeRole !== "admin") return;
    const crs = masterCourses.find((c) => c.id === id);
    const updatedCourses = masterCourses.filter((c) => c.id !== id);
    setMasterCourses(updatedCourses);
    const updatedActs = addActivity("deleted course", crs?.code || id, "course");
    persist(masterDepartments, updatedCourses, masterLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("courses").delete().eq("id", id).then(({ error }) => {
          if (error) logSupabaseNotice("delete course", error);
        });
      } catch { }
    }
    showToast(`Course "${crs?.code}" removed`, "info");
  };

  // ==========================================
  // Lecturer Actions (Admin Only)
  // ==========================================
  const addLecturer = (data: {
    name: string;
    email: string;
    position: "Senior" | "Probationary";
    departmentId?: string;
    assignedCourses: string[];
  }) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can create lecturer accounts." };
    }
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();

    if (!trimmedName) return { success: false, error: "Lecturer Name is required" };
    if (!trimmedEmail) return { success: false, error: "Email Address is required" };

    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid institutional email" };
    }

    const exists = masterLecturers.some((l) => l.email.toLowerCase() === trimmedEmail);
    if (exists) {
      return { success: false, error: `Lecturer with email "${trimmedEmail}" already exists` };
    }

    const newLecturer: Lecturer = {
      id: `lec-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      position: data.position,
      departmentId: data.departmentId,
      assignedCourses: data.assignedCourses || [],
      status: "Pending First Login",
      hasChangedDefaultPassword: false,
      defaultPassword: "12345678",
      createdAt: new Date().toISOString().split("T")[0],
      adminEmail: effectiveAdminEmail,
    };

    const updatedLecturers = [newLecturer, ...masterLecturers];
    setMasterLecturers(updatedLecturers);
    const updatedActs = addActivity(
      "created lecturer account for",
      `${trimmedName} (${trimmedEmail})`,
      "lecturer"
    );
    persist(masterDepartments, masterCourses, updatedLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("lecturers").insert({
          id: newLecturer.id,
          name: newLecturer.name,
          email: newLecturer.email,
          position: newLecturer.position,
          assigned_courses: newLecturer.assignedCourses,
          status: newLecturer.status,
          default_password: newLecturer.defaultPassword,
          has_changed_default_password: false,
          admin_email: newLecturer.adminEmail,
        }).then(({ error }) => {
          if (error) logSupabaseNotice("insert lecturer", error);
        });
      } catch { }
    }

    showToast(`Lecturer account created for ${trimmedName}!`, "success");
    return { success: true, lecturer: newLecturer };
  };

  const editLecturer = (id: string, updates: Partial<Lecturer>) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can edit lecturer accounts." };
    }
    const updatedLecturers = masterLecturers.map((l) => (l.id === id ? { ...l, ...updates } : l));
    setMasterLecturers(updatedLecturers);
    const updatedActs = addActivity("updated lecturer record", id, "lecturer");
    persist(masterDepartments, masterCourses, updatedLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.position) payload.position = updates.position;
        if (updates.assignedCourses) payload.assigned_courses = updates.assignedCourses;
        if (updates.status) payload.status = updates.status;
        supabase.from("lecturers").update(payload).eq("id", id).then(({ error }) => {
          if (error) logSupabaseNotice("update lecturer", error);
        });
      } catch { }
    }

    showToast("Lecturer details updated successfully", "success");
    return { success: true };
  };

  const toggleLecturerStatus = (id: string) => {
    if (activeRole !== "admin") return;
    const lec = masterLecturers.find((l) => l.id === id);
    if (!lec) return;
    const nextStatus: "Active" | "Deactivated" =
      lec.status === "Deactivated" ? "Active" : "Deactivated";
    const updatedLecturers: Lecturer[] = masterLecturers.map((l) =>
      l.id === id ? { ...l, status: nextStatus } : l
    );
    setMasterLecturers(updatedLecturers);
    const updatedActs = addActivity(
      `${nextStatus === "Deactivated" ? "deactivated" : "reactivated"} lecturer`,
      lec.name,
      "lecturer"
    );
    persist(masterDepartments, masterCourses, updatedLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("lecturers").update({ status: nextStatus }).eq("id", id).then(({ error }) => {
          if (error) logSupabaseNotice("toggle lecturer status", error);
        });
      } catch { }
    }

    showToast(`Lecturer ${lec.name} is now ${nextStatus}`, nextStatus === "Active" ? "success" : "info");
  };

  const deleteLecturer = (id: string) => {
    if (activeRole !== "admin") return;
    const lec = masterLecturers.find((l) => l.id === id);
    const updatedLecturers = masterLecturers.filter((l) => l.id !== id);
    setMasterLecturers(updatedLecturers);
    const updatedActs = addActivity("removed lecturer account", lec?.name || id, "lecturer");
    persist(masterDepartments, masterCourses, updatedLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("lecturers").delete().eq("id", id).then(({ error }) => {
          if (error) logSupabaseNotice("delete lecturer", error);
        });
      } catch { }
    }

    showToast(`Lecturer ${lec?.name} removed`, "info");
  };

  const changeLecturerPassword = (email: string, newPass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const lec = masterLecturers.find((l) => l.email.toLowerCase() === trimmedEmail);
    if (!lec) return false;

    const updatedLecturers: Lecturer[] = masterLecturers.map((l) =>
      l.email.toLowerCase() === trimmedEmail
        ? {
          ...l,
          hasChangedDefaultPassword: true,
          status: "Active" as const,
          defaultPassword: newPass,
        }
        : l
    );
    setMasterLecturers(updatedLecturers);
    const updatedActs = addActivity("completed first-login password change", trimmedEmail, "system");
    persist(masterDepartments, masterCourses, updatedLecturers, masterStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("lecturers").update({
          has_changed_default_password: true,
          status: "Active",
          default_password: newPass,
        }).eq("email", trimmedEmail).then(({ error }) => {
          if (error) logSupabaseNotice("update lecturer password", error);
        });
      } catch { }
    }

    showToast("Password updated successfully! Welcome to your dashboard.", "success");
    return true;
  };

  // Cross-tenant lookup so any lecturer can sign in from any admin workspace
  const findLecturerByEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    return masterLecturers.find((l) => l.email.toLowerCase() === normalized);
  };

  // ==========================================
  // Student Actions (Admin Only)
  // ==========================================
  const addStudent = (data: {
    fullName: string;
    email: string;
    departmentId: string;
    academicYear: 1 | 2 | 3 | 4;
    semester: 1 | 2;
    defaultPassword: string;
  }) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can create student accounts." };
    }
    const trimmedName = data.fullName.trim();
    const trimmedEmail = data.email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: "Full Name is required" };
    }

    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid university email address" };
    }

    if (masterStudents.some((s) => s.email.toLowerCase() === trimmedEmail)) {
      return {
        success: false,
        error: `A student with email "${trimmedEmail}" is already registered.`,
      };
    }

    if (!data.departmentId) {
      return { success: false, error: "Department selection is required" };
    }

    if (![1, 2, 3, 4].includes(data.academicYear)) {
      return { success: false, error: "Academic Year (Year 1 - Year 4) is required" };
    }

    if (![1, 2].includes(data.semester)) {
      return { success: false, error: "Semester (Semester 1 - Semester 2) is required" };
    }

    if (!data.defaultPassword || data.defaultPassword.length < 8) {
      return { success: false, error: "Default password must be at least 8 characters long" };
    }

    const newStudent: Student = {
      id: `std-${Date.now().toString(36)}`,
      fullName: trimmedName,
      email: trimmedEmail,
      departmentId: data.departmentId,
      academicYear: data.academicYear,
      semester: data.semester,
      defaultPassword: data.defaultPassword,
      profilePhotoUrl: null,
      accountStatus: "active",
      mustChangePassword: true,
      createdAt: new Date().toISOString().split("T")[0],
      adminEmail: effectiveAdminEmail,
    };

    const updatedStudents = [newStudent, ...masterStudents];
    setMasterStudents(updatedStudents);
    const updatedActs = addActivity("registered new student account", trimmedName, "student");
    persist(masterDepartments, masterCourses, masterLecturers, updatedStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const deptObj = masterDepartments.find((d) => d.id === newStudent.departmentId);
        supabase.from("students").insert({
          student_id: newStudent.id,
          full_name: newStudent.fullName,
          email: newStudent.email,
          department_id: newStudent.departmentId,
          department: deptObj?.name || "Computer Science",
          academic_year: newStudent.academicYear,
          semester: newStudent.semester,
          default_password: newStudent.defaultPassword,
          account_status: newStudent.accountStatus,
          must_change_password: true,
          admin_email: newStudent.adminEmail,
        }).then(({ error }) => {
          if (error) logSupabaseNotice("insert student", error);
        });
      } catch { }
    }

    showToast(`Student ${trimmedName} created successfully!`, "success");

    return {
      success: true,
      student: {
        ...newStudent,
        defaultPassword: data.defaultPassword,
      },
    };
  };

  const editStudent = (
    id: string,
    updates: Partial<Omit<Student, "id" | "createdAt">>
  ) => {
    if (activeRole !== "admin") {
      return { success: false, error: "Access denied. Only university administrators can edit student records." };
    }
    const std = masterStudents.find((s) => s.id === id);
    if (!std) return { success: false, error: "Student not found" };

    if (updates.email) {
      const trimmedEmail = updates.email.trim().toLowerCase();
      const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return { success: false, error: "Please enter a valid university email address" };
      }
      if (masterStudents.some((s) => s.id !== id && s.email.toLowerCase() === trimmedEmail)) {
        return {
          success: false,
          error: `Email "${trimmedEmail}" is already used by another student.`,
        };
      }
      updates.email = trimmedEmail;
    }

    if (updates.fullName) {
      updates.fullName = updates.fullName.trim();
    }

    const updatedStudents = masterStudents.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    setMasterStudents(updatedStudents);
    const updatedActs = addActivity(
      "updated student profile",
      updates.fullName || std.fullName,
      "student"
    );
    persist(masterDepartments, masterCourses, masterLecturers, updatedStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const payload: any = {};
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.email) payload.email = updates.email;
        if (updates.departmentId) payload.department_id = updates.departmentId;
        if (updates.academicYear) payload.academic_year = updates.academicYear;
        if (updates.semester) payload.semester = updates.semester;
        if (updates.accountStatus) payload.account_status = updates.accountStatus;
        supabase.from("students").update(payload).eq("student_id", id).then(({ error }) => {
          if (error) logSupabaseNotice("update student", error);
        });
      } catch { }
    }

    showToast("Student details updated successfully", "success");
    return { success: true };
  };

  const toggleStudentStatus = (id: string) => {
    if (activeRole !== "admin") return;
    const std = masterStudents.find((s) => s.id === id);
    if (!std) return;
    const nextStatus: "active" | "inactive" =
      std.accountStatus === "active" ? "inactive" : "active";
    const updatedStudents = masterStudents.map((s) =>
      s.id === id ? { ...s, accountStatus: nextStatus } : s
    );
    setMasterStudents(updatedStudents);
    const updatedActs = addActivity(
      `${nextStatus === "inactive" ? "deactivated" : "reactivated"} student account`,
      std.fullName,
      "student"
    );
    persist(masterDepartments, masterCourses, masterLecturers, updatedStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("students").update({ account_status: nextStatus }).eq("student_id", id).then(({ error }) => {
          if (error) logSupabaseNotice("toggle student status", error);
        });
      } catch { }
    }

    showToast(
      `Student ${std.fullName} is now ${nextStatus === "active" ? "Active" : "Deactivated"}`,
      nextStatus === "active" ? "success" : "info"
    );
  };

  const deleteStudent = (id: string) => {
    if (activeRole !== "admin") return;
    const std = masterStudents.find((s) => s.id === id);
    const updatedStudents = masterStudents.filter((s) => s.id !== id);
    setMasterStudents(updatedStudents);
    const updatedActs = addActivity(
      "removed student account",
      std?.fullName || id,
      "student"
    );
    persist(masterDepartments, masterCourses, masterLecturers, updatedStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("students").delete().eq("student_id", id).then(({ error }) => {
          if (error) logSupabaseNotice("delete student", error);
        });
      } catch { }
    }

    showToast(`Student ${std?.fullName || "record"} deleted`, "info");
  };

  // Cross-tenant lookup so any student can sign in from any admin workspace
  const findStudentByEmail = (email: string) => {
    return masterStudents.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
  };

  const changeStudentPassword = (email: string, newPass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const std = masterStudents.find((s) => s.email.toLowerCase() === trimmedEmail);
    if (!std) return false;

    const updatedStudents = masterStudents.map((s) =>
      s.email.toLowerCase() === trimmedEmail
        ? {
          ...s,
          mustChangePassword: false,
          defaultPassword: newPass,
        }
        : s
    );
    setMasterStudents(updatedStudents);
    const updatedActs = addActivity(
      "student updated account password",
      trimmedEmail,
      "student"
    );
    persist(masterDepartments, masterCourses, masterLecturers, updatedStudents, updatedActs);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.from("students").update({
          must_change_password: false,
          default_password: newPass,
        }).eq("email", trimmedEmail).then(({ error }) => {
          if (error) logSupabaseNotice("update student password", error);
        });
      } catch { }
    }

    showToast("Password updated successfully!", "success");
    return true;
  };

  // ==========================================
  // Project Management (Scoped by Admin Faculty)
  // ==========================================
  const addProject = (
    data: Omit<Project, "id" | "createdAt">,
    initialProjectGroups?: ProjectGroup[]
  ) => {
    const trimmedTitle = data.title.trim();
    if (!trimmedTitle) {
      return { success: false, error: "Project Title is required" };
    }

    const newProject: Project = {
      ...data,
      id: `proj-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split("T")[0],
      adminEmail: effectiveAdminEmail,
    };

    let nextGroups = groups;
    if (initialProjectGroups && initialProjectGroups.length > 0) {
      const preparedGroups: ProjectGroup[] = initialProjectGroups.map((g, idx) => ({
        ...g,
        id: g.id || `grp-${newProject.id}-${g.groupNumber || idx + 1}`,
        projectId: newProject.id,
        workspaceId: g.workspaceId || `ws-${newProject.id}-${g.groupNumber || idx + 1}`,
        createdAt: g.createdAt || new Date().toISOString(),
      }));
      nextGroups = [...preparedGroups, ...groups.filter((g) => g.projectId !== newProject.id)];
      setGroups(nextGroups);
    }

    const updatedProjects = [newProject, ...masterProjects];
    setMasterProjects(updatedProjects);
    const updatedActs = addActivity(
      `${data.status === "Published" ? "published" : "created draft for"} academic project`,
      data.title,
      "project"
    );
    persist(masterDepartments, masterCourses, masterLecturers, masterStudents, updatedActs, updatedProjects, nextGroups);

    // Save project and academic groups to Supabase database
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: newProject,
        groups: initialProjectGroups?.map((g) => ({ ...g, projectId: newProject.id })),
      }),
    }).catch((err) => {
      console.warn("Background sync to Supabase project table:", err);
    });

    showToast(
      `Project "${data.title}" ${data.status === "Published" ? "published successfully!" : "saved as draft."}`,
      "success"
    );
    return { success: true, project: newProject };
  };

  const editProject = (id: string, updates: Partial<Project>) => {
    const proj = masterProjects.find((p) => p.id === id);
    if (!proj) return { success: false, error: "Project not found" };

    const updatedProjects = masterProjects.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setMasterProjects(updatedProjects);
    const updatedActs = addActivity("updated academic project", updates.title || proj.title, "project");
    persist(masterDepartments, masterCourses, masterLecturers, masterStudents, updatedActs, updatedProjects, groups);

    // Sync updates to Supabase via PUT /api/projects
    fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, project: { ...proj, ...updates } }),
    }).catch(() => { });

    showToast("Project updated successfully", "success");
    return { success: true };
  };

  const publishProject = (id: string) => {
    const proj = masterProjects.find((p) => p.id === id);
    if (!proj) return;
    const updatedProjects: Project[] = masterProjects.map((p) =>
      p.id === id ? { ...p, status: "Published" as const } : p
    );
    setMasterProjects(updatedProjects);
    const updatedActs = addActivity("published academic project", proj.title, "project");
    persist(masterDepartments, masterCourses, masterLecturers, masterStudents, updatedActs, updatedProjects);

    // Sync published status to Supabase
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: { ...proj, status: "Published" } }),
    }).catch(() => { });

    showToast(`Project "${proj.title}" is now published and visible to students!`, "success");
  };

  const getProjectsForStudent = (studentEmail?: string): Project[] => {
    const email = (studentEmail || activeStudentEmail).toLowerCase().trim();
    const currentStudent = masterStudents.find((s) => s.email.toLowerCase() === email);

    // Projects where student is a group member
    const assignedProjectIds = new Set(
      groups
        .filter((g) => g.members.some((m) => m.email.toLowerCase() === email))
        .map((g) => g.projectId)
    );

    return projects.filter((p) => {
      // Direct group assignment
      if (assignedProjectIds.has(p.id)) return true;

      // Published project for their enrolled course/cohort
      if (
        p.status === "Published" &&
        currentStudent &&
        p.departmentId === currentStudent.departmentId &&
        p.academicYear === currentStudent.academicYear &&
        p.semester === currentStudent.semester
      ) {
        return true;
      }

      return false;
    });
  };

  const getStudentAssignedGroup = (projectId: string, studentEmail?: string): ProjectGroup | undefined => {
    const email = (studentEmail || activeStudentEmail).toLowerCase().trim();
    return (
      groups.find(
        (g) =>
          g.projectId === projectId &&
          g.members.some((m) => m.email.toLowerCase() === email)
      ) ||
      groups.find((g) => g.projectId === projectId)
    );
  };

  const archiveProject = (id: string) => {
    const proj = masterProjects.find((p) => p.id === id);
    if (!proj) return;
    const nextStatus = proj.status === "Archived" ? ("Published" as const) : ("Archived" as const);
    const updatedProjects: Project[] = masterProjects.map((p) =>
      p.id === id ? { ...p, status: nextStatus } : p
    );
    setMasterProjects(updatedProjects);
    const updatedActs = addActivity(
      `${nextStatus === "Archived" ? "archived" : "restored"} project`,
      proj.title,
      "project"
    );
    persist(masterDepartments, masterCourses, masterLecturers, masterStudents, updatedActs, updatedProjects);
    showToast(`Project "${proj.title}" is now ${nextStatus}`, "info");
  };

  const deleteProject = (id: string) => {
    const proj = masterProjects.find((p) => p.id === id);
    if (!proj) return;
    const updatedProjects = masterProjects.filter((p) => p.id !== id);
    setMasterProjects(updatedProjects);

    // Cascade delete associated groups from state and local storage
    const updatedGroups = groups.filter((g) => g.projectId !== id);
    setGroups(updatedGroups);

    const updatedActs = addActivity("removed project", proj?.title || id, "project");
    persist(
      masterDepartments,
      masterCourses,
      masterLecturers,
      masterStudents,
      updatedActs,
      updatedProjects,
      updatedGroups,
      timelineActivities
    );

    // Cascade delete from Supabase database
    fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => { });

    showToast(`Project "${proj?.title || "record"}" removed`, "info");
  };

  // Group & Workspace Actions
  const addGroup = (data: Omit<ProjectGroup, "id" | "createdAt">) => {
    const newGroup: ProjectGroup = {
      ...data,
      id: `grp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);

    // Timeline event
    const newTl: ProjectTimelineActivity = {
      id: `tl-${Date.now()}`,
      projectId: data.projectId,
      groupId: newGroup.id,
      groupNumber: data.groupNumber,
      type: "group_created",
      user: "Course Coordinator",
      userRole: "lecturer",
      action: "formed academic project group",
      target: `${data.groupName} (${data.members.length} members)`,
      timestamp: "Just now",
    };
    const updatedTimeline = [newTl, ...timelineActivities];
    setTimelineActivities(updatedTimeline);

    persist(undefined, undefined, undefined, undefined, undefined, undefined, updatedGroups, updatedTimeline);
    showToast(`Group "${data.groupName}" formed successfully!`, "success");
    return { success: true, group: newGroup };
  };

  const setProjectGroups = (projectId: string, newGroups: ProjectGroup[]) => {
    // Filter out existing groups for this project (safe idempotent replacement)
    const otherGroups = groups.filter((g) => g.projectId !== projectId);
    const updatedGroups = [...otherGroups, ...newGroups];
    setGroups(updatedGroups);

    // Add timeline event
    const newTl: ProjectTimelineActivity = {
      id: `tl-${Date.now()}`,
      projectId,
      type: "group_created",
      user: "Course Coordinator",
      userRole: "lecturer",
      action: `confirmed and initialized ${newGroups.length} shared group workspaces`,
      target: `${newGroups.length} academic groups`,
      timestamp: "Just now",
    };
    const updatedTimeline = [newTl, ...timelineActivities];
    setTimelineActivities(updatedTimeline);

    persist(undefined, undefined, undefined, undefined, undefined, undefined, updatedGroups, updatedTimeline);
    showToast(`${newGroups.length} group workspaces confirmed and initialized!`, "success");
  };

  const setProjectStudentAssignments = (projectId: string, newAssignments: ProjectStudentAssignment[]) => {
    const otherAssignments = studentAssignments.filter((a) => a.projectId !== projectId);
    const updated = [...otherAssignments, ...newAssignments];
    setStudentAssignments(updated);
    try {
      localStorage.setItem("unicodetrack_student_assignments_v1", JSON.stringify(updated));
    } catch { }

    // Mirror to personal ProjectGroup workspaces (1 student per group)
    const personalGroups: ProjectGroup[] = newAssignments.map((a, idx) => ({
      id: `grp-ind-${projectId}-${a.studentId}`,
      projectId,
      groupNumber: idx + 1,
      groupName: `${a.studentName} Personal Workspace`,
      workspaceId: a.workspaceId,
      members: [
        {
          studentId: a.studentId,
          fullName: a.studentName,
          email: a.studentEmail,
          department: a.departmentId || "Faculty of Computing",
          academicYear: a.academicYear || 4,
          semester: a.semester || 1,
          role: "Team Lead",
          commitsCount: a.totalCommits || 0,
        },
      ],
      repoStatus: a.repoStatus,
      totalCommits: a.totalCommits,
      status: a.status,
      progress: a.progress,
      proposalStatus: a.proposalStatus,
      createdAt: a.createdAt,
    }));

    setProjectGroups(projectId, personalGroups);
    showToast(`${newAssignments.length} personal student workspaces initialized!`, "success");
  };

  const getStudentAssignment = (projectId: string, studentEmail?: string): ProjectStudentAssignment | undefined => {
    const email = (studentEmail || activeStudentEmail).toLowerCase().trim();
    return studentAssignments.find(
      (a) => a.projectId === projectId && a.studentEmail.toLowerCase() === email
    );
  };

  const getAssignmentsForProject = (projectId: string): ProjectStudentAssignment[] => {
    return studentAssignments.filter((a) => a.projectId === projectId);
  };

  const updateGroup = (id: string, updates: Partial<ProjectGroup>) => {
    const grp = groups.find((g) => g.id === id);
    if (!grp) return { success: false };

    const updatedGroups = groups.map((g) => (g.id === id ? { ...g, ...updates } : g));
    setGroups(updatedGroups);
    persist(departments, courses, lecturers, students, activities, projects, updatedGroups, timelineActivities);
    return { success: true };
  };

  const addTimelineActivity = (activity: Omit<ProjectTimelineActivity, "id" | "timestamp">) => {
    const newAct: ProjectTimelineActivity = {
      ...activity,
      id: `tl-${Date.now()}`,
      timestamp: "Just now",
    };
    const updated = [newAct, ...timelineActivities.slice(0, 49)];
    setTimelineActivities(updated);
    persist(undefined, undefined, undefined, undefined, undefined, undefined, groups, updated);
  };

  const connectRepoToGroup = async (groupId: string, repoUrl: string) => {
    const grp = groups.find((g) => g.id === groupId);
    if (!grp) return { success: false, error: "Group not found" };

    try {
      const res = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to connect repository" };
      }

      const updatedGroups = groups.map((g) =>
        g.id === groupId
          ? {
            ...g,
            repoUrl: data.repository.repoUrl,
            repoName: data.repository.repoName,
            repoOwner: data.repository.repoOwner,
            defaultBranch: data.repository.defaultBranch,
            repoStatus: "connected" as const,
            lastSyncAt: data.repository.lastSyncAt,
            totalCommits: data.totalCommits || 24,
            branches: data.branches,
            commits: data.commits,
          }
          : g
      );
      setGroups(updatedGroups);

      addTimelineActivity({
        projectId: grp.projectId,
        groupId: grp.id,
        groupNumber: grp.groupNumber,
        type: "repo_connected",
        user: activeRole === "student" ? "Alex Chen" : "Lecturer",
        userRole: activeRole === "student" ? "student" : "lecturer",
        action: "connected group GitHub repository",
        target: data.repository.repoUrl,
      });

      showToast(`GitHub repository "${data.repository.repoName}" connected!`, "success");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error connecting repository" };
    }
  };

  const syncGroupRepo = async (groupId: string) => {
    const grp = groups.find((g) => g.id === groupId);
    if (!grp || !grp.repoUrl) return { success: false, error: "No repository connected" };

    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: grp.repoUrl, branch: grp.defaultBranch || "main" }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Sync failed" };
      }

      const updatedGroups = groups.map((g) =>
        g.id === groupId
          ? {
            ...g,
            lastSyncAt: data.syncedAt,
            totalCommits: data.totalCommits || g.totalCommits,
            branches: data.branches || g.branches,
            commits: data.commits || g.commits,
          }
          : g
      );
      setGroups(updatedGroups);

      showToast(`Repository synced (${data.totalCommits} commits).`, "success");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Sync network error" };
    }
  };

  const submitProposal = (
    groupId: string,
    data: {
      title: string;
      description: string;
      fileName: string;
      fileSize: string;
      submittedBy: string;
      submittedByEmail: string;
    }
  ) => {
    const grp = groups.find((g) => g.id === groupId);
    if (!grp) return { success: false };

    const currentVersion = grp.proposal?.version ? grp.proposal.version + 1 : 1;
    const newProposal: ProposalSubmission = {
      id: `prop-${Date.now()}`,
      groupId,
      title: data.title.trim(),
      description: data.description.trim(),
      fileName: data.fileName,
      fileSize: data.fileSize,
      submittedBy: data.submittedBy,
      submittedByEmail: data.submittedByEmail,
      submittedAt: new Date().toISOString(),
      status: "submitted",
      version: currentVersion,
    };

    const updatedGroups = groups.map((g) =>
      g.id === groupId
        ? {
          ...g,
          proposalStatus: "submitted" as const,
          proposal: newProposal,
          progress: Math.max(g.progress, 25),
        }
        : g
    );
    setGroups(updatedGroups);

    addTimelineActivity({
      projectId: grp.projectId,
      groupId: grp.id,
      groupNumber: grp.groupNumber,
      type: "proposal_submitted",
      user: data.submittedBy,
      userRole: "student",
      action: `submitted project proposal v${currentVersion}.0`,
      target: data.fileName,
    });

    showToast(`Proposal "${data.title}" submitted for lecturer review!`, "success");
    return { success: true, proposal: newProposal };
  };

  const reviewProposal = (
    groupId: string,
    decision: "approved" | "changes_requested",
    comments: string,
    rubricScore?: number
  ) => {
    const grp = groups.find((g) => g.id === groupId);
    if (!grp || !grp.proposal) return { success: false };

    const feedback: LecturerFeedback = {
      id: `fb-${Date.now()}`,
      lecturerName: currentLecturer?.name || "Lecturer",
      decision,
      comments: comments.trim(),
      reviewedAt: new Date().toISOString(),
      rubricScore: rubricScore || (decision === "approved" ? 90 : 65),
    };

    const nextStatus = decision === "approved" ? "approved" : "changes_requested";

    const updatedGroups = groups.map((g) =>
      g.id === groupId
        ? {
          ...g,
          proposalStatus: nextStatus as any,
          proposal: {
            ...g.proposal!,
            status: nextStatus as any,
            feedback,
          },
          progress: decision === "approved" ? Math.max(g.progress, 60) : g.progress,
        }
        : g
    );
    setGroups(updatedGroups);

    addTimelineActivity({
      projectId: grp.projectId,
      groupId: grp.id,
      groupNumber: grp.groupNumber,
      type: decision === "approved" ? "proposal_approved" : "feedback_given",
      user: currentLecturer?.name || "Lecturer",
      userRole: "lecturer",
      action: decision === "approved" ? "approved project proposal" : "requested proposal revisions",
      target: `${grp.proposal.fileName} (Score: ${feedback.rubricScore}/100)`,
    });

    showToast(
      decision === "approved"
        ? `Proposal approved! Group ${grp.groupNumber} can proceed to implementation.`
        : `Feedback sent to Group ${grp.groupNumber}. Revisions requested.`,
      decision === "approved" ? "success" : "info"
    );
    return { success: true };
  };

  // Evaluation & Rubrics Methods
  const getRubricForProject = (projectId: string): EvaluationRubric => {
    if (rubrics[projectId]) return rubrics[projectId];
    const defaultRubric: EvaluationRubric = {
      id: `rubric-${projectId}`,
      projectId,
      title: "Academic Capstone Project Evaluation Rubric",
      description: "Comprehensive assessment evaluating algorithmic correctness, code quality, error handling, and Git collaboration.",
      totalMarks: 100,
      criteria: [...DEFAULT_ACADEMIC_RUBRIC_CRITERIA],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return defaultRubric;
  };

  const saveRubric = (projectId: string, rubric: EvaluationRubric) => {
    const nextRubrics = { ...rubrics, [projectId]: rubric };
    setRubrics(nextRubrics);
    try {
      localStorage.setItem("unicodetrack_rubrics_store", JSON.stringify(nextRubrics));
    } catch { }
    showToast("Evaluation rubric saved successfully", "success");
    return { success: true };
  };

  const getEvaluationForGroup = (groupId: string): ProjectEvaluation | undefined => {
    return evaluations.find((e) => e.groupId === groupId);
  };

  const saveEvaluation = (evaluation: ProjectEvaluation) => {
    const existingIndex = evaluations.findIndex(
      (e) => e.id === evaluation.id || (e.groupId === evaluation.groupId && e.version === evaluation.version)
    );
    let nextEvaluations: ProjectEvaluation[];
    if (existingIndex >= 0) {
      nextEvaluations = [...evaluations];
      nextEvaluations[existingIndex] = evaluation;
    } else {
      nextEvaluations = [evaluation, ...evaluations];
    }
    setEvaluations(nextEvaluations);

    // Update group's evaluation status and score
    const updatedGroups = groups.map((g) => {
      if (g.id === evaluation.groupId) {
        return {
          ...g,
          evaluationStatus: evaluation.status,
          latestEvaluationId: evaluation.id,
          evaluationScore: evaluation.totalScore,
          progress:
            evaluation.status === "published"
              ? 100
              : evaluation.status === "approved"
                ? 90
                : g.progress,
        };
      }
      return g;
    });
    setGroups(updatedGroups);

    try {
      localStorage.setItem("unicodetrack_evaluations_store", JSON.stringify(nextEvaluations));
    } catch { }
    return { success: true };
  };

  const updateEvaluationCriterionScore = (
    evaluationId: string,
    criterionId: string,
    lecturerScore: number,
    lecturerNotes?: string
  ) => {
    const evaluation = evaluations.find((e) => e.id === evaluationId);
    if (!evaluation) return { success: false };

    const updatedCriterionScores = evaluation.criterionScores.map((c) => {
      if (c.criterionId === criterionId) {
        const bounded = Math.max(0, Math.min(c.maxMarks, lecturerScore));
        return {
          ...c,
          lecturerScore: bounded,
          finalScore: bounded,
          percentage: Math.round((bounded / c.maxMarks) * 100),
          explanation: lecturerNotes ? `${c.explanation}\n[Lecturer Note]: ${lecturerNotes}` : c.explanation,
        };
      }
      return c;
    });

    const newTotalScore =
      Math.round(updatedCriterionScores.reduce((acc, c) => acc + c.finalScore, 0) * 10) / 10;
    const newPercentage = Math.round((newTotalScore / evaluation.maxScore) * 100);

    const updatedEvaluation: ProjectEvaluation = {
      ...evaluation,
      criterionScores: updatedCriterionScores,
      totalScore: newTotalScore,
      percentage: newPercentage,
      status: evaluation.status === "not_evaluated" ? "in_review" : evaluation.status,
      updatedAt: new Date().toISOString(),
    };

    saveEvaluation(updatedEvaluation);
    return { success: true };
  };

  const approveEvaluation = (evaluationId: string, lecturerComments?: string) => {
    const evaluation = evaluations.find((e) => e.id === evaluationId);
    if (!evaluation) return { success: false };

    const updated: ProjectEvaluation = {
      ...evaluation,
      status: "approved",
      lecturerComments: lecturerComments || evaluation.lecturerComments,
      updatedAt: new Date().toISOString(),
    };
    saveEvaluation(updated);

    addTimelineActivity({
      projectId: evaluation.projectId,
      groupId: evaluation.groupId,
      groupNumber: evaluation.groupNumber,
      type: "feedback_given",
      user: currentLecturer?.name || "Lecturer",
      userRole: "lecturer",
      action: "approved academic project evaluation",
      target: `Score: ${evaluation.totalScore}/${evaluation.maxScore} (${evaluation.percentage}%)`,
    });

    showToast(`Evaluation for ${evaluation.groupName || "Group"} approved! Ready for publication.`, "success");
    return { success: true };
  };

  const publishEvaluation = (evaluationId: string) => {
    const evaluation = evaluations.find((e) => e.id === evaluationId);
    if (!evaluation) return { success: false };

    const now = new Date().toISOString();
    const updated: ProjectEvaluation = {
      ...evaluation,
      status: "published",
      publishedAt: now,
      updatedAt: now,
    };
    saveEvaluation(updated);

    addTimelineActivity({
      projectId: evaluation.projectId,
      groupId: evaluation.groupId,
      groupNumber: evaluation.groupNumber,
      type: "feedback_given",
      user: currentLecturer?.name || "Lecturer",
      userRole: "lecturer",
      action: "published final grades and feedback to group workspace",
      target: `Final Grade: ${evaluation.totalScore}/${evaluation.maxScore} (${evaluation.percentage}%)`,
    });

    showToast(`Official marks published! Group members can now view feedback in workspace.`, "success");
    return { success: true };
  };

  // ER Diagram & Database Methods
  const getERSubmissionForGroup = (groupId: string): ERDiagramSubmission | undefined => {
    return erSubmissions.find((s) => s.groupId === groupId);
  };

  const submitERDiagram = (
    groupId: string,
    data: {
      fileName: string;
      fileSize: string;
      fileType: "pdf" | "png" | "jpg" | "jpeg";
      fileUrl: string;
      versionNote?: string;
      submittedByName: string;
      submittedByEmail: string;
    }
  ) => {
    const group = groups.find((g) => g.id === groupId);
    const existing = erSubmissions.find((s) => s.groupId === groupId);
    const newVersion = existing ? existing.version + 1 : 1;

    const submission: ERDiagramSubmission = {
      id: `er-sub-${groupId}-${Date.now()}`,
      projectId: group?.projectId || "proj-1",
      groupId,
      groupNumber: group?.groupNumber,
      groupName: group?.groupName,
      submittedByName: data.submittedByName,
      submittedByEmail: data.submittedByEmail,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      fileUrl: data.fileUrl,
      version: newVersion,
      versionNote: data.versionNote,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };

    const nextSubmissions = [submission, ...erSubmissions.filter((s) => s.groupId !== groupId)];
    setERSubmissions(nextSubmissions);

    try {
      localStorage.setItem("unicodetrack_er_submissions_store", JSON.stringify(nextSubmissions));
    } catch { }

    addTimelineActivity({
      projectId: submission.projectId,
      groupId: submission.groupId,
      groupNumber: submission.groupNumber,
      type: "proposal_submitted",
      user: data.submittedByName,
      userRole: "student",
      action: "submitted ER diagram and database specification",
      target: `${data.fileName} (v${newVersion})`,
    });

    showToast(`ER diagram v${newVersion} uploaded successfully!`, "success");
    return { success: true, submission };
  };

  const saveERAnalysis = (submissionId: string, analysis: ERDiagramAIAnalysis) => {
    const nextSubmissions = erSubmissions.map((s) =>
      s.id === submissionId
        ? {
          ...s,
          status: "reviewed" as const,
          aiAnalysis: analysis,
        }
        : s
    );
    setERSubmissions(nextSubmissions);
    try {
      localStorage.setItem("unicodetrack_er_submissions_store", JSON.stringify(nextSubmissions));
    } catch { }
    return { success: true };
  };

  const saveERFeedback = (submissionId: string, feedback: ERLecturerFeedback) => {
    const nextSubmissions = erSubmissions.map((s) =>
      s.id === submissionId
        ? {
          ...s,
          status:
            feedback.status === "resubmission_requested"
              ? ("resubmission_requested" as const)
              : ("approved" as const),
          lecturerFeedback: feedback,
        }
        : s
    );
    setERSubmissions(nextSubmissions);
    try {
      localStorage.setItem("unicodetrack_er_submissions_store", JSON.stringify(nextSubmissions));
    } catch { }
    showToast("ER diagram evaluation saved successfully", "success");
    return { success: true };
  };

  const publishERFeedback = (submissionId: string) => {
    const nextSubmissions = erSubmissions.map((s) => {
      if (s.id === submissionId && s.lecturerFeedback) {
        return {
          ...s,
          status: "published" as const,
          lecturerFeedback: {
            ...s.lecturerFeedback,
            isPublished: true,
            status: "published" as const,
            publishedAt: new Date().toISOString(),
          },
        };
      }
      return s;
    });
    setERSubmissions(nextSubmissions);
    try {
      localStorage.setItem("unicodetrack_er_submissions_store", JSON.stringify(nextSubmissions));
    } catch { }

    const targetSub = erSubmissions.find((s) => s.id === submissionId);
    if (targetSub) {
      addTimelineActivity({
        projectId: targetSub.projectId,
        groupId: targetSub.groupId,
        groupNumber: targetSub.groupNumber,
        type: "feedback_given",
        user: currentLecturer?.name || "Lecturer",
        userRole: "lecturer",
        action: "published ER diagram assessment and marks to workspace",
        target: `${targetSub.fileName} (Score: ${targetSub.lecturerFeedback?.approvedMarks || 85}/100)`,
      });
    }

    showToast("ER diagram evaluation published to student group workspace!", "success");
    return { success: true };
  };

  return (
    <AdminDataContext.Provider
      value={{
        departments,
        courses,
        lecturers,
        students,
        activities,
        projects,
        addDepartment,
        editDepartment,
        deleteDepartment,
        addCourse,
        editCourse,
        deleteCourse,
        addLecturer,
        editLecturer,
        toggleLecturerStatus,
        deleteLecturer,
        changeLecturerPassword,
        findLecturerByEmail,
        addStudent,
        editStudent,
        toggleStudentStatus,
        deleteStudent,
        findStudentByEmail,
        changeStudentPassword,
        addProject,
        editProject,
        publishProject,
        archiveProject,
        deleteProject,
        getProjectsForStudent,
        getStudentAssignedGroup,
        groups,
        addGroup,
        setProjectGroups,
        updateGroup,
        studentAssignments,
        setProjectStudentAssignments,
        getStudentAssignment,
        getAssignmentsForProject,
        connectRepoToGroup,
        syncGroupRepo,
        submitProposal,
        reviewProposal,
        timelineActivities,
        addTimelineActivity,
        rubrics,
        getRubricForProject,
        saveRubric,
        evaluations,
        getEvaluationForGroup,
        saveEvaluation,
        updateEvaluationCriterionScore,
        approveEvaluation,
        publishEvaluation,
        erSubmissions,
        getERSubmissionForGroup,
        submitERDiagram,
        saveERAnalysis,
        saveERFeedback,
        publishERFeedback,
        activeRole,
        setActiveRole,
        activeAdminEmail,
        setActiveAdminEmail,
        activeLecturerEmail,
        setActiveLecturerEmail,
        activeStudentEmail,
        setActiveStudentEmail,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
}
