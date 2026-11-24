-- ==============================================================================
-- UniCodeTrack AI — Automatic Group Creation, Shared Workspaces, and RLS Policies
-- Safe SQL Migration: 20261124_create_automatic_groups_and_workspaces_rls.sql
-- ==============================================================================

DO $$
BEGIN
    -- 1. Ensure project_groups has workspace_id and proper constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'project_groups' AND column_name = 'workspace_id'
    ) THEN
        ALTER TABLE public.project_groups ADD COLUMN workspace_id VARCHAR(100);
    END IF;

    -- Ensure unique constraint on (project_id, group_number)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_project_groups_project_group_num'
    ) THEN
        BEGIN
            ALTER TABLE public.project_groups 
            ADD CONSTRAINT uq_project_groups_project_group_num UNIQUE (project_id, group_number);
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Constraint might already exist under another name
        END;
    END IF;

    -- 2. Ensure group_members has unique constraints (one membership per student per group)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_group_members_group_email'
    ) THEN
        BEGIN
            ALTER TABLE public.group_members 
            ADD CONSTRAINT uq_group_members_group_email UNIQUE (group_id, email);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_group_members_group_student_id'
    ) THEN
        BEGIN
            ALTER TABLE public.group_members 
            ADD CONSTRAINT uq_group_members_group_student_id UNIQUE (group_id, student_id);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;

-- ==============================================================================
-- 3. Project Workspaces Anchor Table (Optional / Architecture Complement)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_workspaces (
    id VARCHAR(100) PRIMARY KEY, -- 'ws-<projectId>-<groupNumber>'
    project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    group_id VARCHAR(100) NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
    group_number INTEGER NOT NULL,
    workspace_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_project_workspaces_proj_group UNIQUE (project_id, group_id),
    CONSTRAINT uq_project_workspaces_proj_num UNIQUE (project_id, group_number)
);

CREATE INDEX IF NOT EXISTS idx_project_workspaces_project ON public.project_workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workspaces_group ON public.project_workspaces(group_id);

ALTER TABLE public.project_workspaces ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. Safe Idempotent Atomic Transaction Procedure
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.confirm_and_create_group_workspaces(
    p_project_id VARCHAR,
    p_groups_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    grp_item JSONB;
    mem_item JSONB;
    v_group_id VARCHAR;
    v_workspace_id VARCHAR;
    v_group_number INTEGER;
    v_group_name VARCHAR;
    v_member_id VARCHAR;
    v_total_groups INTEGER := 0;
    v_total_members INTEGER := 0;
BEGIN
    -- 1. Verify project exists
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION 'Project % does not exist', p_project_id;
    END IF;

    -- 2. Clean up any existing groups for this project to ensure safe idempotency
    -- Cascades automatically to group_members, project_workspaces, and group_proposals
    DELETE FROM public.project_groups WHERE project_id = p_project_id;

    -- 3. Iterate over the JSON array of groups
    FOR grp_item IN SELECT * FROM jsonb_array_elements(p_groups_data)
    LOOP
        v_group_number := (grp_item->>'group_number')::INTEGER;
        v_group_name := grp_item->>'group_name';
        v_group_id := 'grp-' || p_project_id || '-' || v_group_number;
        v_workspace_id := 'ws-' || p_project_id || '-' || v_group_number;

        -- Insert project_group
        INSERT INTO public.project_groups (
            id,
            project_id,
            group_number,
            group_name,
            workspace_id,
            repo_status,
            total_commits,
            status,
            progress,
            proposal_status,
            created_at,
            updated_at
        ) VALUES (
            v_group_id,
            p_project_id,
            v_group_number,
            v_group_name,
            v_workspace_id,
            'disconnected',
            0,
            'active',
            0,
            'not_submitted',
            NOW(),
            NOW()
        );

        -- Insert project_workspace anchor
        INSERT INTO public.project_workspaces (
            id,
            project_id,
            group_id,
            group_number,
            workspace_name,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_workspace_id,
            p_project_id,
            v_group_id,
            v_group_number,
            v_group_name || ' Workspace',
            'active',
            NOW(),
            NOW()
        );

        v_total_groups := v_total_groups + 1;

        -- Insert group_members
        FOR mem_item IN SELECT * FROM jsonb_array_elements(grp_item->'members')
        LOOP
            v_member_id := 'mem-' || v_group_id || '-' || REPLACE(REGEXP_REPLACE(mem_item->>'email', '[^a-zA-Z0-9]', '_', 'g'), '__', '_');

            INSERT INTO public.group_members (
                id,
                group_id,
                student_id,
                full_name,
                email,
                department,
                role,
                commits_count,
                created_at
            ) VALUES (
                v_member_id,
                v_group_id,
                COALESCE(mem_item->>'student_id', 'std-' || v_group_number || '-' || (v_total_members + 1)),
                mem_item->>'full_name',
                mem_item->>'email',
                mem_item->>'department',
                COALESCE(mem_item->>'role', 'Member'),
                0,
                NOW()
            );

            v_total_members := v_total_members + 1;
        END LOOP;
    END LOOP;

    -- 4. Mark project group assignment completed
    UPDATE public.projects
    SET assignment_processing_status = 'completed',
        updated_at = NOW()
    WHERE id = p_project_id;

    RETURN jsonb_build_object(
        'success', true,
        'projectId', p_project_id,
        'totalGroups', v_total_groups,
        'totalMembers', v_total_members
    );
EXCEPTION WHEN OTHERS THEN
    -- Transaction rolls back automatically on exception
    RAISE EXCEPTION 'Atomic confirmation failed: %', SQLERRM;
END;
$$;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR WORKSPACES, GROUPS & MEMBERS
-- ==============================================================================

-- 5.1 Project Groups RLS
DROP POLICY IF EXISTS "Students can only access own group workspace" ON public.project_groups;
CREATE POLICY "Students can only access own group workspace"
ON public.project_groups FOR SELECT
USING (
    -- Admin has universal access
    auth.jwt() ->> 'role' = 'admin'
    -- Lecturer has access to projects they supervise
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_groups.project_id
        AND (
            p.lecturer_id = auth.jwt() ->> 'sub'
            OR p.lecturer_name = auth.jwt() ->> 'name'
            OR p.lecturer_id = (SELECT id FROM public.lecturers WHERE email = auth.jwt() ->> 'email')
            OR p.course_code = ANY((SELECT assigned_courses FROM public.lecturers WHERE email = auth.jwt() ->> 'email'))
        )
    )
    -- Student can ONLY access their own assigned group
    OR id IN (
        SELECT group_id FROM public.group_members
        WHERE email = auth.jwt() ->> 'email'
        OR student_id = auth.jwt() ->> 'student_id'
    )
);

DROP POLICY IF EXISTS "Lecturers and admins can manage project_groups" ON public.project_groups;
CREATE POLICY "Lecturers and admins can manage project_groups"
ON public.project_groups FOR ALL
USING (
    auth.jwt() ->> 'role' IN ('lecturer', 'admin')
    OR auth.role() = 'authenticated'
);

-- 5.2 Group Members RLS
DROP POLICY IF EXISTS "Students can view members of own group only" ON public.group_members;
CREATE POLICY "Students can view members of own group only"
ON public.group_members FOR SELECT
USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.project_groups pg
        JOIN public.projects p ON p.id = pg.project_id
        WHERE pg.id = group_members.group_id
        AND (
            p.lecturer_id = auth.jwt() ->> 'sub'
            OR p.lecturer_name = auth.jwt() ->> 'name'
            OR p.course_code = ANY((SELECT assigned_courses FROM public.lecturers WHERE email = auth.jwt() ->> 'email'))
        )
    )
    OR group_id IN (
        SELECT group_id FROM public.group_members gm
        WHERE gm.email = auth.jwt() ->> 'email'
        OR gm.student_id = auth.jwt() ->> 'student_id'
    )
);

-- 5.3 Project Workspaces RLS
DROP POLICY IF EXISTS "Students can access own workspace anchor only" ON public.project_workspaces;
CREATE POLICY "Students can access own workspace anchor only"
ON public.project_workspaces FOR SELECT
USING (
    auth.jwt() ->> 'role' = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_workspaces.project_id
        AND (
            p.lecturer_id = auth.jwt() ->> 'sub'
            OR p.lecturer_name = auth.jwt() ->> 'name'
            OR p.course_code = ANY((SELECT assigned_courses FROM public.lecturers WHERE email = auth.jwt() ->> 'email'))
        )
    )
    OR group_id IN (
        SELECT group_id FROM public.group_members
        WHERE email = auth.jwt() ->> 'email'
        OR student_id = auth.jwt() ->> 'student_id'
    )
);
