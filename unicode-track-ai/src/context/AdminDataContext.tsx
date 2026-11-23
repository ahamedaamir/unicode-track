"use client";

import React, { createContext, useContext, useState } from "react";
import { Department, Course, Lecturer, Student, ActivityLog, Project } from "@/types/admin";

interface AdminDataContextType {
  departments: Department[];
  courses: Course[];
  lecturers: Lecturer[];
  students: Student[];
  activities: ActivityLog[];
  addDepartment: (name: string) => { success: boolean; error?: string };
  editDepartment: (id: string, name: string) => { success: boolean; error?: string };
  deleteDepartment: (id: string) => void;
  addCourse: (code: string, name: string) => { success: boolean; error?: string };
  editCourse: (id: string, code: string, name: string) => { success: boolean; error?: string };
  deleteCourse: (id: string) => void;
  addLecturer: (data: {
    name: string;
    email: string;
    position: "Senior" | "Probationary";
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
  addProject: (data: Omit<Project, "id" | "createdAt">) => { success: boolean; project?: Project; error?: string };
  editProject: (id: string, updates: Partial<Project>) => { success: boolean; error?: string };
  publishProject: (id: string) => void;
  archiveProject: (id: string) => void;
  deleteProject: (id: string) => void;

  // Active Role & Lecturer Persona
  activeRole: "admin" | "lecturer" | "student";
  setActiveRole: (role: "admin" | "lecturer" | "student") => void;
  activeLecturerEmail: string;
  setActiveLecturerEmail: (email: string) => void;

  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  dismissToast: () => void;
}

const STORAGE_KEY = "unicodetrack_admin_store_v1";

const initialDepartments: Department[] = [
  { id: "dept-1", name: "Department of Computer Science & Engineering", createdAt: "2026-10-12" },
  { id: "dept-2", name: "Department of Information Technology", createdAt: "2026-10-15" },
  { id: "dept-3", name: "Department of Software Engineering", createdAt: "2026-10-18" },
  { id: "dept-4", name: "Department of Management & Information Systems", createdAt: "2026-10-25" },
];

const initialCourses: Course[] = [
  { id: "crs-1", code: "CS492", name: "Senior Capstone Project & Innovation", createdAt: "2026-10-14" },
  { id: "crs-2", code: "ICT2142", name: "E-Business Systems Architecture", createdAt: "2026-10-16" },
  { id: "crs-3", code: "SE3102", name: "Agile Software Project Management", createdAt: "2026-10-20" },
  { id: "crs-4", code: "CS3021", name: "Distributed Systems & Cloud Computing", createdAt: "2026-10-22" },
  { id: "crs-5", code: "BME401", name: "Biomedical Telemetry & Edge AI", createdAt: "2026-10-24" },
  { id: "crs-6", code: "IT1040", name: "Database Design & Enterprise Models", createdAt: "2026-10-26" },
];

const initialLecturers: Lecturer[] = [
  {
    id: "lec-1",
    name: "Dr. Evelyn Reed",
    email: "evelyn.reed@university.edu",
    position: "Senior",
    assignedCourses: ["CS492", "SE3102"],
    status: "Active",
    hasChangedDefaultPassword: true,
    defaultPassword: "UniCode@2004",
    createdAt: "2026-11-01",
  },
  {
    id: "lec-2",
    name: "Prof. Jonathan Hayes",
    email: "jonathan.hayes@university.edu",
    position: "Senior",
    assignedCourses: ["BME401"],
    status: "Active",
    hasChangedDefaultPassword: true,
    defaultPassword: "UniCode@2004",
    createdAt: "2026-11-04",
  },
  {
    id: "lec-3",
    name: "Dr. Sarah Al-Mansoor",
    email: "sarah.almansoor@university.edu",
    position: "Probationary",
    assignedCourses: ["ICT2142"],
    status: "Pending First Login",
    hasChangedDefaultPassword: false,
    defaultPassword: "UniCode@2004",
    createdAt: "2026-11-18",
  },
  {
    id: "lec-4",
    name: "Marcus Sterling",
    email: "marcus.sterling@university.edu",
    position: "Probationary",
    assignedCourses: ["CS3021", "IT1040"],
    status: "Pending First Login",
    hasChangedDefaultPassword: false,
    defaultPassword: "UniCode@2004",
    createdAt: "2026-11-21",
  },
];

const initialStudents: Student[] = [
  {
    id: "std-1",
    fullName: "Alex Chen",
    email: "alex.chen@university.edu",
    departmentId: "dept-1",
    academicYear: 4,
    semester: 2,
    defaultPassword: "Student@2026",
    profilePhotoUrl: null,
    accountStatus: "active",
    mustChangePassword: true,
    createdAt: "2026-10-15",
  },
  {
    id: "std-2",
    fullName: "Sarah Lin",
    email: "sarah.lin@university.edu",
    departmentId: "dept-1",
    academicYear: 4,
    semester: 1,
    defaultPassword: "Student@2026",
    profilePhotoUrl: null,
    accountStatus: "active",
    mustChangePassword: true,
    createdAt: "2026-10-16",
  },
  {
    id: "std-3",
    fullName: "Marcus Doe",
    email: "marcus.doe@university.edu",
    departmentId: "dept-3",
    academicYear: 3,
    semester: 2,
    defaultPassword: "SecurePass2026!",
    profilePhotoUrl: null,
    accountStatus: "active",
    mustChangePassword: false,
    createdAt: "2026-10-18",
  },
  {
    id: "std-4",
    fullName: "Priya Patel",
    email: "priya.patel@university.edu",
    departmentId: "dept-2",
    academicYear: 2,
    semester: 1,
    defaultPassword: "Student@2026",
    profilePhotoUrl: null,
    accountStatus: "active",
    mustChangePassword: true,
    createdAt: "2026-10-20",
  },
  {
    id: "std-5",
    fullName: "Liam Davis",
    email: "liam.davis@university.edu",
    departmentId: "dept-1",
    academicYear: 3,
    semester: 1,
    defaultPassword: "Student@2026",
    profilePhotoUrl: null,
    accountStatus: "active",
    mustChangePassword: true,
    createdAt: "2026-10-22",
  },
  {
    id: "std-6",
    fullName: "Maya Wang",
    email: "maya.wang@university.edu",
    departmentId: "dept-3",
    academicYear: 2,
    semester: 2,
    defaultPassword: "Student@2026",
    profilePhotoUrl: null,
    accountStatus: "active",
    mustChangePassword: true,
    createdAt: "2026-10-25",
  },
  {
    id: "std-7",
    fullName: "Carlos Ruiz",
    email: "carlos.ruiz@university.edu",
    departmentId: "dept-4",
    academicYear: 1,
    semester: 2,
    defaultPassword: "Student@2026",
    profilePhotoUrl: null,
    accountStatus: "active",
    mustChangePassword: true,
    createdAt: "2026-10-28",
  },
  {
    id: "std-8",
    fullName: "Aisha Tariq",
    email: "aisha.tariq@university.edu",
    departmentId: "dept-2",
    academicYear: 1,
    semester: 1,
    defaultPassword: "Student@2026",
    profilePhotoUrl: null,
    accountStatus: "inactive",
    mustChangePassword: true,
    createdAt: "2026-11-02",
  },
];

interface RawStudentRecord {
  id?: string;
  studentId?: string;
  fullName?: string;
  name?: string;
  email?: string;
  departmentId?: string;
  academicYear?: number;
  semester?: number;
  defaultPassword?: string;
  profilePhotoUrl?: string | null;
  accountStatus?: "active" | "inactive";
  status?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
}

const normalizeStudent = (raw: RawStudentRecord): Student => {
  const validYear: (1 | 2 | 3 | 4) = 
    raw.academicYear && [1, 2, 3, 4].includes(raw.academicYear) 
      ? (raw.academicYear as 1 | 2 | 3 | 4) 
      : 3;
  const validSem: (1 | 2) = 
    raw.semester && [1, 2].includes(raw.semester) 
      ? (raw.semester as 1 | 2) 
      : 1;

  return {
    id: raw.id || `std-${Math.random().toString(36).slice(2, 7)}`,
    studentId: raw.studentId,
    fullName: raw.fullName || raw.name || "Student Member",
    email: raw.email || "student@university.edu",
    departmentId: raw.departmentId || "dept-1",
    academicYear: validYear,
    semester: validSem,
    defaultPassword: raw.defaultPassword || "Student@2026",
    profilePhotoUrl: raw.profilePhotoUrl || null,
    accountStatus: (raw.accountStatus === "inactive" || raw.status === "Inactive") ? "inactive" : "active",
    mustChangePassword: raw.mustChangePassword !== false,
    createdAt: raw.createdAt || "2026-10-20",
  };
};

const initialProjects: Project[] = [
  {
    id: "proj-1",
    title: "University Event & Symposium Management System",
    description: "An integrated web and mobile platform for managing campus hackathons, symposiums, and workshop registrations with QR attendance.",
    type: "Group Project",
    departmentId: "dept-1",
    courseCode: "CS492",
    academicYear: 4,
    semester: 2,
    deadline: "2026-12-15",
    requirementsSource: "ai",
    requirementsContent: `# 1. Project Title\n**UNIVERSITY EVENT & SYMPOSIUM MANAGEMENT SYSTEM**\n\n## 2. Project Overview\nAn integrated, cloud-native platform for university-wide event scheduling, student badge QR generation, and real-time attendance telemetry.\n\n## 3. Problem Statement\nTraditional university workshops lack automated ticketing, leading to check-in queues and disjointed participant attendance reporting.\n\n## 4. Project Objectives\n1. Implement student attendee registration and automated email passes.\n2. Engineer an edge QR scanner for real-time check-in.\n3. Provide analytics dashboards with attendance velocity.\n\n## 5. Target Users & Stakeholders\n- Event Organizers\n- Enrolled Students\n- Faculty Evaluators\n\n## 6. Functional Requirements\n- FR-1: Attendee self-registration and QR issuance\n- FR-2: Lecturer event creation and capacity control\n- FR-3: Live scanner interface with offline sync\n- FR-4: Exportable CSV/PDF attendance logs\n\n## 7. Non-Functional Requirements\n- QR validation response < 150ms\n- End-to-end TLS encryption\n- 99.9% uptime during live symposiums\n\n## 8. System Features\n- Real-time attendance ledger\n- Role-based permissions for student organizers\n\n## 9. Technical Requirements\n- Next.js 16, TypeScript, Supabase PostgreSQL, Tailwind CSS\n\n## 10. Expected Deliverables\n- Milestone 1: Wireframes and database schema\n- Milestone 2: Working prototype and scanner API\n- Milestone 3: Production deployment and defense presentation\n\n## 11. Project Constraints\n- Mobile responsive down to 375px\n- Strict privacy compliance with student PII\n\n## 12. Evaluation Criteria\n- System Architecture (25%)\n- Feature Execution (30%)\n- Git Collaboration & Commits (20%)\n- Testing & Documentation (15%)\n- Presentation (10%)`,
    status: "Published",
    lecturerId: "lec-1",
    lecturerName: "Dr. Evelyn Reed",
    createdAt: "2026-11-10",
  },
  {
    id: "proj-2",
    title: "Distributed Microservices Architecture for Biomedical Telemetry",
    description: "High-throughput cloud pipeline ingesting real-time physiological telemetry from edge IoT patient monitors with anomaly alerting.",
    type: "Individual Project",
    departmentId: "dept-1",
    courseCode: "CS492",
    academicYear: 4,
    semester: 1,
    deadline: "2026-12-20",
    requirementsSource: "pdf",
    requirementsPdfName: "CS492_Biomedical_Telemetry_Specification.pdf",
    requirementsPdfSize: "1.4 MB",
    status: "Published",
    lecturerId: "lec-1",
    lecturerName: "Dr. Evelyn Reed",
    createdAt: "2026-11-14",
  },
  {
    id: "proj-3",
    title: "Multi-Tenant E-Commerce Core & Supply Chain Reconciliation",
    description: "Scalable B2B enterprise marketplace featuring automated multi-currency checkout, inventory reservations, and supplier reconciliation.",
    type: "Group Project",
    departmentId: "dept-2",
    courseCode: "ICT2142",
    academicYear: 2,
    semester: 1,
    deadline: "2026-12-28",
    requirementsSource: "ai",
    status: "Published",
    lecturerId: "lec-3",
    lecturerName: "Dr. Sarah Al-Mansoor",
    createdAt: "2026-11-19",
  },
  {
    id: "proj-4",
    title: "Automated Git Sprint Analytics & Peer Review Allocation Engine",
    description: "Deep GitHub webhook integration evaluating student commit patterns, PR review turnaround times, and sprint burndown tracking.",
    type: "Group Project",
    departmentId: "dept-3",
    courseCode: "SE3102",
    academicYear: 3,
    semester: 2,
    deadline: "2027-01-15",
    requirementsSource: "pdf",
    requirementsPdfName: "SE3102_Agile_Project_Rubric_v3.pdf",
    requirementsPdfSize: "920 KB",
    status: "Draft",
    lecturerId: "lec-1",
    lecturerName: "Dr. Evelyn Reed",
    createdAt: "2026-11-22",
  },
];

const initialActivities: ActivityLog[] = [
  {
    id: "act-1",
    user: "Dr. Arthur Vance (Admin)",
    action: "registered lecturer account",
    target: "Marcus Sterling (marcus.sterling@university.edu)",
    time: "2 hours ago",
    type: "lecturer",
  },
  {
    id: "act-2",
    user: "Dr. Arthur Vance (Admin)",
    action: "added new academic course",
    target: "IT1040: Database Design & Enterprise Models",
    time: "5 hours ago",
    type: "course",
  },
  {
    id: "act-3",
    user: "Dr. Arthur Vance (Admin)",
    action: "created faculty department",
    target: "Department of Management & Information Systems",
    time: "1 day ago",
    type: "department",
  },
  {
    id: "act-4",
    user: "System",
    action: "flagged default password pending change for",
    target: "Dr. Sarah Al-Mansoor",
    time: "2 days ago",
    type: "system",
  },
];

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>(() => {
    if (typeof window === "undefined") return initialDepartments;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.departments) return parsed.departments;
      }
    } catch {}
    return initialDepartments;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window === "undefined") return initialCourses;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.courses) return parsed.courses;
      }
    } catch {}
    return initialCourses;
  });

  const [lecturers, setLecturers] = useState<Lecturer[]>(() => {
    if (typeof window === "undefined") return initialLecturers;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lecturers) return parsed.lecturers;
      }
    } catch {}
    return initialLecturers;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window === "undefined") return initialStudents;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.students && Array.isArray(parsed.students)) {
          return parsed.students.map(normalizeStudent);
        }
      }
    } catch {}
    return initialStudents;
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    if (typeof window === "undefined") return initialActivities;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activities) return parsed.activities;
      }
    } catch {}
    return initialActivities;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window === "undefined") return initialProjects;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.projects && Array.isArray(parsed.projects)) {
          return parsed.projects;
        }
      }
    } catch {}
    return initialProjects;
  });

  const [activeRole, setActiveRole] = useState<"admin" | "lecturer" | "student">(() => {
    if (typeof window === "undefined") return "lecturer";
    try {
      const stored = sessionStorage.getItem("unicodetrack_pending_user_role");
      if (stored === "admin" || stored === "lecturer" || stored === "student") {
        return stored;
      }
    } catch {}
    return "lecturer";
  });

  const [activeLecturerEmail, setActiveLecturerEmail] = useState<string>("evelyn.reed@university.edu");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Sync to localStorage
  const persist = (
    deptList = departments,
    crsList = courses,
    lecList = lecturers,
    stdList = students,
    actList = activities,
    projList = projects
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          departments: deptList,
          courses: crsList,
          lecturers: lecList,
          students: stdList,
          activities: actList,
          projects: projList,
        })
      );
    } catch {
      // Ignore write errors
    }
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
      user: "Administrator",
      action,
      target,
      time: "Just now",
      type,
    };
    const updated = [newAct, ...activities.slice(0, 19)];
    setActivities(updated);
    return updated;
  };

  // Department Actions
  const addDepartment = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Department Name is required" };
    }
    const exists = departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return { success: false, error: "A department with this name already exists" };
    }

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updatedDepts = [newDept, ...departments];
    setDepartments(updatedDepts);
    const updatedActs = addActivity("created new department", trimmed, "department");
    persist(updatedDepts, courses, lecturers, students, updatedActs);
    showToast(`Department "${trimmed}" created successfully!`, "success");
    return { success: true };
  };

  const editDepartment = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Department Name is required" };
    }
    const exists = departments.some(
      (d) => d.id !== id && d.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return { success: false, error: "Another department already has this name" };
    }

    const updatedDepts = departments.map((d) => (d.id === id ? { ...d, name: trimmed } : d));
    setDepartments(updatedDepts);
    const updatedActs = addActivity("updated department name to", trimmed, "department");
    persist(updatedDepts, courses, lecturers, students, updatedActs);
    showToast(`Department updated to "${trimmed}"`, "success");
    return { success: true };
  };

  const deleteDepartment = (id: string) => {
    const dept = departments.find((d) => d.id === id);
    const updatedDepts = departments.filter((d) => d.id !== id);
    setDepartments(updatedDepts);
    const updatedActs = addActivity("deleted department", dept?.name || id, "department");
    persist(updatedDepts, courses, lecturers, students, updatedActs);
    showToast(`Department "${dept?.name}" removed`, "info");
  };

  // Course Actions
  const addCourse = (code: string, name: string) => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) return { success: false, error: "Course Code is required" };
    if (!trimmedName) return { success: false, error: "Course Name is required" };

    const duplicateCode = courses.some((c) => c.code.toUpperCase() === trimmedCode);
    if (duplicateCode) {
      return { success: false, error: `Course Code "${trimmedCode}" already exists` };
    }

    const newCourse: Course = {
      id: `crs-${Date.now()}`,
      code: trimmedCode,
      name: trimmedName,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updatedCourses = [newCourse, ...courses];
    setCourses(updatedCourses);
    const updatedActs = addActivity("added course", `${trimmedCode}: ${trimmedName}`, "course");
    persist(departments, updatedCourses, lecturers, students, updatedActs);
    showToast(`Course "${trimmedCode} - ${trimmedName}" added successfully!`, "success");
    return { success: true };
  };

  const editCourse = (id: string, code: string, name: string) => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) return { success: false, error: "Course Code is required" };
    if (!trimmedName) return { success: false, error: "Course Name is required" };

    const duplicateCode = courses.some(
      (c) => c.id !== id && c.code.toUpperCase() === trimmedCode
    );
    if (duplicateCode) {
      return { success: false, error: `Course Code "${trimmedCode}" is already in use` };
    }

    const updatedCourses = courses.map((c) =>
      c.id === id ? { ...c, code: trimmedCode, name: trimmedName } : c
    );
    setCourses(updatedCourses);
    const updatedActs = addActivity("updated course details for", trimmedCode, "course");
    persist(departments, updatedCourses, lecturers, students, updatedActs);
    showToast(`Course ${trimmedCode} updated`, "success");
    return { success: true };
  };

  const deleteCourse = (id: string) => {
    const crs = courses.find((c) => c.id === id);
    const updatedCourses = courses.filter((c) => c.id !== id);
    setCourses(updatedCourses);
    const updatedActs = addActivity("deleted course", crs?.code || id, "course");
    persist(departments, updatedCourses, lecturers, students, updatedActs);
    showToast(`Course "${crs?.code}" removed`, "info");
  };

  // Lecturer Actions
  const addLecturer = (data: {
    name: string;
    email: string;
    position: "Senior" | "Probationary";
    assignedCourses: string[];
  }) => {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();

    if (!trimmedName) return { success: false, error: "Lecturer Name is required" };
    if (!trimmedEmail) return { success: false, error: "Email Address is required" };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid institutional email" };
    }

    const exists = lecturers.some((l) => l.email.toLowerCase() === trimmedEmail);
    if (exists) {
      return { success: false, error: `Lecturer with email "${trimmedEmail}" already exists` };
    }

    const newLecturer: Lecturer = {
      id: `lec-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      position: data.position,
      assignedCourses: data.assignedCourses || [],
      status: "Pending First Login",
      hasChangedDefaultPassword: false,
      defaultPassword: "UniCode@2004",
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedLecturers = [newLecturer, ...lecturers];
    setLecturers(updatedLecturers);
    const updatedActs = addActivity(
      "created lecturer account for",
      `${trimmedName} (${trimmedEmail})`,
      "lecturer"
    );
    persist(departments, courses, updatedLecturers, students, updatedActs);
    showToast(`Lecturer account created for ${trimmedName}!`, "success");
    return { success: true, lecturer: newLecturer };
  };

  const editLecturer = (id: string, updates: Partial<Lecturer>) => {
    const updatedLecturers = lecturers.map((l) => (l.id === id ? { ...l, ...updates } : l));
    setLecturers(updatedLecturers);
    const updatedActs = addActivity("updated lecturer record", id, "lecturer");
    persist(departments, courses, updatedLecturers, students, updatedActs);
    showToast("Lecturer details updated successfully", "success");
    return { success: true };
  };

  const toggleLecturerStatus = (id: string) => {
    const lec = lecturers.find((l) => l.id === id);
    if (!lec) return;
    const nextStatus: "Active" | "Deactivated" =
      lec.status === "Deactivated" ? "Active" : "Deactivated";
    const updatedLecturers: Lecturer[] = lecturers.map((l) =>
      l.id === id ? { ...l, status: nextStatus } : l
    );
    setLecturers(updatedLecturers);
    const updatedActs = addActivity(
      `${nextStatus === "Deactivated" ? "deactivated" : "reactivated"} lecturer`,
      lec.name,
      "lecturer"
    );
    persist(departments, courses, updatedLecturers, students, updatedActs);
    showToast(`Lecturer ${lec.name} is now ${nextStatus}`, nextStatus === "Active" ? "success" : "info");
  };

  const deleteLecturer = (id: string) => {
    const lec = lecturers.find((l) => l.id === id);
    const updatedLecturers = lecturers.filter((l) => l.id !== id);
    setLecturers(updatedLecturers);
    const updatedActs = addActivity("removed lecturer account", lec?.name || id, "lecturer");
    persist(departments, courses, updatedLecturers, students, updatedActs);
    showToast(`Lecturer ${lec?.name} removed`, "info");
  };

  const changeLecturerPassword = (email: string, newPass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const lec = lecturers.find((l) => l.email.toLowerCase() === trimmedEmail);
    if (!lec) return false;

    const updatedLecturers: Lecturer[] = lecturers.map((l) =>
      l.email.toLowerCase() === trimmedEmail
        ? {
            ...l,
            hasChangedDefaultPassword: true,
            status: "Active" as const,
            defaultPassword: newPass,
          }
        : l
    );
    setLecturers(updatedLecturers);
    const updatedActs = addActivity("completed first-login password change", trimmedEmail, "system");
    persist(departments, courses, updatedLecturers, students, updatedActs);
    showToast("Password updated successfully! Welcome to your dashboard.", "success");
    return true;
  };

  const findLecturerByEmail = (email: string) => {
    return lecturers.find((l) => l.email.toLowerCase() === email.trim().toLowerCase());
  };

  // Student Actions
  const addStudent = (data: {
    fullName: string;
    email: string;
    departmentId: string;
    academicYear: 1 | 2 | 3 | 4;
    semester: 1 | 2;
    defaultPassword: string;
  }) => {
    const trimmedName = data.fullName.trim();
    const trimmedEmail = data.email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: "Full Name is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { success: false, error: "Please enter a valid university email address" };
    }

    if (students.some((s) => s.email.toLowerCase() === trimmedEmail)) {
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
    };

    const updatedStudents = [newStudent, ...students];
    setStudents(updatedStudents);
    const updatedActs = addActivity("registered new student account", trimmedName, "student");
    persist(departments, courses, lecturers, updatedStudents, updatedActs);
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
    const std = students.find((s) => s.id === id);
    if (!std) return { success: false, error: "Student not found" };

    if (updates.email) {
      const trimmedEmail = updates.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return { success: false, error: "Please enter a valid university email address" };
      }
      if (students.some((s) => s.id !== id && s.email.toLowerCase() === trimmedEmail)) {
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

    const updatedStudents = students.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    setStudents(updatedStudents);
    const updatedActs = addActivity(
      "updated student profile",
      updates.fullName || std.fullName,
      "student"
    );
    persist(departments, courses, lecturers, updatedStudents, updatedActs);
    showToast("Student details updated successfully", "success");
    return { success: true };
  };

  const toggleStudentStatus = (id: string) => {
    const std = students.find((s) => s.id === id);
    if (!std) return;
    const nextStatus: "active" | "inactive" =
      std.accountStatus === "active" ? "inactive" : "active";
    const updatedStudents = students.map((s) =>
      s.id === id ? { ...s, accountStatus: nextStatus } : s
    );
    setStudents(updatedStudents);
    const updatedActs = addActivity(
      `${nextStatus === "inactive" ? "deactivated" : "reactivated"} student account`,
      std.fullName,
      "student"
    );
    persist(departments, courses, lecturers, updatedStudents, updatedActs);
    showToast(
      `Student ${std.fullName} is now ${nextStatus === "active" ? "Active" : "Deactivated"}`,
      nextStatus === "active" ? "success" : "info"
    );
  };

  const deleteStudent = (id: string) => {
    const std = students.find((s) => s.id === id);
    const updatedStudents = students.filter((s) => s.id !== id);
    setStudents(updatedStudents);
    const updatedActs = addActivity(
      "removed student account",
      std?.fullName || id,
      "student"
    );
    persist(departments, courses, lecturers, updatedStudents, updatedActs);
    showToast(`Student ${std?.fullName || "record"} deleted`, "info");
  };

  const findStudentByEmail = (email: string) => {
    return students.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
  };

  const changeStudentPassword = (email: string, newPass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const std = students.find((s) => s.email.toLowerCase() === trimmedEmail);
    if (!std) return false;

    const updatedStudents = students.map((s) =>
      s.email.toLowerCase() === trimmedEmail
        ? {
            ...s,
            mustChangePassword: false,
            defaultPassword: newPass,
            accountStatus: "active" as const,
          }
        : s
    );
    setStudents(updatedStudents);
    const updatedActs = addActivity(
      "completed first-time student password change",
      trimmedEmail,
      "student"
    );
    persist(departments, courses, lecturers, updatedStudents, updatedActs);
    showToast("Password updated successfully! Welcome to your student dashboard.", "success");
    return true;
  };

  // Project Actions (Lecturer & Admin)
  const addProject = (data: Omit<Project, "id" | "createdAt">) => {
    if (!data.title.trim()) {
      return { success: false, error: "Project Title is required." };
    }
    if (!data.courseCode) {
      return { success: false, error: "Academic Course assignment is required." };
    }
    if (!data.departmentId) {
      return { success: false, error: "Department selection is required." };
    }

    const newProject: Project = {
      ...data,
      id: `proj-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    const updatedActs = addActivity(
      `${data.status === "Published" ? "published" : "created draft for"} academic project`,
      data.title,
      "project"
    );
    persist(departments, courses, lecturers, students, updatedActs, updatedProjects);
    showToast(
      `Project "${data.title}" ${data.status === "Published" ? "published successfully!" : "saved as draft."}`,
      "success"
    );
    return { success: true, project: newProject };
  };

  const editProject = (id: string, updates: Partial<Project>) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return { success: false, error: "Project not found" };

    const updatedProjects = projects.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProjects(updatedProjects);
    const updatedActs = addActivity("updated academic project", updates.title || proj.title, "project");
    persist(departments, courses, lecturers, students, updatedActs, updatedProjects);
    showToast("Project updated successfully", "success");
    return { success: true };
  };

  const publishProject = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    const updatedProjects: Project[] = projects.map((p) =>
      p.id === id ? { ...p, status: "Published" as const } : p
    );
    setProjects(updatedProjects);
    const updatedActs = addActivity("published academic project", proj.title, "project");
    persist(departments, courses, lecturers, students, updatedActs, updatedProjects);
    showToast(`Project "${proj.title}" is now published and visible to students!`, "success");
  };

  const archiveProject = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    const nextStatus = proj.status === "Archived" ? ("Published" as const) : ("Archived" as const);
    const updatedProjects: Project[] = projects.map((p) =>
      p.id === id ? { ...p, status: nextStatus } : p
    );
    setProjects(updatedProjects);
    const updatedActs = addActivity(
      `${nextStatus === "Archived" ? "archived" : "restored"} project`,
      proj.title,
      "project"
    );
    persist(departments, courses, lecturers, students, updatedActs, updatedProjects);
    showToast(`Project "${proj.title}" is now ${nextStatus}`, "info");
  };

  const deleteProject = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    const updatedProjects = projects.filter((p) => p.id !== id);
    setProjects(updatedProjects);
    const updatedActs = addActivity("removed project", proj?.title || id, "project");
    persist(departments, courses, lecturers, students, updatedActs, updatedProjects);
    showToast(`Project "${proj?.title || "record"}" removed`, "info");
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
        activeRole,
        setActiveRole,
        activeLecturerEmail,
        setActiveLecturerEmail,
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
