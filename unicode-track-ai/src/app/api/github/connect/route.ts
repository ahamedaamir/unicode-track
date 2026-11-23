import { NextRequest, NextResponse } from "next/server";
import { 
  parseGitHubUrl, 
  fetchGitHubRepoDetails, 
  fetchGitHubCommits, 
  fetchGitHubBranches 
} from "@/services/github/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "A valid GitHub repository URL is required." },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL format. Please use 'https://github.com/owner/repository'." },
        { status: 400 }
      );
    }

    const [details, branches, commits] = await Promise.all([
      fetchGitHubRepoDetails(parsed.owner, parsed.repo),
      fetchGitHubBranches(parsed.owner, parsed.repo),
      fetchGitHubCommits(parsed.owner, parsed.repo, "main"),
    ]);

    return NextResponse.json({
      success: true,
      repository: {
        repoUrl: parsed.normalizedUrl,
        repoName: details.name,
        repoOwner: details.owner,
        defaultBranch: details.defaultBranch,
        starsCount: details.starsCount,
        lastSyncAt: new Date().toISOString(),
      },
      branches,
      commits,
      totalCommits: commits.length,
    });
  } catch (error: any) {
    console.error("GitHub connect error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to connect to GitHub repository." },
      { status: 500 }
    );
  }
}
