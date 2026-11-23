"use client";

import React, { createContext, useContext, useState } from "react";
import { Department, Course, Lecturer, Student, ActivityLog, Project } from "@/types/admin";
import { ProjectGroup, ProjectTimelineActivity, ProposalSubmission, LecturerFeedback, GitHubCommit, GitHubBranch } from "@/types/project";
import { EvaluationRubric, ProjectEvaluation, DEFAULT_ACADEMIC_RUBRIC_CRITERIA } from "@/types/evaluation";
import {
  ERDiagramSubmission,
  ERDiagramAIAnalysis,
  ERLecturerFeedback,
  DEFAULT_ER_DIAGRAM_RUBRIC,
  ProjectDatabaseDesignConfig,
} from "@/types/er-diagram";
import { getDemoCProjectCommits } from "@/services/github/client";

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

  // Academic Group Workspaces & GitHub Integration
  groups: ProjectGroup[];
  addGroup: (data: Omit<ProjectGroup, "id" | "createdAt">) => { success: boolean; group?: ProjectGroup };
  updateGroup: (id: string, updates: Partial<ProjectGroup>) => { success: boolean };
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
  activeLecturerEmail: string;
  setActiveLecturerEmail: (email: string) => void;
  activeStudentEmail: string;
  setActiveStudentEmail: (email: string) => void;

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
    databaseDesignConfig: {
      enabled: true,
      isRequired: true,
      deadline: "2026-12-10",
      expectedDesignDescription: "Relational database model capturing campus attendees, departments, symposium events, QR registrations (associative bridge entity), and telemetry logs.",
      expectedEntities: ["departments", "attendees", "symposium_events", "event_registrations", "sensor_telemetry"],
      expectedRelationships: [
        "departments (1) to (N) attendees",
        "attendees (M) to (N) symposium_events via event_registrations",
        "sensor_telemetry logs for real-time edge streaming",
      ],
      expectedConstraints: [
        "Unique student_id and email in attendees",
        "Composite unique constraint on (event_id, attendee_id) in event_registrations",
        "Foreign key cascade and restrict rules",
      ],
      rubricCriteria: [...DEFAULT_ER_DIAGRAM_RUBRIC],
    },
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

const initialTimelineActivities: ProjectTimelineActivity[] = [
  {
    id: "tl-1",
    projectId: "proj-1",
    groupId: "grp-proj-1-1",
    groupNumber: 1,
    type: "proposal_approved",
    user: "Dr. Evelyn Reed",
    userRole: "lecturer",
    action: "approved project proposal",
    target: "CS492_Group01_Proposal_Final.pdf (Score: 94/100)",
    timestamp: "3 days ago",
  },
  {
    id: "tl-2",
    projectId: "proj-1",
    groupId: "grp-proj-1-1",
    groupNumber: 1,
    type: "repo_connected",
    user: "Alex Chen",
    userRole: "student",
    action: "connected GitHub repository",
    target: "https://github.com/unicodetrack-demo/cybernova-event-hub",
    timestamp: "4 days ago",
  },
  {
    id: "tl-3",
    projectId: "proj-1",
    groupId: "grp-proj-1-1",
    groupNumber: 1,
    type: "proposal_submitted",
    user: "Alex Chen",
    userRole: "student",
    action: "submitted official project proposal",
    target: "CS492_Group01_Proposal_Final.pdf (v1.0)",
    timestamp: "5 days ago",
  },
  {
    id: "tl-4",
    projectId: "proj-1",
    groupId: "grp-proj-1-2",
    groupNumber: 2,
    type: "proposal_submitted",
    user: "Maya Wang",
    userRole: "student",
    action: "submitted initial proposal",
    target: "CS492_Group02_Project_Proposal_Draft.pdf",
    timestamp: "2 days ago",
  },
  {
    id: "tl-5",
    projectId: "proj-1",
    groupId: "grp-proj-1-1",
    groupNumber: 1,
    type: "commit_pushed",
    user: "Priya Patel",
    userRole: "student",
    action: "pushed 3 commits to branch",
    target: "feature/qr-scanner",
    timestamp: "5 hours ago",
  },
];

const initialGroups: ProjectGroup[] = [
  {
    id: "grp-proj-1-1",
    projectId: "proj-1",
    groupNumber: 1,
    groupName: "Group 01: Team CyberNova",
    workspaceId: "ws-proj-1-1",
    members: [
      {
        studentId: "std-1",
        fullName: "Alex Chen",
        email: "alex.chen@university.edu",
        department: "Department of Computer Science & Engineering",
        academicYear: 4,
        semester: 2,
        role: "Team Lead",
        githubUsername: "alexchen-dev",
        commitsCount: 28,
        avatar: null,
      },
      {
        studentId: "std-2",
        fullName: "Sarah Lin",
        email: "sarah.lin@university.edu",
        department: "Department of Computer Science & Engineering",
        academicYear: 4,
        semester: 1,
        role: "Member",
        githubUsername: "sarahlin-code",
        commitsCount: 22,
        avatar: null,
      },
      {
        studentId: "std-4",
        fullName: "Priya Patel",
        email: "priya.patel@university.edu",
        department: "Department of Information Technology",
        academicYear: 2,
        semester: 1,
        role: "Member",
        githubUsername: "priyapatel-eng",
        commitsCount: 16,
        avatar: null,
      },
      {
        studentId: "std-5",
        fullName: "Liam Davis",
        email: "liam.davis@university.edu",
        department: "Department of Computer Science & Engineering",
        academicYear: 3,
        semester: 1,
        role: "Member",
        githubUsername: "liamdavis-sys",
        commitsCount: 14,
        avatar: null,
      },
    ],
    repoUrl: "https://github.com/unicodetrack-demo/cybernova-event-hub",
    repoName: "cybernova-event-hub",
    repoOwner: "unicodetrack-demo",
    defaultBranch: "main",
    repoStatus: "connected",
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
    totalCommits: 80,
    status: "active",
    progress: 75,
    proposalStatus: "approved",
    evaluationStatus: "ai_completed",
    latestEvaluationId: "eval-grp-proj-1-1-1",
    evaluationScore: 84,
    proposal: {
      id: "prop-1",
      groupId: "grp-proj-1-1",
      title: "Distributed University Symposium & Attendance Platform",
      description: "An integrated cloud-native system for real-time QR check-in, attendance verification, and automated evaluation metrics.",
      fileName: "CS492_Group01_Proposal_Final.pdf",
      fileSize: "1.85 MB",
      submittedBy: "Alex Chen",
      submittedByEmail: "alex.chen@university.edu",
      submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: "approved",
      version: 1,
      feedback: {
        id: "fb-1",
        lecturerName: "Dr. Evelyn Reed",
        decision: "approved",
        comments: "Outstanding system architecture and well-formulated non-functional requirements. The edge QR verification threat model is thorough. Approved to commence Milestone 2 sprint.",
        reviewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        rubricScore: 94,
      },
    },
    branches: [
      {
        name: "main",
        isDefault: true,
        latestCommitHash: "7b4c89a",
        latestCommitMessage: "feat(core): implement high-throughput circular queue buffer",
        updatedAt: "2 hours ago",
      },
      {
        name: "feature/qr-scanner",
        isDefault: false,
        latestCommitHash: "4e9d12f",
        latestCommitMessage: "feat(scanner): edge packet validation routine",
        updatedAt: "5 hours ago",
      },
      {
        name: "dev",
        isDefault: false,
        latestCommitHash: "1a8e34c",
        latestCommitMessage: "test: unit tests for packet serialization in C",
        updatedAt: "1 day ago",
      },
    ],
    commits: getDemoCProjectCommits("main"),
    createdAt: "2026-11-12",
  },
  {
    id: "grp-proj-1-2",
    projectId: "proj-1",
    groupNumber: 2,
    groupName: "Group 02: Team ApexEngineers",
    workspaceId: "ws-proj-1-2",
    members: [
      {
        studentId: "std-6",
        fullName: "Maya Wang",
        email: "maya.wang@university.edu",
        department: "Department of Software Engineering",
        academicYear: 2,
        semester: 2,
        role: "Team Lead",
        githubUsername: "mayawang-code",
        commitsCount: 20,
        avatar: null,
      },
      {
        studentId: "std-7",
        fullName: "Carlos Ruiz",
        email: "carlos.ruiz@university.edu",
        department: "Department of Management & Information Systems",
        academicYear: 1,
        semester: 2,
        role: "Member",
        githubUsername: "carlosruiz-dev",
        commitsCount: 15,
        avatar: null,
      },
      {
        studentId: "std-8",
        fullName: "Aisha Tariq",
        email: "aisha.tariq@university.edu",
        department: "Department of Information Technology",
        academicYear: 1,
        semester: 1,
        role: "Member",
        githubUsername: "aishatariq",
        commitsCount: 11,
        avatar: null,
      },
      {
        studentId: "std-3",
        fullName: "Marcus Doe",
        email: "marcus.doe@university.edu",
        department: "Department of Software Engineering",
        academicYear: 3,
        semester: 2,
        role: "Member",
        githubUsername: "marcusdoe",
        commitsCount: 8,
        avatar: null,
      },
    ],
    repoUrl: "https://github.com/unicodetrack-demo/apex-symposium-web",
    repoName: "apex-symposium-web",
    repoOwner: "unicodetrack-demo",
    defaultBranch: "main",
    repoStatus: "connected",
    lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
    totalCommits: 54,
    status: "active",
    progress: 55,
    proposalStatus: "under_review",
    proposal: {
      id: "prop-2",
      groupId: "grp-proj-1-2",
      title: "Symposium Check-in Mobile Companion & Badge Sync",
      description: "Low-latency offline mobile companion application synchronizing attendee badges.",
      fileName: "CS492_Group02_Project_Proposal_Draft.pdf",
      fileSize: "1.42 MB",
      submittedBy: "Maya Wang",
      submittedByEmail: "maya.wang@university.edu",
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: "under_review",
      version: 1,
    },
    branches: [
      {
        name: "main",
        isDefault: true,
        latestCommitHash: "3f8b12a",
        latestCommitMessage: "feat: attendee registration workflow",
        updatedAt: "3 hours ago",
      },
    ],
    commits: getDemoCProjectCommits("main"),
    createdAt: "2026-11-14",
  },
  {
    id: "grp-proj-3-1",
    projectId: "proj-3",
    groupNumber: 1,
    groupName: "Group 01: Team SupplyCore",
    workspaceId: "ws-proj-3-1",
    members: [
      {
        studentId: "std-1",
        fullName: "Alex Chen",
        email: "alex.chen@university.edu",
        department: "Department of Computer Science & Engineering",
        academicYear: 4,
        semester: 2,
        role: "Team Lead",
        githubUsername: "alexchen-dev",
        commitsCount: 16,
        avatar: null,
      },
      {
        studentId: "std-2",
        fullName: "Sarah Lin",
        email: "sarah.lin@university.edu",
        department: "Department of Computer Science & Engineering",
        academicYear: 4,
        semester: 1,
        role: "Member",
        githubUsername: "sarahlin-code",
        commitsCount: 12,
        avatar: null,
      },
    ],
    repoUrl: "https://github.com/unicodetrack-demo/supplycore-b2b",
    repoName: "supplycore-b2b",
    repoOwner: "unicodetrack-demo",
    defaultBranch: "main",
    repoStatus: "connected",
    lastSyncAt: new Date(Date.now() - 14400000).toISOString(),
    totalCommits: 28,
    status: "active",
    progress: 40,
    proposalStatus: "changes_requested",
    proposal: {
      id: "prop-3",
      groupId: "grp-proj-3-1",
      title: "Multi-Tenant Enterprise Marketplace Core",
      description: "B2B catalog engine and automated invoice reconciliation.",
      fileName: "ICT2142_SupplyCore_Proposal_v1.pdf",
      fileSize: "2.1 MB",
      submittedBy: "Alex Chen",
      submittedByEmail: "alex.chen@university.edu",
      submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: "changes_requested",
      version: 1,
      feedback: {
        id: "fb-3",
        lecturerName: "Dr. Sarah Al-Mansoor",
        decision: "changes_requested",
        comments: "Please expand on multi-currency reconciliation and add automated audit trail specifications. Resubmit updated PDF proposal.",
        reviewedAt: new Date(Date.now() - 86400000).toISOString(),
        rubricScore: 68,
      },
    },
    branches: [
      {
        name: "main",
        isDefault: true,
        latestCommitHash: "9a1c45e",
        latestCommitMessage: "feat: order processing state machine",
        updatedAt: "1 day ago",
      },
    ],
    commits: getDemoCProjectCommits("main"),
    createdAt: "2026-11-20",
  },
];

const initialRubrics: Record<string, EvaluationRubric> = {
  "proj-1": {
    id: "rubric-proj-1",
    projectId: "proj-1",
    title: "CS492 Academic Capstone Evaluation Rubric",
    description: "Assessment evaluating algorithmic correctness, code quality, error handling, and Git collaboration.",
    totalMarks: 100,
    criteria: [...DEFAULT_ACADEMIC_RUBRIC_CRITERIA],
    isActive: true,
    createdAt: "2026-11-20T10:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
  },
  "proj-3": {
    id: "rubric-proj-3",
    projectId: "proj-3",
    title: "ICT2142 Enterprise Systems Evaluation Rubric",
    description: "Assessment criteria for multi-tenant software architecture and database design.",
    totalMarks: 100,
    criteria: [...DEFAULT_ACADEMIC_RUBRIC_CRITERIA],
    isActive: true,
    createdAt: "2026-11-21T10:00:00Z",
    updatedAt: "2026-11-21T10:00:00Z",
  },
};

const initialEvaluations: ProjectEvaluation[] = [
  {
    id: "eval-grp-proj-1-1-1",
    projectId: "proj-1",
    groupId: "grp-proj-1-1",
    groupNumber: 1,
    groupName: "Group 01: Team CyberNova",
    lecturerId: "lec-1",
    lecturerName: "Dr. Evelyn Reed",
    rubricId: "rubric-proj-1",
    rubricTitle: "CS492 Academic Capstone Evaluation Rubric",
    version: 1,
    commitSha: "7b4c89a",
    repoUrl: "https://github.com/unicodetrack-demo/cybernova-event-hub",
    status: "ai_completed",
    totalScore: 84,
    maxScore: 100,
    percentage: 84,
    aiModel: "gemini-2.5-flash",
    summary: "The project exhibits clean academic software engineering, well-structured modular C code, and defensive programming in circular telemetry queue management. Minor gaps exist in persistent disk logging and defensive voltage input clamping.",
    gitTelemetryAnalysis: "Repository exhibits regular commit velocity across development phases. Commits are distributed across team members with descriptive commit messages following conventional commits.",
    criterionScores: [
      {
        id: "score-crit-1",
        criterionId: "crit-1",
        criterionName: "Problem-solving and Algorithm Design",
        maxMarks: 20,
        aiScore: 18,
        lecturerScore: 18,
        finalScore: 18,
        percentage: 90,
        explanation: "Circular buffer queue with head/tail modulo arithmetic is correctly implemented to ingest real-time packets without memory fragmentation.",
        evidence: [
          {
            file: "src/main.c",
            functionName: "enqueue",
            lineRange: "60-68",
            commitRef: "7b4c89a",
            snippet: "Queue buffer capacity boundary check and tail pointer increment.",
          },
        ],
        suggestions: [
          "Consider documenting algorithmic space/time complexity in telemetry header.",
        ],
      },
      {
        id: "score-crit-2",
        criterionId: "crit-2",
        criterionName: "Code Correctness and Execution",
        maxMarks: 20,
        aiScore: 17,
        lecturerScore: 17,
        finalScore: 17,
        percentage: 85,
        explanation: "Compiles cleanly under -Wall -Wextra -std=c11. Sensor packet structs are initialized properly and queue operations produce zero runtime memory leaks.",
        evidence: [
          {
            file: "src/main.c",
            functionName: "main",
            lineRange: "80-115",
            commitRef: "7b4c89a",
            snippet: "Clean stack allocation and orderly packet ingestion and drainage loop.",
          },
        ],
        suggestions: [
          "Add automated unit test assertions for empty queue dequeue edge cases.",
        ],
      },
      {
        id: "score-crit-3",
        criterionId: "crit-3",
        criterionName: "Code Quality and Readability",
        maxMarks: 15,
        aiScore: 13,
        lecturerScore: 13,
        finalScore: 13,
        percentage: 87,
        explanation: "Consistent 4-space indentation, clear struct definitions, and descriptive variable naming throughout `src/main.c` and `src/sensor.c`.",
        evidence: [
          {
            file: "include/telemetry.h",
            functionName: "typedef struct",
            lineRange: "10-25",
            commitRef: "7b4c89a",
            snippet: "Clear separation of headers from implementation files.",
          },
        ],
        suggestions: [
          "Add Doxygen style comments for all exported functions in header files.",
        ],
      },
      {
        id: "score-crit-4",
        criterionId: "crit-4",
        criterionName: "Data Structures and Logic",
        maxMarks: 15,
        aiScore: 13,
        lecturerScore: 13,
        finalScore: 13,
        percentage: 87,
        explanation: "Appropriate circular buffer array structure SensorPacket buffer[BUFFER_CAPACITY]. Struct padding and memory alignment are well organized.",
        evidence: [
          {
            file: "src/main.c",
            functionName: "CircularQueue",
            lineRange: "47-52",
            commitRef: "7b4c89a",
            snippet: "Struct layout encapsulates head, tail, and count primitives.",
          },
        ],
        suggestions: [
          "Explore dynamic queue resizing if buffer capacity overflows under burst telemetry.",
        ],
      },
      {
        id: "score-crit-5",
        criterionId: "crit-5",
        criterionName: "Error Handling and Boundary Checks",
        maxMarks: 10,
        aiScore: 7,
        lecturerScore: 7,
        finalScore: 7,
        percentage: 70,
        explanation: "Queue buffer overflow and underflow return flags are checked. However, calibration routines in `src/sensor.c` lack checks against negative reference voltages.",
        evidence: [
          {
            file: "src/sensor.c",
            functionName: "calibrate_temperature",
            lineRange: "166-171",
            commitRef: "7b4c89a",
            snippet: "Raw voltage divided by v_ref without defensive zero/negative guard.",
          },
        ],
        suggestions: [
          "Add guard clause `if (v_ref <= 0.0) return -1.0;`.",
          "Log warnings to stderr when anomaly flags are triggered.",
        ],
      },
      {
        id: "score-crit-6",
        criterionId: "crit-6",
        criterionName: "Project Requirements Coverage",
        maxMarks: 10,
        aiScore: 8,
        lecturerScore: 8,
        finalScore: 8,
        percentage: 80,
        explanation: "Satisfies mandatory real-time ingestion, CRC verification, and multi-sensor calibration requirements. Offline file storage ledger remains pending.",
        evidence: [
          {
            file: "src/telemetry.c",
            functionName: "compute_crc16",
            lineRange: "131-144",
            commitRef: "7b4c89a",
            snippet: "CRC-16 polynomial bitwise checksum.",
          },
        ],
        suggestions: [
          "Implement persistent telemetry ledger to satisfy secondary project deliverable.",
        ],
      },
      {
        id: "score-crit-7",
        criterionId: "crit-7",
        criterionName: "GitHub Development Activity",
        maxMarks: 5,
        aiScore: 4,
        lecturerScore: 4,
        finalScore: 4,
        percentage: 80,
        explanation: "Regular commit frequency across 3 branches (main, feature/qr-scanner, dev). Conventional commit messages utilized throughout.",
        evidence: [
          {
            file: "git://repository",
            functionName: "branches",
            lineRange: "3 branches",
            commitRef: "7b4c89a",
            snippet: "Branching hygiene and feature-based branch workflow.",
          },
        ],
        suggestions: [
          "Ensure all pull requests undergo peer review before merging to main.",
        ],
      },
      {
        id: "score-crit-8",
        criterionId: "crit-8",
        criterionName: "Documentation and Comments",
        maxMarks: 5,
        aiScore: 4,
        lecturerScore: 4,
        finalScore: 4,
        percentage: 80,
        explanation: "Comprehensive README.md outlining build instructions, architecture diagrams, and clean Makefile with all and clean targets.",
        evidence: [
          {
            file: "Makefile",
            functionName: "all",
            lineRange: "1-12",
            commitRef: "7b4c89a",
            snippet: "Standard gcc flags (-Wall -Wextra -std=c11 -O2).",
          },
        ],
        suggestions: [
          "Add brief troubleshooting section to README.md.",
        ],
      },
    ],
    requirementsCoverage: [
      {
        requirement: "FR-1: Real-time Circular Telemetry Ingestion Buffer",
        status: "Implemented",
        explanation: "Implemented via `CircularQueue` in `src/main.c` with bounded capacity, enqueue/dequeue primitives, and overflow guards.",
      },
      {
        requirement: "FR-2: CRC-16 Packet Integrity Verification",
        status: "Implemented",
        explanation: "Hardware polynomial CRC calculation fully implemented in `src/telemetry.c`.",
      },
      {
        requirement: "FR-3: Multi-Channel Analog Sensor Calibration",
        status: "Implemented",
        explanation: "Temperature and pressure ADC conversion functions defined in `src/sensor.c`.",
      },
      {
        requirement: "FR-4: Anomaly Detection and Notification Flagging",
        status: "Partial",
        explanation: "Anomaly flags are detected and printed to terminal; however, a dedicated alert callback or persistent error ledger is not yet implemented.",
      },
      {
        requirement: "FR-5: Persistent File System Logging & Offline Storage",
        status: "Missing",
        explanation: "No persistent file I/O operations (`fopen`/`fwrite`) found in the retrieved source files.",
      },
      {
        requirement: "NFR-1: Zero Memory Leaks & Fixed Stack Allocations",
        status: "Implemented",
        explanation: "Clean stack and static buffer allocations utilized throughout; no unmanaged `malloc` allocations observed.",
      },
    ],
    generalSuggestions: [
      "Add explicit input validation in calibration routines to prevent potential divide-by-zero conditions.",
      "Expand unit testing suite in `Makefile` with a `test` target validating buffer boundary conditions.",
      "Implement persistent telemetry logging to secondary storage to satisfy all capstone milestone specifications.",
    ],
    evaluatedAt: "2026-11-23T14:30:00Z",
    createdAt: "2026-11-23T14:30:00Z",
    updatedAt: "2026-11-23T14:30:00Z",
  },
];

const initialERSubmissions: ERDiagramSubmission[] = [
  {
    id: "er-sub-grp-proj-1-1",
    projectId: "proj-1",
    groupId: "grp-proj-1-1",
    groupNumber: 1,
    groupName: "Group 01: Team CyberNova",
    submittedByName: "Alex Chen",
    submittedByEmail: "alex.chen@university.edu",
    fileName: "CS492_Group01_ER_Diagram_v1.pdf",
    fileSize: "1.2 MB",
    fileType: "pdf",
    fileUrl: "/demo/CS492_Group01_ER_Diagram_v1.pdf",
    version: 1,
    versionNote: "Initial submission covering attendees, events, registrations, and sensor telemetry tables.",
    status: "reviewed",
    submittedAt: "2026-11-20T14:00:00Z",
    aiAnalysis: {
      id: "er-analysis-init-1",
      submissionId: "er-sub-grp-proj-1-1",
      version: 1,
      analyzedAt: "2026-11-20T14:10:00Z",
      aiModel: "gemini-2.5-flash",
      overallCorrectnessScore: 86,
      completenessScore: 88,
      implementationConsistencyScore: 90,
      totalSuggestedScore: 84,
      maxMarks: 100,
      summary: "The submitted ER diagram is well-structured and aligns closely with the PostgreSQL DDL schema in the repository. Core entities, primary keys, and the associative registration bridge table satisfy all capstone requirements. Minor enhancements recommended for 3NF normalization of sensor metadata and composite uniqueness constraints.",
      missingEntities: [],
      missingAttributes: ["v_ref reference voltage in sensor telemetry"],
      incorrectKeys: [],
      cardinalityProblems: ["event_registrations requires composite unique constraint (event_id, attendee_id)"],
      normalizationConcerns: ["sensor_type attribute in telemetry_logs has minor transitive dependency"],
      sqlImplementationDiscrepancies: [],
      issues: [
        {
          id: "iss-1",
          title: "Missing Unique Constraint on Composite Bridge Entity",
          severity: "Major",
          category: "relationships",
          explanation: "The Many-to-Many association between Attendees and SymposiumEvents correctly specifies event_registrations. However, in the diagram, the composite candidate key (event_id, attendee_id) lacks an explicit unique alternate key constraint, allowing duplicate registration records for the same student in an event.",
          expectedCorrection: "Add an alternate candidate key or composite unique constraint: CONSTRAINT unique_event_attendee UNIQUE (event_id, attendee_id).",
          relatedElement: "event_registrations bridge entity",
          relevantCodeFile: "database/schema.sql",
          codeLineRange: "L35-L45",
          confidenceLevel: "High",
          status: "Definitely incorrect",
        },
        {
          id: "iss-2",
          title: "Transitive Dependency in Sensor Telemetry Table (2NF / 3NF Concern)",
          severity: "Minor",
          category: "normalization",
          explanation: "The sensor_telemetry entity embeds sensor_type directly alongside sensor_id. If sensor types have metadata (e.g. calibration offsets, units of measure), storing them in the raw telemetry stream creates update anomalies and duplicate storage.",
          expectedCorrection: "Normalize into a dedicated sensors lookup entity with (id, sensor_type, unit, v_ref) and reference it via Foreign Key sensor_id.",
          relatedElement: "sensor_telemetry.sensor_type",
          relevantCodeFile: "database/schema.sql",
          codeLineRange: "L47-L55",
          confidenceLevel: "Medium",
          status: "Potentially incorrect",
        },
        {
          id: "iss-3",
          title: "Referential Integrity Cascade Action on Department Deletion",
          severity: "Suggestion",
          category: "keys",
          explanation: "Foreign key department_id in attendees utilizes ON DELETE RESTRICT in the SQL implementation, whereas the ER diagram does not explicitly document the deletion rule for orphan attendee records.",
          expectedCorrection: "Document deletion semantics on the ER diagram relationship line (e.g. 'Restrict' or 'Set Null').",
          relatedElement: "departments -> attendees relationship",
          relevantCodeFile: "database/schema.sql",
          codeLineRange: "L17-L20",
          confidenceLevel: "High",
          status: "Potentially incorrect",
        },
      ],
      criterionEvaluations: [
        {
          criterionId: "er-crit-1",
          criterionName: "ER Diagram Completeness",
          maxMarks: 15,
          suggestedMarks: 13,
          finalMarks: 13,
          explanation: "All 5 required problem domain entities are documented in the ER diagram.",
          supportingEvidence: "Departments, Attendees, SymposiumEvents, EventRegistrations, and SensorTelemetry present.",
          identifiedProblems: [],
        },
        {
          criterionId: "er-crit-2",
          criterionName: "Entity and Attribute Correctness",
          maxMarks: 15,
          suggestedMarks: 13,
          finalMarks: 13,
          explanation: "Clean entity boundaries and sensible attribute typing.",
          supportingEvidence: "Attributes like student_id, qr_hash, and capacity are well assigned.",
          identifiedProblems: [],
        },
        {
          criterionId: "er-crit-3",
          criterionName: "Primary and Foreign Key Correctness",
          maxMarks: 15,
          suggestedMarks: 13,
          finalMarks: 13,
          explanation: "Surrogate integer primary keys and foreign key pairings are accurately marked.",
          supportingEvidence: "department_id and event_id correctly reference their respective parent primary keys.",
          identifiedProblems: [],
        },
        {
          criterionId: "er-crit-4",
          criterionName: "Relationship and Cardinality Correctness",
          maxMarks: 15,
          suggestedMarks: 12,
          finalMarks: 12,
          explanation: "Many-to-Many relationship between attendees and events correctly deploys an associative entity. However, composite uniqueness requires explicit notation.",
          supportingEvidence: "Associative table event_registrations models (M:N) cardinality.",
          identifiedProblems: ["Missing composite alternate key indicator on associative table."],
        },
        {
          criterionId: "er-crit-5",
          criterionName: "Normalization and Redundancy",
          maxMarks: 10,
          suggestedMarks: 8,
          finalMarks: 8,
          explanation: "Core entities are in 2NF. Telemetry reading stream has a minor transitive attribute dependency between sensor_type and sensor_id.",
          supportingEvidence: "SensorTelemetry entity embeds sensor_type directly.",
          identifiedProblems: ["Consider separating sensor metadata from continuous telemetry time-series records."],
        },
        {
          criterionId: "er-crit-6",
          criterionName: "ER Diagram to SQL/Code Consistency",
          maxMarks: 20,
          suggestedMarks: 18,
          finalMarks: 18,
          explanation: "Excellent consistency: All 5 ER diagram entities match table definitions in database/schema.sql.",
          supportingEvidence: "Lines 1-55 in database/schema.sql match ER diagram entity definitions.",
          identifiedProblems: [],
        },
        {
          criterionId: "er-crit-7",
          criterionName: "Database Implementation Quality",
          maxMarks: 10,
          suggestedMarks: 8,
          finalMarks: 8,
          explanation: "Clean DDL syntax with foreign key constraints, default timestamps, and unique constraints.",
          supportingEvidence: "database/schema.sql includes CHECK (capacity > 0) and unique constraints.",
          identifiedProblems: [],
        },
      ],
      recommendations: [
        "Add explicit composite unique constraint on (event_id, attendee_id) to prevent duplicate event passes.",
        "Extract sensors metadata into an independent 3NF entity and link via foreign key to telemetry logs.",
        "Document foreign key deletion rules (CASCADE vs RESTRICT) directly on ER diagram relationship connectors.",
      ],
      sqlSchemaVerified: true,
      sqlVerificationNote: "Verified against 1 database schema file: database/schema.sql.",
    },
    lecturerFeedback: {
      id: "fb-er-1",
      lecturerName: "Dr. Evelyn Reed",
      reviewedAt: "2026-11-21T10:00:00Z",
      approvedMarks: 85,
      status: "published",
      generalComments: "Commendable database design with clean associative mapping for student registrations. Please ensure the composite key uniqueness constraint is added to the SQL migration before final deployment.",
      allowStudentAIFeedbackView: true,
      isPublished: true,
      publishedAt: "2026-11-21T10:00:00Z",
    },
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
  const [activeStudentEmail, setActiveStudentEmail] = useState<string>("alex.chen@university.edu");

  const [groups, setGroups] = useState<ProjectGroup[]>(() => {
    if (typeof window === "undefined") return initialGroups;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.groups && Array.isArray(parsed.groups)) {
          return parsed.groups;
        }
      }
    } catch {}
    return initialGroups;
  });

  const [timelineActivities, setTimelineActivities] = useState<ProjectTimelineActivity[]>(() => {
    if (typeof window === "undefined") return initialTimelineActivities;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timelineActivities && Array.isArray(parsed.timelineActivities)) {
          return parsed.timelineActivities;
        }
      }
    } catch {}
    return initialTimelineActivities;
  });

  const [rubrics, setRubrics] = useState<Record<string, EvaluationRubric>>(() => {
    if (typeof window === "undefined") return initialRubrics;
    try {
      const saved = localStorage.getItem("unicodetrack_rubrics_store");
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialRubrics;
  });

  const [evaluations, setEvaluations] = useState<ProjectEvaluation[]>(() => {
    if (typeof window === "undefined") return initialEvaluations;
    try {
      const saved = localStorage.getItem("unicodetrack_evaluations_store");
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialEvaluations;
  });

  const [erSubmissions, setERSubmissions] = useState<ERDiagramSubmission[]>(() => {
    if (typeof window === "undefined") return initialERSubmissions;
    try {
      const saved = localStorage.getItem("unicodetrack_er_submissions_store");
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialERSubmissions;
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Sync to localStorage
  const persist = (
    deptList = departments,
    crsList = courses,
    lecList = lecturers,
    stdList = students,
    actList = activities,
    projList = projects,
    grpList = groups,
    timelineList = timelineActivities
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
          groups: grpList,
          timelineActivities: timelineList,
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
    persist(departments, courses, lecturers, students, updatedActs, updatedProjects, groups, timelineActivities);
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

    persist(departments, courses, lecturers, students, activities, projects, updatedGroups, updatedTimeline);
    showToast(`Group "${data.groupName}" formed successfully!`, "success");
    return { success: true, group: newGroup };
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
    persist(departments, courses, lecturers, students, activities, projects, groups, updated);
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
      lecturerName: "Dr. Evelyn Reed",
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
      user: "Dr. Evelyn Reed",
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
    } catch {}
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
    } catch {}
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
      user: "Dr. Evelyn Reed",
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
      user: "Dr. Evelyn Reed",
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
    } catch {}

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
    } catch {}
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
    } catch {}
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
    } catch {}

    const targetSub = erSubmissions.find((s) => s.id === submissionId);
    if (targetSub) {
      addTimelineActivity({
        projectId: targetSub.projectId,
        groupId: targetSub.groupId,
        groupNumber: targetSub.groupNumber,
        type: "feedback_given",
        user: "Dr. Evelyn Reed",
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
        groups,
        addGroup,
        updateGroup,
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
