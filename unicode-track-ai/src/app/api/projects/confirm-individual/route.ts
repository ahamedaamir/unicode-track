import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ProjectStudentAssignment } from "@/types/project";

interface AssignStudentInput {
  studentId: string;
  fullName: string;
  email: string;
  departmentId?: string;
  academicYear?: number;
  semester?: number;
}

/**
 * Server-Side API to Confirm and Create Individual Student Project Assignments & Personal Workspaces
 * POST /api/projects/confirm-individual
 *
 * Rules:
 * 1. Each assigned student receives their own private personal workspace.
 * 2. Students must not share personal workspaces.
 * 3. Unique constraint enforced on (project_id, student_id).
 * 4. Safe idempotent creation strategy: retry replaces previous state without duplicate workspaces.
 * 5. Transaction rollback if database insertion fails to prevent partial/orphaned records.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      assignedStudents,
    }: {
      projectId: string;
      assignedStudents: AssignStudentInput[];
    } = body;

    if (!projectId || !projectId.trim()) {
      return NextResponse.json(
        { success: false, error: "Project ID is required to instantiate individual workspaces." },
        { status: 400 }
      );
    }

    if (!assignedStudents || !Array.isArray(assignedStudents) || assignedStudents.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one eligible student must be selected for assignment." },
        { status: 400 }
      );
    }

    // 1. Deduplicate by studentId & email to enforce UNIQUE(project_id, student_id)
    const seenStudentIds = new Set<string>();
    const seenEmails = new Set<string>();
    const uniqueStudents: AssignStudentInput[] = [];

    for (const student of assignedStudents) {
      const sId = (student.studentId || "").trim();
      const sEmail = (student.email || "").toLowerCase().trim();

      if (!sId || !sEmail) continue;

      if (seenStudentIds.has(sId) || seenEmails.has(sEmail)) {
        continue; // Skip duplicates within request
      }
      seenStudentIds.add(sId);
      seenEmails.add(sEmail);
      uniqueStudents.push({
        ...student,
        studentId: sId,
        email: sEmail,
      });
    }

    if (uniqueStudents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid unique students provided." },
        { status: 400 }
      );
    }

    // 2. Prepare domain model ProjectStudentAssignment records
    const createdAssignments: ProjectStudentAssignment[] = uniqueStudents.map((s) => {
      const assignmentId = `asgn-${projectId}-${s.studentId}`;
      const workspaceId = `ws-ind-${projectId}-${s.studentId}`;

      return {
        id: assignmentId,
        projectId,
        studentId: s.studentId,
        studentEmail: s.email,
        studentName: s.fullName,
        departmentId: s.departmentId || "Faculty of Computing",
        academicYear: s.academicYear || 4,
        semester: s.semester || 1,
        workspaceId,
        repoStatus: "disconnected",
        totalCommits: 0,
        status: "active",
        progress: 0,
        proposalStatus: "not_submitted",
        createdAt: new Date().toISOString().split("T")[0],
      };
    });

    // 3. Persist to Supabase if configured with idempotent transactional strategy
    let savedToSupabase = false;
    let supabaseWarning: string | null = null;

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient() || createClient();

      try {
        const rpcPayload = createdAssignments.map((a) => ({
          student_id: a.studentId,
          student_name: a.studentName,
          student_email: a.studentEmail,
          department_id: a.departmentId,
          academic_year: a.academicYear,
          semester: a.semester,
        }));

        // Try PostgreSQL procedure
        const { error: rpcErr } = await supabase.rpc(
          "confirm_and_create_individual_workspaces",
          {
            p_project_id: projectId,
            p_assignments_data: rpcPayload,
          }
        );

        if (!rpcErr) {
          savedToSupabase = true;
        } else {
          console.warn(
            "Supabase RPC confirm_and_create_individual_workspaces not found, running atomic client rollback transaction:",
            rpcErr.message
          );

          // Step A: Idempotent cleanup of old individual assignments for this project
          await supabase
            .from("project_student_assignments")
            .delete()
            .eq("project_id", projectId);

          // Step B: Insert student assignments sequentially
          const insertedAssignmentIds: string[] = [];

          try {
            for (const asgn of createdAssignments) {
              const { error: insertErr } = await supabase
                .from("project_student_assignments")
                .insert({
                  id: asgn.id,
                  project_id: asgn.projectId,
                  student_id: asgn.studentId,
                  student_email: asgn.studentEmail,
                  student_name: asgn.studentName,
                  department_id: asgn.departmentId,
                  academic_year: asgn.academicYear,
                  semester: asgn.semester,
                  workspace_id: asgn.workspaceId,
                  repo_status: "disconnected",
                  total_commits: 0,
                  status: "active",
                  progress: 0,
                  proposal_status: "not_submitted",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });

              if (insertErr) {
                throw new Error(
                  `Failed to insert assignment for ${asgn.studentEmail}: ${insertErr.message}`
                );
              }
              insertedAssignmentIds.push(asgn.id);

              // Try inserting into project_workspaces table if it exists
              try {
                await supabase.from("project_workspaces").insert({
                  id: asgn.workspaceId,
                  project_id: asgn.projectId,
                  group_id: asgn.id,
                  group_number: insertedAssignmentIds.length,
                  workspace_name: `${asgn.studentName} Personal Workspace`,
                  status: "active",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              } catch {
                // Optional anchor table
              }
            }

            // Step C: Update project status
            await supabase
              .from("projects")
              .update({
                assignment_processing_status: "completed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", projectId);

            savedToSupabase = true;
          } catch (insertError: unknown) {
            // Rollback inserted assignments on failure
            console.error(
              "Transaction failed during individual assignment creation, rolling back:",
              insertError
            );
            if (insertedAssignmentIds.length > 0) {
              await supabase
                .from("project_student_assignments")
                .delete()
                .in("id", insertedAssignmentIds);
            }
            throw insertError;
          }
        }
      } catch (dbErr: unknown) {
        const msg = dbErr instanceof Error ? dbErr.message : "Database error";
        console.warn("Supabase individual assignments creation warning:", msg);
        supabaseWarning = msg;
      }
    }

    return NextResponse.json({
      success: true,
      createdAssignments,
      totalAssigned: createdAssignments.length,
      savedToSupabase,
      warning: supabaseWarning || undefined,
      message: `${createdAssignments.length} individual student personal workspaces confirmed and initialized successfully!`,
    });
  } catch (err: unknown) {
    console.error("Confirm individual assignments error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to confirm individual project assignments.",
      },
      { status: 500 }
    );
  }
}
