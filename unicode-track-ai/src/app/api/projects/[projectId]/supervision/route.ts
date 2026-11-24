import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Project } from "@/types/admin";
import { ProjectGroup } from "@/types/project";

export interface SupervisionGroupItem {
  id: string;
  groupNumber: number;
  groupName: string;
  workspaceId: string;
  members: {
    studentId: string;
    fullName: string;
    email: string;
    role: string;
    commitsCount: number;
  }[];
  submissionProgress: number; // 0 to 100
  submissionStatus: "not_submitted" | "submitted" | "under_review" | "changes_requested" | "approved";
  proposalTitle?: string;
  erDiagramStatus:
    | "not_submitted"
    | "submitted"
    | "under_review"
    | "changes_requested"
    | "approved"
    | "published"
    | "analyzing"
    | "reviewed"
    | "resubmission_requested";
  erDiagramVersion?: number;
  githubStatus: "connected" | "disconnected" | "syncing" | "error";
  repoName?: string;
  repoUrl?: string;
  totalCommits: number;
  aiReviewStatus: "not_analyzed" | "in_progress" | "completed";
  aiReviewScore?: number;
  lecturerEvaluationStatus:
    | "not_evaluated"
    | "in_review"
    | "approved"
    | "published"
    | "ai_completed";
  evaluationScore?: number;
}

export interface SupervisionStudentItem {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  department?: string;
  academicYear?: number;
  semester?: number;
  workspaceId: string;
  submissionProgress: number; // 0 to 100
  submissionStatus: "not_submitted" | "submitted" | "under_review" | "changes_requested" | "approved";
  erDiagramStatus:
    | "not_submitted"
    | "submitted"
    | "under_review"
    | "changes_requested"
    | "approved"
    | "published"
    | "analyzing"
    | "reviewed"
    | "resubmission_requested";
  erDiagramVersion?: number;
  githubStatus: "connected" | "disconnected" | "syncing" | "error";
  repoName?: string;
  repoUrl?: string;
  totalCommits: number;
  aiReviewStatus: "not_analyzed" | "in_progress" | "completed";
  aiReviewScore?: number;
  lecturerEvaluationStatus:
    | "not_evaluated"
    | "in_review"
    | "approved"
    | "published"
    | "ai_completed";
  evaluationScore?: number;
}

/**
 * GET /api/projects/[projectId]/supervision
 * Fetches live Supabase data for the lecturer's supervision console:
 * - Validates lecturer permissions.
 * - Slices by group project (groups 1..N) or individual project (student rows).
 * - Aggregates submission, ER diagram, GitHub, AI review, and evaluation statuses.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const { searchParams } = new URL(req.url);
    const lecturerEmail = searchParams.get("lecturerEmail")?.toLowerCase().trim();

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient() || createClient();

      // 1. Fetch project record
      const { data: pData, error: pErr } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (pErr || !pData) {
        return NextResponse.json({
          success: true,
          source: "local",
          notInDb: true,
          message: `Project ${projectId} not found in Supabase database. Falling back to local state.`,
        });
      }

      // 2. Validate lecturer permission if lecturerEmail is provided
      if (lecturerEmail) {
        const { data: lecData } = await supabase
          .from("lecturers")
          .select("id, name, email, assigned_courses")
          .eq("email", lecturerEmail)
          .single();

        if (lecData) {
          const isAssigned =
            pData.lecturer_id === lecData.id ||
            pData.lecturer_name === lecData.name ||
            (Array.isArray(lecData.assigned_courses) &&
              lecData.assigned_courses.includes(pData.course_code));

          if (!isAssigned) {
            return NextResponse.json(
              {
                success: false,
                error: "Access Denied: You are not authorized to supervise this project. Only assigned faculty supervisors can view deliverables.",
                isPermissionError: true,
              },
              { status: 403 }
            );
          }
        }
      }

      const isGroup = pData.project_type === "group" || pData.type === "Group Project";

      // 3. IF GROUP PROJECT: Fetch actual groups, members, and statuses
      if (isGroup) {
        const { data: dbGroups } = await supabase
          .from("project_groups")
          .select("*")
          .eq("project_id", projectId)
          .order("group_number", { ascending: true });

        const groupsList: SupervisionGroupItem[] = [];

        if (dbGroups && dbGroups.length > 0) {
          const groupIds = dbGroups.map((g: any) => g.id);

          // Fetch members for these groups
          const { data: dbMembers } = await supabase
            .from("group_members")
            .select("*")
            .in("group_id", groupIds);

          // Fetch ER diagram submissions
          const { data: dbER } = await supabase
            .from("er_diagram_submissions")
            .select("group_id, version, status, ai_analysis, lecturer_feedback")
            .in("group_id", groupIds);

          // Fetch evaluations
          const { data: dbEvals } = await supabase
            .from("project_evaluations")
            .select("group_id, total_score, status, ai_score")
            .in("group_id", groupIds);

          for (const g of dbGroups) {
            const members = (dbMembers || [])
              .filter((m: any) => m.group_id === g.id)
              .map((m: any) => ({
                studentId: m.student_id,
                fullName: m.full_name,
                email: m.email,
                role: m.role || "Member",
                commitsCount: m.commits_count || 0,
              }));

            const erSub = (dbER || []).find((e: any) => e.group_id === g.id);
            const evalSub = (dbEvals || []).find((ev: any) => ev.group_id === g.id);

            groupsList.push({
              id: g.id,
              groupNumber: g.group_number,
              groupName: g.group_name || `Group ${g.group_number}`,
              workspaceId: g.workspace_id || `ws-${projectId}-${g.group_number}`,
              members,
              submissionProgress: g.progress || (g.proposal_status === "approved" ? 100 : g.proposal_status === "submitted" ? 50 : 0),
              submissionStatus: g.proposal_status || "not_submitted",
              proposalTitle: g.proposal_title,
              erDiagramStatus: erSub?.status || "not_submitted",
              erDiagramVersion: erSub?.version || undefined,
              githubStatus: g.repo_status || "disconnected",
              repoName: g.repo_name,
              repoUrl: g.repo_url,
              totalCommits: g.total_commits || 0,
              aiReviewStatus: erSub?.ai_analysis || evalSub?.ai_score ? "completed" : "not_analyzed",
              aiReviewScore: erSub?.ai_analysis?.overallCorrectnessScore || evalSub?.ai_score,
              lecturerEvaluationStatus: evalSub?.status || (g.evaluation_score ? "published" : "not_evaluated"),
              evaluationScore: evalSub?.total_score || g.evaluation_score,
            });
          }
        }

        return NextResponse.json({
          success: true,
          source: "supabase",
          isGroupProject: true,
          project: {
            id: pData.id,
            title: pData.title,
            description: pData.description,
            type: pData.type,
            projectType: pData.project_type || "group",
            courseCode: pData.course_code,
            academicYear: pData.academic_year,
            semester: pData.semester,
            deadline: pData.deadline,
            status: pData.status,
            lecturerName: pData.lecturer_name,
            erDiagramRequired: pData.er_diagram_required,
            databaseRequired: pData.database_required,
          },
          groups: groupsList,
          totalCount: groupsList.length,
        });
      }

      // 4. IF INDIVIDUAL PROJECT: Fetch student assignments and statuses
      const { data: dbAssignments } = await supabase
        .from("project_student_assignments")
        .select("*")
        .eq("project_id", projectId)
        .order("student_name", { ascending: true });

      const studentList: SupervisionStudentItem[] = [];

      if (dbAssignments && dbAssignments.length > 0) {
        const assignmentIds = dbAssignments.map((a: any) => a.id);

        // Fetch ER submissions for these assignments if any
        const { data: dbER } = await supabase
          .from("er_diagram_submissions")
          .select("group_id, version, status, ai_analysis, lecturer_feedback")
          .in("group_id", assignmentIds);

        for (const a of dbAssignments) {
          const erSub = (dbER || []).find((e: any) => e.group_id === a.id);

          studentList.push({
            id: a.id,
            studentId: a.student_id,
            fullName: a.student_name,
            email: a.student_email,
            department: a.department_id,
            academicYear: a.academic_year,
            semester: a.semester,
            workspaceId: a.workspace_id,
            submissionProgress: a.progress || (a.proposal_status === "approved" ? 100 : a.proposal_status === "submitted" ? 50 : 0),
            submissionStatus: a.proposal_status || "not_submitted",
            erDiagramStatus: erSub?.status || "not_submitted",
            erDiagramVersion: erSub?.version || undefined,
            githubStatus: a.repo_status || "disconnected",
            repoName: a.repo_name,
            repoUrl: a.repo_url,
            totalCommits: a.total_commits || 0,
            aiReviewStatus: erSub?.ai_analysis ? "completed" : "not_analyzed",
            aiReviewScore: erSub?.ai_analysis?.overallCorrectnessScore,
            lecturerEvaluationStatus: a.status === "completed" ? "published" : "not_evaluated",
            evaluationScore: a.evaluation_score,
          });
        }
      }

      return NextResponse.json({
        success: true,
        source: "supabase",
        isGroupProject: false,
        project: {
          id: pData.id,
          title: pData.title,
          description: pData.description,
          type: pData.type,
          projectType: pData.project_type || "individual",
          courseCode: pData.course_code,
          academicYear: pData.academic_year,
          semester: pData.semester,
          deadline: pData.deadline,
          status: pData.status,
          lecturerName: pData.lecturer_name,
          erDiagramRequired: pData.er_diagram_required,
          databaseRequired: pData.database_required,
        },
        students: studentList,
        totalCount: studentList.length,
      });
    }

    // Local / fallback mode
    return NextResponse.json({
      success: true,
      source: "local",
      message: "Supabase not configured, client using local data store.",
    });
  } catch (err: unknown) {
    console.error("Supervision API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load supervision data.",
      },
      { status: 500 }
    );
  }
}
