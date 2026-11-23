import { GitHubBranch, GitHubCommit } from "@/types/project";

export interface ParsedRepoInfo {
  owner: string;
  repo: string;
  normalizedUrl: string;
}

/**
 * Parses any GitHub URL or string into { owner, repo, normalizedUrl }
 */
export function parseGitHubUrl(input: string): ParsedRepoInfo | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim().replace(/\.git$/i, "").replace(/\/+$/, "");

  // Match: https://github.com/owner/repo or http://github.com/owner/repo or github.com/owner/repo
  const webMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (webMatch) {
    const owner = webMatch[1];
    const repo = webMatch[2];
    return {
      owner,
      repo,
      normalizedUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  // Match: owner/repo
  const shortMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    const owner = shortMatch[1];
    const repo = shortMatch[2];
    return {
      owner,
      repo,
      normalizedUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  return null;
}

/**
 * Returns authorization headers for GitHub API if GITHUB_TOKEN is available
 */
function getGitHubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "UniCodeTrack-AI-Academic-Hub",
  };
  if (token && !token.includes("placeholder")) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches repository info from GitHub API with realistic simulated fallback for demo repos
 */
export async function fetchGitHubRepoDetails(owner: string, repo: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: getGitHubHeaders(),
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        name: data.name,
        fullName: data.full_name,
        owner: data.owner?.login || owner,
        description: data.description || "",
        defaultBranch: data.default_branch || "main",
        starsCount: data.stargazers_count || 0,
        forksCount: data.forks_count || 0,
        openIssuesCount: data.open_issues_count || 0,
        updatedAt: data.updated_at || new Date().toISOString(),
        isLive: true,
      };
    }
  } catch (err) {
    console.warn("GitHub API call failed, generating simulated academic repo data:", err);
  }

  // Realistic fallback for demo repos
  return {
    name: repo,
    fullName: `${owner}/${repo}`,
    owner,
    description: "Academic coursework repository with C source modules and build scripts.",
    defaultBranch: "main",
    starsCount: 3,
    forksCount: 1,
    openIssuesCount: 0,
    updatedAt: new Date().toISOString(),
    isLive: false,
  };
}

/**
 * Fetches recent commit history
 */
export async function fetchGitHubCommits(
  owner: string,
  repo: string,
  branch = "main"
): Promise<GitHubCommit[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=20`,
      {
        headers: getGitHubHeaders(),
        next: { revalidate: 60 },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          hash: c.sha,
          shortHash: c.sha ? c.sha.slice(0, 7) : "commit",
          message: c.commit?.message?.split("\n")[0] || "Update code",
          author: c.commit?.author?.name || c.author?.login || "Contributor",
          authorEmail: c.commit?.author?.email,
          authorAvatar: c.author?.avatar_url,
          date: c.commit?.author?.date || new Date().toISOString(),
          branch,
        }));
      }
    }
  } catch (err) {
    console.warn("GitHub commits API failed, generating academic demo commit history:", err);
  }

  // Realistic fallback commit history for C academic projects
  return getDemoCProjectCommits(branch);
}

/**
 * Fetches repository branches
 */
export async function fetchGitHubBranches(
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: getGitHubHeaders(),
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((b: any) => ({
          name: b.name,
          isDefault: b.name === "main" || b.name === "master",
          latestCommitHash: b.commit?.sha?.slice(0, 7) || "HEAD",
          latestCommitMessage: "Latest branch commit",
          updatedAt: new Date().toISOString(),
        }));
      }
    }
  } catch (err) {
    console.warn("GitHub branches API failed, generating academic demo branches:", err);
  }

  return [
    {
      name: "main",
      isDefault: true,
      latestCommitHash: "7b4c89a",
      latestCommitMessage: "feat(core): implement high-throughput buffer circular queue",
      updatedAt: "2 hours ago",
    },
    {
      name: "feature/telemetry-sensor",
      isDefault: false,
      latestCommitHash: "4e9d12f",
      latestCommitMessage: "fix(sensor): calibration math for temperature telemetry",
      updatedAt: "5 hours ago",
    },
    {
      name: "dev",
      isDefault: false,
      latestCommitHash: "1a8e34c",
      latestCommitMessage: "test: add unit test suite for memory leak validation",
      updatedAt: "1 day ago",
    },
  ];
}

/**
 * Returns demo commit history for C programming projects
 */
export function getDemoCProjectCommits(branch = "main"): GitHubCommit[] {
  return [
    {
      hash: "7b4c89a24fd5e6718a23d45678901234567890ab",
      shortHash: "7b4c89a",
      message: "feat(core): implement high-throughput circular queue buffer",
      author: "Alex Chen",
      date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      branch,
    },
    {
      hash: "4e9d12f89cde789012345678901234567890abcd",
      shortHash: "4e9d12f",
      message: "feat(telemetry): add multi-sensor packet serialization in C",
      author: "Sarah Lin",
      date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      branch,
    },
    {
      hash: "a31f78bcde901234567890123456789012345678",
      shortHash: "a31f78b",
      message: "refactor(memory): eliminate pointer leaks in dynamic node cleanup",
      author: "Priya Patel",
      date: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      branch,
    },
    {
      hash: "8c4d21e012345678901234567890123456789012",
      shortHash: "8c4d21e",
      message: "docs(rubric): update README with compilation instructions & Makefile",
      author: "Liam Davis",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      branch,
    },
    {
      hash: "2b9f34a567890123456789012345678901234567",
      shortHash: "2b9f34a",
      message: "feat(parser): add binary protocol packet CRC verification",
      author: "Alex Chen",
      date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      branch,
    },
    {
      hash: "f1a8c9e456789012345678901234567890123456",
      shortHash: "f1a8c9e",
      message: "chore: initialize C Capstone repository structure and tests",
      author: "Alex Chen",
      date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      branch,
    },
  ];
}
