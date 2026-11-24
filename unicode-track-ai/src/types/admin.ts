import { ProjectDatabaseDesignConfig } from "./er-diagram";

export interface Department {
  id: string;
  name: string;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Lecturer {
  id: string;
  name: string;
  email: string;
  position: "Senior" | "Probationary";
  assignedCourses: string[]; // Course codes, e.g. ["ICT2142", "CS492"]
  status: "Active" | "Pending First Login" | "Deactivated";
  hasChangedDefaultPassword: boolean;
  defaultPassword: string;
  createdAt: string;
}

export interface Student {
  id: string;
  studentId?: string;
  fullName: string;
  email: string;
  departmentId: string;
  academicYear: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  defaultPassword?: string;
  profilePhotoUrl?: string | null;
  accountStatus: "active" | "inactive";
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: "Individual Project" | "Group Project";
  projectType?: "individual" | "group" | "Individual Project" | "Group Project";
  departmentId: string;
  courseCode: string;
  courseId?: string;
  academicYear: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  deadline?: string;
  instructions?: string;
  requirements?: string;
  erDiagramRequired?: boolean;
  erDiagramDeadline?: string;
  databaseRequired?: boolean;
  databaseRequirements?: string;
  githubRequired?: boolean;
  finalReportRequired?: boolean;
  additionalRequirements?: string;
  assignmentSourceType?: "pdf" | "text" | "none";
  assignmentFilePath?: string;
  assignmentFileName?: string;
  assignmentFileSize?: string;
  assignmentText?: string;
  assignmentProcessingStatus?: "pending" | "processing" | "completed" | "error" | "not_uploaded";
  requirementsSource?: "pdf" | "ai" | "manual";
  requirementsContent?: string;
  requirementsPdfName?: string;
  requirementsPdfSize?: string;
  status: "Draft" | "Published" | "Archived";
  lecturerId?: string;
  lecturerName?: string;
  groupCount?: number;
  assignedStudentCount?: number;
  databaseDesignConfig?: ProjectDatabaseDesignConfig;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "department" | "course" | "lecturer" | "student" | "project" | "system";
}
