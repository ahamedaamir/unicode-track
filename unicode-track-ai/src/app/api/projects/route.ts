import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Project } from "@/types/admin";
import { ProjectGroup } from "@/types/project";

/**
 * Server-side API endpoint for UniCodeTrack AI Projects and Academic Groups
 * POST /api/projects - Creates / updates a project and its academic groups in Supabase
 * GET /api/projects - Retrieves projects with role and assignment filtering
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project, groups }: { project: Project; groups?: ProjectGroup[] } = body;

    if (!project || !project.title || !project.courseCode || !project.departmentId) {
      return NextResponse.json(
        { success: false, error: "Project Title, Course Code, and Department are required." },
        { status: 400 }
      );
    }

    const projectId = project.id || `proj-${Date.now().toString(36)}`;
    const projectWithId: Project = {
      ...project,
      id: projectId,
      createdAt: project.createdAt || new Date().toISOString().split("T")[0],
    };

    let savedToSupabase = false;
    let supabaseError: string | null = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();

        // 1. Upsert project in Supabase
        const { error: projectError } = await supabase.from("projects").upsert(
          {
            id: projectId,
            title: projectWithId.title,
            description: projectWithId.description || "",
            type: projectWithId.type || "Group Project",
            department_id: projectWithId.departmentId,
            course_code: projectWithId.courseCode,
            academic_year: projectWithId.academicYear,
            semester: projectWithId.semester,
            deadline: projectWithId.deadline ? new Date(projectWithId.deadline).toISOString() : null,
            requirements_source: projectWithId.requirementsSource || "ai",
            requirements_content: projectWithId.requirementsContent || null,
            requirements_pdf_name: projectWithId.requirementsPdfName || null,
            requirements_pdf_size: projectWithId.requirementsPdfSize || null,
            status: projectWithId.status || "Draft",
            lecturer_id: projectWithId.lecturerId || null,
            lecturer_name: projectWithId.lecturerName || null,
            database_design_config: projectWithId.databaseDesignConfig || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (projectError) {
          console.warn("Supabase project insert warning:", projectError);
          supabaseError = projectError.message;
        } else {
          savedToSupabase = true;

          // 2. Upsert academic groups in Supabase if provided
          if (groups && groups.length > 0) {
            for (const grp of groups) {
              const groupId = grp.id || `grp-${projectId}-${grp.groupNumber}`;
              const { error: groupError } = await supabase.from("project_groups").upsert(
                {
                  id: groupId,
                  project_id: projectId,
                  group_number: grp.groupNumber,
                  group_name: grp.groupName,
                  workspace_id: grp.workspaceId || `ws-${projectId}-${grp.groupNumber}`,
                  repo_status: grp.repoStatus || "disconnected",
                  total_commits: grp.totalCommits || 0,
                  status: grp.status || "active",
                  progress: grp.progress || 0,
                  proposal_status: grp.proposalStatus || "not_submitted",
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );

              if (!groupError && grp.members && grp.members.length > 0) {
                // Upsert group members
                for (const member of grp.members) {
                  await supabase.from("group_members").upsert(
                    {
                      group_id: groupId,
                      student_id: member.studentId || "std-unknown",
                      full_name: member.fullName,
                      email: member.email.toLowerCase(),
                      department: member.department || "",
                      role: member.role || "Member",
                      commits_count: member.commitsCount || 0,
                    },
                    { onConflict: "group_id,email" }
                  );
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("Error persisting to Supabase:", err);
        supabaseError = err.message || "Failed to persist to Supabase.";
      }
    }

    return NextResponse.json({
      success: true,
      project: projectWithId,
      groups: groups || [],
      savedToSupabase,
      message: savedToSupabase
        ? "Project and academic groups saved to Supabase database successfully!"
        : "Project saved successfully (local data mode).",
      warning: supabaseError || undefined,
    });
  } catch (error: any) {
    console.error("API /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error creating project." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode");
    const lecturerId = searchParams.get("lecturerId");
    const studentEmail = searchParams.get("studentEmail");

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      let query = supabase.from("projects").select("*");

      if (courseCode) {
        query = query.eq("course_code", courseCode);
      }
      if (lecturerId) {
        query = query.eq("lecturer_id", lecturerId);
      }

      const { data: dbProjects, error } = await query;
      if (!error && dbProjects) {
        const formattedProjects: Project[] = dbProjects.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          departmentId: p.department_id,
          courseCode: p.course_code,
          academicYear: p.academic_year,
          semester: p.semester,
          deadline: p.deadline,
          requirementsSource: p.requirements_source,
          requirementsContent: p.requirements_content,
          requirementsPdfName: p.requirements_pdf_name,
          requirementsPdfSize: p.requirements_pdf_size,
          status: p.status,
          lecturerId: p.lecturer_id,
          lecturerName: p.lecturer_name,
          databaseDesignConfig: p.database_design_config,
          createdAt: p.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        }));

        return NextResponse.json({
          success: true,
          projects: formattedProjects,
          source: "supabase",
        });
      }
    }

    return NextResponse.json({
      success: true,
      projects: [],
      source: "local",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects." },
      { status: 500 }
    );
  }
}

