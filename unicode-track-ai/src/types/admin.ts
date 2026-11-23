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
  fullName: string;
  email: string;
  departmentId: string;
  academicYear: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  defaultPassword?: string;
  profilePhotoUrl?: string | null;
  accountStatus: "active" | "inactive";
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "department" | "course" | "lecturer" | "student" | "system";
}
