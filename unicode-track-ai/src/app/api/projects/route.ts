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
        const fullPayload: Record<string, unknown> = {
          id: projectId,
          title: projectWithId.title,
          description: projectWithId.description || "",
          type: projectWithId.type || "Group Project",
          project_type: projectWithId.type === "Individual Project" ? "individual" : "group",
          department_id: projectWithId.departmentId,
          course_code: projectWithId.courseCode,
          course_id: projectWithId.courseId || projectWithId.courseCode,
          academic_year: projectWithId.academicYear,
          semester: projectWithId.semester,
          deadline: projectWithId.deadline ? new Date(projectWithId.deadline).toISOString() : null,
          requirements: projectWithId.requirements || projectWithId.requirementsContent || null,
          instructions: projectWithId.instructions || null,
          er_diagram_required: projectWithId.erDiagramRequired ?? true,
          er_diagram_deadline: projectWithId.erDiagramDeadline ? new Date(projectWithId.erDiagramDeadline).toISOString() : null,
          database_required: projectWithId.databaseRequired ?? true,
          database_requirements: projectWithId.databaseRequirements || null,
          github_required: projectWithId.githubRequired ?? true,
          final_report_required: projectWithId.finalReportRequired ?? true,
          additional_requirements: projectWithId.additionalRequirements || null,
          assignment_source_type: projectWithId.assignmentSourceType || "none",
          assignment_file_path: projectWithId.assignmentFilePath || null,
          assignment_file_name: projectWithId.assignmentFileName || null,
          assignment_file_size: projectWithId.assignmentFileSize || null,
          assignment_text: projectWithId.assignmentText || null,
          assignment_processing_status: projectWithId.assignmentProcessingStatus || "not_uploaded",
          requirements_source: projectWithId.requirementsSource || "manual",
          requirements_content: projectWithId.requirementsContent || projectWithId.requirements || null,
          requirements_pdf_name: projectWithId.requirementsPdfName || null,
          requirements_pdf_size: projectWithId.requirementsPdfSize || null,
          status: projectWithId.status || "Draft",
          lecturer_id: projectWithId.lecturerId || null,
          lecturer_name: projectWithId.lecturerName || null,
          database_design_config: projectWithId.databaseDesignConfig || null,
          admin_email: projectWithId.adminEmail || null,
          updated_at: new Date().toISOString(),
        };

        let { error: projectError } = await supabase.from("projects").upsert(fullPayload, { onConflict: "id" });

        // Safe fallback if some new columns are not yet executed in database
        if (projectError && (projectError.message?.includes("column") || projectError.message?.includes("does not exist"))) {
          console.warn("Supabase schema columns pending migration, falling back to core project payload:", projectError.message);
          const corePayload = {
            id: projectId,
            title: projectWithId.title,
            description: projectWithId.description || "",
            type: projectWithId.type || "Group Project",
            department_id: projectWithId.departmentId,
            course_code: projectWithId.courseCode,
            academic_year: projectWithId.academicYear,
            semester: projectWithId.semester,
            deadline: projectWithId.deadline ? new Date(projectWithId.deadline).toISOString() : null,
            requirements_source: projectWithId.requirementsSource || "manual",
            requirements_content: projectWithId.requirementsContent || projectWithId.requirements || null,
            requirements_pdf_name: projectWithId.requirementsPdfName || null,
            requirements_pdf_size: projectWithId.requirementsPdfSize || null,
            status: projectWithId.status || "Draft",
            lecturer_id: projectWithId.lecturerId || null,
            lecturer_name: projectWithId.lecturerName || null,
            database_design_config: projectWithId.databaseDesignConfig || null,
            updated_at: new Date().toISOString(),
          };
          const fallbackRes = await supabase.from("projects").upsert(corePayload, { onConflict: "id" });
          projectError = fallbackRes.error;
        }

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
    const lecturerEmail = searchParams.get("lecturerEmail")?.toLowerCase().trim();
    const studentEmail = searchParams.get("studentEmail");
    const academicYear = searchParams.get("academicYear");
    const departmentId = searchParams.get("departmentId");

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      let query = supabase.from("projects").select("*");

      if (courseCode && courseCode !== "all") {
        query = query.eq("course_code", courseCode);
      }
      if (departmentId && departmentId !== "all") {
        query = query.eq("department_id", departmentId);
      }
      if (academicYear && academicYear !== "all") {
        query = query.eq("academic_year", parseInt(academicYear, 10));
      }
      if (lecturerId) {
        query = query.eq("lecturer_id", lecturerId);
      }

      const { data: dbProjects, error } = await query;
      if (!error && dbProjects) {
        let filteredProjects = dbProjects;

        // Security check for lecturer persona: only return projects assigned to this faculty
        if (lecturerEmail) {
          const { data: lec } = await supabase
            .from("lecturers")
            .select("id, name, email, assigned_courses")
            .eq("email", lecturerEmail)
            .single();

          if (lec) {
            filteredProjects = dbProjects.filter((p: any) => {
              const matchesId = p.lecturer_id === lec.id;
              const matchesName = p.lecturer_name && p.lecturer_name.toLowerCase() === lec.name.toLowerCase();
              const matchesCourse =
                Array.isArray(lec.assigned_courses) &&
                lec.assigned_courses.includes(p.course_code);
              return matchesId || matchesName || matchesCourse;
            });
          }
        }

        // Fetch group counts and student assignment counts for each project
        const projectIds = filteredProjects.map((p: any) => p.id);
        const groupCountsMap: Record<string, number> = {};
        const assignmentCountsMap: Record<string, number> = {};

        if (projectIds.length > 0) {
          const [{ data: dbGroups }, { data: dbAssignments }] = await Promise.all([
            supabase
              .from("project_groups")
              .select("id, project_id")
              .in("project_id", projectIds),
            supabase
              .from("project_student_assignments")
              .select("id, project_id")
              .in("project_id", projectIds),
          ]);

          if (dbGroups) {
            for (const g of dbGroups) {
              groupCountsMap[g.project_id] = (groupCountsMap[g.project_id] || 0) + 1;
            }
          }

          if (dbAssignments) {
            for (const a of dbAssignments) {
              assignmentCountsMap[a.project_id] = (assignmentCountsMap[a.project_id] || 0) + 1;
            }
          }
        }

        const formattedProjects: Project[] = filteredProjects.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type || (p.project_type === "individual" ? "Individual Project" : "Group Project"),
          projectType: p.project_type || (p.type === "Individual Project" ? "individual" : "group"),
          departmentId: p.department_id,
          courseCode: p.course_code,
          courseId: p.course_id || p.course_code,
          academicYear: p.academic_year,
          semester: p.semester,
          deadline: p.deadline,
          instructions: p.instructions,
          requirements: p.requirements || p.requirements_content,
          erDiagramRequired: p.er_diagram_required ?? true,
          erDiagramDeadline: p.er_diagram_deadline,
          databaseRequired: p.database_required ?? true,
          databaseRequirements: p.database_requirements,
          githubRequired: p.github_required ?? true,
          finalReportRequired: p.final_report_required ?? true,
          additionalRequirements: p.additional_requirements,
          assignmentSourceType: p.assignment_source_type || "none",
          assignmentFilePath: p.assignment_file_path,
          assignmentFileName: p.assignment_file_name,
          assignmentFileSize: p.assignment_file_size,
          assignmentText: p.assignment_text,
          assignmentProcessingStatus: p.assignment_processing_status || "not_uploaded",
          requirementsSource: p.requirements_source || "manual",
          requirementsContent: p.requirements_content || p.requirements,
          requirementsPdfName: p.requirements_pdf_name,
          requirementsPdfSize: p.requirements_pdf_size,
          status: p.status,
          lecturerId: p.lecturer_id,
          lecturerName: p.lecturer_name,
          databaseDesignConfig: p.database_design_config,
          groupCount: groupCountsMap[p.id] || 0,
          assignedStudentCount: assignmentCountsMap[p.id] || 0,
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

/**
 * DELETE /api/projects?id=... - Deletes a project and cascades child groups/assignments
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let projectId = searchParams.get("id");

    if (!projectId) {
      try {
        const body = await req.json();
        projectId = body.id;
      } catch { }
    }

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required for deletion." },
        { status: 400 }
      );
    }

    let deletedFromSupabase = false;
    let supabaseError: string | null = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();

        // 1. Find child groups to safely cascade delete members
        const { data: dbGroups } = await supabase
          .from("project_groups")
          .select("id")
          .eq("project_id", projectId);

        if (dbGroups && dbGroups.length > 0) {
          const groupIds = dbGroups.map((g) => g.id);
          await supabase.from("group_members").delete().in("group_id", groupIds);
        }

        // 2. Delete groups, assignments, and the project record
        await supabase.from("project_groups").delete().eq("project_id", projectId);
        await supabase.from("project_student_assignments").delete().eq("project_id", projectId);
        const { error } = await supabase.from("projects").delete().eq("id", projectId);

        if (error) {
          supabaseError = error.message;
        } else {
          deletedFromSupabase = true;
        }
      } catch (err: any) {
        supabaseError = err?.message || "Failed to delete project from Supabase.";
      }
    }

    return NextResponse.json({
      success: true,
      deletedId: projectId,
      deletedFromSupabase,
      message: deletedFromSupabase
        ? "Project and associated groups deleted from database."
        : "Project deleted successfully (local mode).",
      warning: supabaseError || undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete project." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects - Updates a project in the database
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const project = body.project || body;
    const projectId = project.id || body.id;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required for update." },
        { status: 400 }
      );
    }

    let updatedInSupabase = false;
    let supabaseError: string | null = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();

        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (project.title !== undefined) updatePayload.title = project.title;
        if (project.description !== undefined) updatePayload.description = project.description;
        if (project.academicYear !== undefined) updatePayload.academic_year = project.academicYear;
        if (project.semester !== undefined) updatePayload.semester = project.semester;
        if (project.deadline !== undefined) updatePayload.deadline = project.deadline ? new Date(project.deadline).toISOString() : null;
        if (project.status !== undefined) updatePayload.status = project.status;
        if (project.requirements !== undefined) updatePayload.requirements = project.requirements;
        if (project.instructions !== undefined) updatePayload.instructions = project.instructions;
        if (project.proposalRequired !== undefined) updatePayload.proposal_required = project.proposalRequired;
        if (project.erDiagramRequired !== undefined) updatePayload.er_diagram_required = project.erDiagramRequired;
        if (project.databaseRequired !== undefined) updatePayload.database_required = project.databaseRequired;
        if (project.githubRequired !== undefined) updatePayload.github_required = project.githubRequired;
        if (project.finalReportRequired !== undefined) updatePayload.final_report_required = project.finalReportRequired;
        if (project.additionalRequirements !== undefined) updatePayload.additional_requirements = project.additionalRequirements;

        const { error } = await supabase.from("projects").update(updatePayload).eq("id", projectId);

        if (error) {
          // Fallback if some schema columns are pending migration
          const { error: fallbackErr } = await supabase
            .from("projects")
            .update({
              title: project.title,
              description: project.description,
              deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
              status: project.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", projectId);

          if (fallbackErr) {
            supabaseError = fallbackErr.message;
          } else {
            updatedInSupabase = true;
          }
        } else {
          updatedInSupabase = true;
        }
      } catch (err: any) {
        supabaseError = err?.message || "Failed to update project in Supabase.";
      }
    }

    return NextResponse.json({
      success: true,
      projectId,
      updatedInSupabase,
      message: updatedInSupabase
        ? "Project updated in database successfully."
        : "Project updated successfully (local mode).",
      warning: supabaseError || undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update project." },
      { status: 500 }
    );
  }
}


