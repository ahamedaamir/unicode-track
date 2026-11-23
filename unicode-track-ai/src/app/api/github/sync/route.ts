import { NextRequest, NextResponse } from "next/server";
import { 
  parseGitHubUrl, 
  fetchGitHubCommits, 
  fetchGitHubBranches 
} from "@/services/github/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, branch = "main" } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required for synchronization." },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL." },
        { status: 400 }
      );
    }

    const [branches, commits] = await Promise.all([
      fetchGitHubBranches(parsed.owner, parsed.repo),
      fetchGitHubCommits(parsed.owner, parsed.repo, branch),
    ]);

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      branches,
      commits,
      totalCommits: commits.length,
    });
  } catch (error: any) {
    console.error("GitHub sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to synchronize GitHub repository." },
      { status: 500 }
    );
  }
}
