import { Student } from "./admin";

export interface GroupMember {
  studentId: string;
  fullName: string;
  email: string;
  department: string;
  academicYear: number;
  semester: number;
  role: "Team Lead" | "Member";
  githubUsername?: string;
  commitsCount: number;
  avatar?: string | null;
}

export interface LecturerFeedback {
  id: string;
  lecturerName: string;
  decision: "approved" | "changes_requested";
  comments: string;
  reviewedAt: string;
  rubricScore?: number;
}

export interface ProposalSubmission {
  id: string;
  groupId: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedAt: string;
  status: "submitted" | "under_review" | "changes_requested" | "approved";
  version: number;
  feedback?: LecturerFeedback;
}

export interface GitHubCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorEmail?: string;
  authorAvatar?: string;
  date: string;
  branch: string;
}

export interface GitHubBranch {
  name: string;
  isDefault: boolean;
  latestCommitHash: string;
  latestCommitMessage: string;
  updatedAt: string;
}

export interface GitHubPullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  author: string;
  authorAvatar?: string;
  sourceBranch: string;
  targetBranch: string;
  status: "open" | "merged" | "closed";
  additions: number;
  deletions: number;
  changedFilesCount: number;
  createdAt: string;
  updatedAt: string;
  reviewStatus: "approved" | "changes_requested" | "pending";
  reviewer?: string;
  reviewComments?: string;
}

export interface ProjectGroup {
  id: string;
  projectId: string;
  groupNumber: number;
  groupName: string;
  members: GroupMember[];
  workspaceId: string;
  repoUrl?: string;
  repoName?: string;
  repoOwner?: string;
  defaultBranch?: string;
  repoStatus: "disconnected" | "connected" | "syncing" | "error";
  lastSyncAt?: string;
  totalCommits: number;
  status: "active" | "archived" | "completed";
  progress: number;
  proposalStatus: "not_submitted" | "submitted" | "under_review" | "changes_requested" | "approved";
  proposal?: ProposalSubmission;
  evaluationStatus?: "not_evaluated" | "ai_completed" | "in_review" | "approved" | "published";
  latestEvaluationId?: string;
  evaluationScore?: number;
  branches?: GitHubBranch[];
  commits?: GitHubCommit[];
  pullRequests?: GitHubPullRequest[];
  createdAt: string;
}

export interface ProjectTimelineActivity {
  id: string;
  projectId: string;
  groupId?: string;
  groupNumber?: number;
  type: 
    | "repo_connected" 
    | "proposal_submitted" 
    | "commit_pushed" 
    | "feedback_given" 
    | "proposal_approved" 
    | "group_created"
    | "branch_created";
  user: string;
  userRole: "student" | "lecturer" | "system";
  action: string;
  target: string;
  timestamp: string;
}

export interface ExtractedGroupData {
  groupNumber: number;
  groupName: string;
  rawMembers: {
    name: string;
    studentId?: string;
    email?: string;
  }[];
  matchedMembers: GroupMember[];
  unresolvedMembers: {
    name: string;
    studentId?: string;
    email?: string;
    reason: string;
  }[];
}

export interface ExtractedProjectData {
  title: string;
  description: string;
  courseCode?: string;
  groups: ExtractedGroupData[];
}

export interface ProjectStudentAssignment {
  id: string;
  projectId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  departmentId?: string;
  academicYear: number;
  semester: number;
  workspaceId: string;
  repoUrl?: string;
  repoName?: string;
  repoOwner?: string;
  defaultBranch?: string;
  repoStatus: "disconnected" | "connected" | "syncing" | "error";
  lastSyncAt?: string;
  totalCommits: number;
  status: "active" | "archived" | "completed";
  progress: number;
  proposalStatus: "not_submitted" | "submitted" | "under_review" | "changes_requested" | "approved";
  proposal?: ProposalSubmission;
  evaluationStatus?: "not_evaluated" | "ai_completed" | "in_review" | "approved" | "published";
  latestEvaluationId?: string;
  evaluationScore?: number;
  branches?: GitHubBranch[];
  commits?: GitHubCommit[];
  pullRequests?: GitHubPullRequest[];
  createdAt: string;
}
