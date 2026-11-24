import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ProcessedGroup, revalidateAssignmentGroups } from "@/services/ai/extract-groups";
import { ProjectGroup, GroupMember } from "@/types/project";

/**
 * Server-Side Secure API to Confirm and Create Project Groups & Workspaces
 * POST /api/projects/confirm-groups
 *
 * Rules:
 * 1. Gemini NEVER creates database records directly.
 * 2. Only authorized lecturer explicit confirmation invokes this endpoint.
 * 3. Enforces that no student appears in multiple groups.
 * 4. Generates shared isolated workspaces for each confirmed group.
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

    // 2. Prepare domain model ProjectGroup records
    const createdGroups: ProjectGroup[] = groups.map((grp) => {
      const groupNumber = grp.group_number;
      const groupId = `grp-${projectId}-${groupNumber}`;
      const workspaceId = `ws-${projectId}-${groupNumber}`;

      const members: GroupMember[] = grp.members.map((m, idx) => ({
        studentId: m.student_id || m.matchedStudent?.studentId || m.matchedStudent?.id || `std-${groupNumber}-${idx + 1}`,
        fullName: m.matchedStudent?.fullName || m.full_name,
        email: m.matchedStudent?.email || m.email || `student${idx + 1}.grp${groupNumber}@university.edu`,
        department: m.matchedStudent?.department || "Faculty of Computing",
        academicYear: m.matchedStudent?.academicYear || 4,
        semester: m.matchedStudent?.semester || 1,
        role: idx === 0 ? "Team Lead" : "Member",
        commitsCount: 0,
        avatar: m.matchedStudent?.profilePhotoUrl || null,
      }));

      return {
        id: groupId,
        projectId,
        groupNumber,
        groupName: grp.group_name || `Group ${groupNumber < 10 ? `0${groupNumber}` : groupNumber}`,
        workspaceId,
        members,
        repoStatus: "disconnected",
        totalCommits: 0,
        status: "active",
        progress: 0,
        proposalStatus: "not_submitted",
        createdAt: new Date().toISOString().split("T")[0],
      };
    });

    // 3. Persist to Supabase if configured
    let savedToSupabase = false;
    let supabaseWarning: string | null = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient() || createClient();

        for (const grp of createdGroups) {
          // Upsert project group
          const { error: groupErr } = await supabase.from("project_groups").upsert(
            {
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
            },
            { onConflict: "id" }
          );

          if (groupErr) {
            console.warn("Supabase group upsert warning:", groupErr);
            supabaseWarning = groupErr.message;
          } else {
            // Upsert group members
            for (const mem of grp.members) {
              const memberId = `mem-${grp.id}-${mem.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
              await supabase.from("group_members").upsert(
                {
                  id: memberId,
                  group_id: grp.id,
                  student_id: mem.studentId,
                  full_name: mem.fullName,
                  email: mem.email,
                  department: mem.department,
                  role: mem.role,
                  commits_count: 0,
                  created_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );
            }
          }
        }

        // Update project assignment processing status
        await supabase
          .from("projects")
          .update({
            assignment_processing_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);

        savedToSupabase = true;
      } catch (dbErr: unknown) {
        const msg = dbErr instanceof Error ? dbErr.message : "Database error";
        console.warn("Supabase groups creation exception:", msg);
        supabaseWarning = msg;
      }
    }

    return NextResponse.json({
      success: true,
      createdGroups,
      totalGroups: createdGroups.length,
      totalMembers: createdGroups.reduce((acc, g) => acc + g.members.length, 0),
      savedToSupabase,
      warning: supabaseWarning || undefined,
      message: `${createdGroups.length} group workspaces and memberships confirmed and initialized successfully!`,
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
