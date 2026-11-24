import { GroupMember } from "./project";

export interface GitHubRepositoryDetails {
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description?: string;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  updatedAt: string;
  isLive: boolean;
  status: "connected" | "disconnected" | "syncing" | "error";
  lastSyncAt?: string;
}

export interface GitHubBranch {
  name: string;
  isDefault: boolean;
  latestCommitHash: string;
  latestCommitMessage: string;
  updatedAt: string;
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

export interface RepositoryFileNode {
  path: string;
  name: string;
  type: "file" | "dir";
  size?: number;
  language?: string;
  content?: string;
  children?: RepositoryFileNode[];
}

export interface RepositoryActivityEvent {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  time: string;
  icon: "commit" | "pr" | "review" | "repo" | "branch";
  detail: string;
}

export interface MemberContribution {
  member: GroupMember;
  commitsCount: number;
  percentage: number;
  additions?: number;
  deletions?: number;
  lastActive?: string;
}
