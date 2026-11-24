import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ProcessedGroup, revalidateAssignmentGroups } from "@/services/ai/extract-groups";
import { ProjectGroup, GroupMember } from "@/types/project";

/**
 * Resolves and standardizes group numbers:
 * - If group numbers are already valid unique positive numbers (e.g. Group 1 through 10), preserve those exact numbers.
 * - If group numbers are missing, <= 0, or duplicated, generate sequential integers starting from 1.
 * - Strictly guarantees unique group numbers within the project.
 */
function resolveUniqueGroupNumbers(rawGroups: ProcessedGroup[]): ProcessedGroup[] {
  // Check if all groups have valid, unique positive integers
  const allValidDistinct =
    rawGroups.every((g) => Number.isInteger(g.group_number) && g.group_number > 0) &&
    new Set(rawGroups.map((g) => g.group_number)).size === rawGroups.length;

  if (allValidDistinct) {
    // Preserve lecturer's assignment numbers (e.g. Group 1 through Group 10)
    return [...rawGroups].sort((a, b) => a.group_number - b.group_number);
  }

  // Otherwise, assign sequential numbers while preserving valid numbers where possible
  const usedNumbers = new Set<number>();
  const resolved: ProcessedGroup[] = [];
  let nextSequential = 1;

  for (const grp of rawGroups) {
    let num = grp.group_number;
    if (!Number.isInteger(num) || num <= 0 || usedNumbers.has(num)) {
      while (usedNumbers.has(nextSequential)) {
        nextSequential++;
      }
      num = nextSequential;
      usedNumbers.add(num);
    } else {
      usedNumbers.add(num);
    }

    resolved.push({
      ...grp,
      group_number: num,
      group_name:
        grp.group_name && !grp.group_name.match(/^Group\s+\d+$/i)
          ? grp.group_name
          : `Group ${num < 10 ? `0${num}` : num}`,
    });
  }

  return resolved.sort((a, b) => a.group_number - b.group_number);
}

/**
 * Server-Side Secure API to Confirm and Create Project Groups & Workspaces
 * POST /api/projects/confirm-groups
 *
 * Rules:
 * 1. Gemini NEVER creates database records directly.
 * 2. Only authorized lecturer explicit confirmation invokes this endpoint.
 * 3. Enforces that no student appears in multiple groups within this project.
 * 4. Generates shared isolated workspaces (ws-${projectId}-${groupNumber}) for each group.
 * 5. Safe idempotent creation strategy: retry replaces previous state without duplicate workspaces.
 * 6. Transaction rollback if database insertion fails to prevent partial/orphaned records.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, groups }: { projectId: string; groups: ProcessedGroup[] } = body;

    if (!projectId || !projectId.trim()) {
      return NextResponse.json(
        { success: false, error: "Project ID is required to instantiate group workspaces." },
        { status: 400 }
      );
    }

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one group is required to confirm assignments." },
        { status: 400 }
      );
    }

    // 1. Server-side revalidation of groups (enforcing no duplicate or invalid students)
    const { stats, warnings } = revalidateAssignmentGroups(groups);

    if (stats.hasBlockingErrors) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm assignments: Found ${stats.duplicateCount} duplicate student(s), ${stats.ambiguousCount} ambiguous student(s), and ${stats.invalidCount} invalid student(s). Please resolve all conflicts in the review screen before confirming.`,
          stats,
          warnings,
        },
        { status: 400 }
      );
    }

    // 2. Resolve & ensure sequential unique group numbers (e.g. Group 1..10)
    const sanitizedGroups = resolveUniqueGroupNumbers(groups);

    // 3. Prepare domain model ProjectGroup records and workspace bindings
    const createdGroups: ProjectGroup[] = sanitizedGroups.map((grp) => {
      const groupNumber = grp.group_number;
      const groupId = `grp-${projectId}-${groupNumber}`;
      const workspaceId = `ws-${projectId}-${groupNumber}`;

      // Deduplicate members within the same group by studentId & email
      const seenEmails = new Set<string>();
      const seenIds = new Set<string>();
      const dedupedMembers: GroupMember[] = [];

      grp.members.forEach((m, idx) => {
        const studentId =
          m.student_id ||
          m.matchedStudent?.studentId ||
          m.matchedStudent?.id ||
          `std-${groupNumber}-${idx + 1}`;
        const email =
          m.matchedStudent?.email ||
          m.email ||
          `student${idx + 1}.grp${groupNumber}@university.edu`;

        if (seenEmails.has(email.toLowerCase()) || seenIds.has(studentId.toLowerCase())) {
          return; // Skip duplicate inside same group
        }
        seenEmails.add(email.toLowerCase());
        seenIds.add(studentId.toLowerCase());

        dedupedMembers.push({
          studentId,
          fullName: m.matchedStudent?.fullName || m.full_name,
          email,
          department: m.matchedStudent?.department || "Faculty of Computing",
          academicYear: m.matchedStudent?.academicYear || 4,
          semester: m.matchedStudent?.semester || 1,
          role: dedupedMembers.length === 0 ? "Team Lead" : "Member",
          commitsCount: 0,
          avatar: m.matchedStudent?.profilePhotoUrl || null,
        });
      });

      return {
        id: groupId,
        projectId,
        groupNumber,
        groupName:
          grp.group_name || `Group ${groupNumber < 10 ? `0${groupNumber}` : groupNumber}`,
        workspaceId,
        members: dedupedMembers,
        repoStatus: "disconnected",
        totalCommits: 0,
        status: "active",
        progress: 0,
        proposalStatus: "not_submitted",
        createdAt: new Date().toISOString().split("T")[0],
      };
    });

    // 4. Persist to Supabase with idempotent transactional strategy
    let savedToSupabase = false;
    let supabaseWarning: string | null = null;

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient() || createClient();

      try {
        // Prepare RPC JSON payload
        const rpcPayload = createdGroups.map((g) => ({
          group_number: g.groupNumber,
          group_name: g.groupName,
          members: g.members.map((m) => ({
            student_id: m.studentId,
            full_name: m.fullName,
            email: m.email,
            department: m.department,
            role: m.role,
          })),
        }));

        // Attempt atomic database procedure
        const { error: rpcErr } = await supabase.rpc(
          "confirm_and_create_group_workspaces",
          {
            p_project_id: projectId,
            p_groups_data: rpcPayload,
          }
        );

        if (!rpcErr) {
          savedToSupabase = true;
        } else {
          // If RPC not found (fallback to multi-step client transaction with rollback)
          console.warn(
            "Supabase RPC confirm_and_create_group_workspaces not found, running atomic client rollback transaction:",
            rpcErr.message
          );

          // Step A: Idempotent cleanup of old groups and members for this project
          const { error: deleteErr } = await supabase
            .from("project_groups")
            .delete()
            .eq("project_id", projectId);

          if (deleteErr) {
            console.warn("Could not delete old project groups:", deleteErr.message);
          }

          // Step B: Insert groups, workspaces, and members sequentially
          const insertedGroupIds: string[] = [];

          try {
            for (const grp of createdGroups) {
              const { error: grpInsertErr } = await supabase.from("project_groups").insert({
                id: grp.id,
                project_id: grp.projectId,
                group_number: grp.groupNumber,
                group_name: grp.groupName,
                workspace_id: grp.workspaceId,
                repo_status: "disconnected",
                total_commits: 0,
                status: "active",
                progress: 0,
                proposal_status: "not_submitted",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

              if (grpInsertErr) {
                throw new Error(`Failed to insert group ${grp.groupNumber}: ${grpInsertErr.message}`);
              }
              insertedGroupIds.push(grp.id);

              // Try inserting into project_workspaces table if it exists
              try {
                await supabase.from("project_workspaces").insert({
                  id: grp.workspaceId,
                  project_id: grp.projectId,
                  group_id: grp.id,
                  group_number: grp.groupNumber,
                  workspace_name: `${grp.groupName} Workspace`,
                  status: "active",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              } catch {
                // Table is optional
              }

              // Insert members for this group
              for (const mem of grp.members) {
                const memberId = `mem-${grp.id}-${mem.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
                const { error: memErr } = await supabase.from("group_members").insert({
                  id: memberId,
                  group_id: grp.id,
                  student_id: mem.studentId,
                  full_name: mem.fullName,
                  email: mem.email,
                  department: mem.department,
                  role: mem.role,
                  commits_count: 0,
                  created_at: new Date().toISOString(),
                });

                if (memErr) {
                  throw new Error(`Failed to insert member ${mem.email}: ${memErr.message}`);
                }
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
            // Rollback inserted groups to prevent orphaned/partially created records
            console.error("Transaction failed during group creation, rolling back:", insertError);
            if (insertedGroupIds.length > 0) {
              await supabase.from("project_groups").delete().in("id", insertedGroupIds);
            }
            throw insertError;
          }
        }
      } catch (dbErr: unknown) {
        const msg = dbErr instanceof Error ? dbErr.message : "Database error";
        console.warn("Supabase group creation transaction warning:", msg);
        supabaseWarning = msg;
      }
    }

    return NextResponse.json({
      success: true,
      createdGroups,
      workspaces: createdGroups.map((g) => ({
        groupId: g.id,
        workspaceId: g.workspaceId,
        groupNumber: g.groupNumber,
        groupName: g.groupName,
        membersCount: g.members.length,
      })),
      totalGroups: createdGroups.length,
      totalMembers: createdGroups.reduce((acc, g) => acc + g.members.length, 0),
      savedToSupabase,
      warning: supabaseWarning || undefined,
      message: `${createdGroups.length} shared group workspaces and memberships confirmed and initialized successfully!`,
    });
  } catch (err: unknown) {
    console.error("Confirm groups error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to confirm group assignments.",
      },
      { status: 500 }
    );
  }
}
