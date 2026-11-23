"use client";

import React, { createContext, useContext, useState } from "react";
import { Department, Course, Lecturer, Student, ActivityLog } from "@/types/admin";

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
    profilePhotoUrl: null,
    accountStatus: "active",
    createdAt: "2026-10-15",
  },
  {
    id: "std-2",
    fullName: "Sarah Lin",
    email: "sarah.lin@university.edu",
    departmentId: "dept-1",
    academicYear: 4,
    semester: 1,
    profilePhotoUrl: null,
    accountStatus: "active",
    createdAt: "2026-10-16",
  },
  {
    id: "std-3",
    fullName: "Marcus Doe",
    email: "marcus.doe@university.edu",
    departmentId: "dept-3",
    academicYear: 3,
    semester: 2,
    profilePhotoUrl: null,
    accountStatus: "active",
    createdAt: "2026-10-18",
  },
  {
    id: "std-4",
    fullName: "Priya Patel",
    email: "priya.patel@university.edu",
    departmentId: "dept-2",
    academicYear: 2,
    semester: 1,
    profilePhotoUrl: null,
    accountStatus: "active",
    createdAt: "2026-10-20",
  },
  {
    id: "std-5",
    fullName: "Liam Davis",
    email: "liam.davis@university.edu",
    departmentId: "dept-1",
    academicYear: 3,
    semester: 1,
    profilePhotoUrl: null,
    accountStatus: "active",
    createdAt: "2026-10-22",
  },
  {
    id: "std-6",
    fullName: "Maya Wang",
    email: "maya.wang@university.edu",
    departmentId: "dept-3",
    academicYear: 2,
    semester: 2,
    profilePhotoUrl: null,
    accountStatus: "active",
    createdAt: "2026-10-25",
  },
  {
    id: "std-7",
    fullName: "Carlos Ruiz",
    email: "carlos.ruiz@university.edu",
    departmentId: "dept-4",
    academicYear: 1,
    semester: 2,
    profilePhotoUrl: null,
    accountStatus: "active",
    createdAt: "2026-10-28",
  },
  {
    id: "std-8",
    fullName: "Aisha Tariq",
    email: "aisha.tariq@university.edu",
    departmentId: "dept-2",
    academicYear: 1,
    semester: 1,
    profilePhotoUrl: null,
    accountStatus: "inactive",
    createdAt: "2026-11-02",
  },
];

interface RawStudentRecord {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  departmentId?: string;
  academicYear?: number;
  semester?: number;
  profilePhotoUrl?: string | null;
  accountStatus?: "active" | "inactive";
  status?: string;
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
    fullName: raw.fullName || raw.name || "Student Member",
    email: raw.email || "student@university.edu",
    departmentId: raw.departmentId || "dept-1",
    academicYear: validYear,
    semester: validSem,
    profilePhotoUrl: raw.profilePhotoUrl || null,
    accountStatus: (raw.accountStatus === "inactive" || raw.status === "Inactive") ? "inactive" : "active",
    createdAt: raw.createdAt || "2026-10-20",
  };
};

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

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Sync to localStorage
  const persist = (
    deptList = departments,
    crsList = courses,
    lecList = lecturers,
    stdList = students,
    actList = activities
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
      profilePhotoUrl: null,
      accountStatus: "active",
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

  return (
    <AdminDataContext.Provider
      value={{
        departments,
        courses,
        lecturers,
        students,
        activities,
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
