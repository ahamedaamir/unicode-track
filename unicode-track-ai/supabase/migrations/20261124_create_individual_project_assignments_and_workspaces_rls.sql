-- ==============================================================================
-- UniCodeTrack AI — Individual Project Assignments, Personal Workspaces & RLS
-- Safe SQL Migration: 20261124_create_individual_project_assignments_and_workspaces_rls.sql
-- ==============================================================================

-- 1. Create project_student_assignments table
CREATE TABLE IF NOT EXISTS public.project_student_assignments (
    id VARCHAR(100) PRIMARY KEY, -- 'asgn-<projectId>-<studentId>'
    project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    department_id VARCHAR(50),
    academic_year INTEGER,
    semester INTEGER,
    workspace_id VARCHAR(100) NOT NULL, -- 'ws-ind-<projectId>-<studentId>'
    repo_url VARCHAR(500),
    repo_name VARCHAR(255),
    repo_status VARCHAR(50) DEFAULT 'disconnected' CHECK (repo_status IN ('disconnected', 'connected', 'syncing', 'error')),
    default_branch VARCHAR(100) DEFAULT 'main',
    total_commits INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    proposal_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (proposal_status IN ('not_submitted', 'submitted', 'under_review', 'changes_requested', 'approved')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_project_student_assignment UNIQUE (project_id, student_id),
    CONSTRAINT uq_project_student_workspace UNIQUE (project_id, workspace_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_project ON public.project_student_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_student ON public.project_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_email ON public.project_student_assignments(student_email);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_workspace ON public.project_student_assignments(workspace_id);

-- Enable RLS
ALTER TABLE public.project_student_assignments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Safe Idempotent Atomic Procedure for Individual Workspace Confirmation
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.confirm_and_create_individual_workspaces(
    p_project_id VARCHAR,
    p_assignments_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    v_assignment_id VARCHAR;
    v_workspace_id VARCHAR;
    v_student_id VARCHAR;
    v_student_name VARCHAR;
    v_student_email VARCHAR;
    v_department_id VARCHAR;
    v_academic_year INTEGER;
    v_semester INTEGER;
    v_total_assigned INTEGER := 0;
BEGIN
    -- 1. Verify project exists
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION 'Project % does not exist', p_project_id;
    END IF;

    -- 2. Idempotent cleanup of existing individual assignments for this project
    DELETE FROM public.project_student_assignments WHERE project_id = p_project_id;

    -- 3. Iterate over the JSON array of student assignments
    FOR item IN SELECT * FROM jsonb_array_elements(p_assignments_data)
    LOOP
        v_student_id := item->>'student_id';
        v_student_name := item->>'student_name';
        v_student_email := item->>'student_email';
        v_department_id := item->>'department_id';
        v_academic_year := (item->>'academic_year')::INTEGER;
        v_semester := (item->>'semester')::INTEGER;
        
        v_assignment_id := 'asgn-' || p_project_id || '-' || v_student_id;
        v_workspace_id := 'ws-ind-' || p_project_id || '-' || v_student_id;

        -- Insert student assignment
        INSERT INTO public.project_student_assignments (
            id,
            project_id,
            student_id,
            student_email,
            student_name,
            department_id,
            academic_year,
            semester,
            workspace_id,
            repo_status,
            total_commits,
            status,
            progress,
            proposal_status,
            created_at,
            updated_at
        ) VALUES (
            v_assignment_id,
            p_project_id,
            v_student_id,
            v_student_email,
            v_student_name,
            v_department_id,
            v_academic_year,
            v_semester,
            v_workspace_id,
            'disconnected',
            0,
            'active',
            0,
            'not_submitted',
            NOW(),
            NOW()
        );

        -- Optional anchor in project_workspaces if table exists
        BEGIN
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
                v_assignment_id,
                v_total_assigned + 1,
                v_student_name || ' Personal Workspace',
                'active',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Optional table
        END;

        v_total_assigned := v_total_assigned + 1;
    END LOOP;

    -- 4. Mark project assignment processing status completed
    UPDATE public.projects
    SET assignment_processing_status = 'completed',
        updated_at = NOW()
    WHERE id = p_project_id;

    RETURN jsonb_build_object(
        'success', true,
        'projectId', p_project_id,
        'totalAssigned', v_total_assigned
    );
EXCEPTION WHEN OTHERS THEN
    -- Automatic transaction rollback on failure
    RAISE EXCEPTION 'Atomic individual assignment confirmation failed: %', SQLERRM;
END;
$$;

-- ==============================================================================
-- 3. Row Level Security (RLS) Policies
-- ==============================================================================

-- 3.1 Student Isolation Policy: Students can access ONLY their own personal workspace
DROP POLICY IF EXISTS "Students can only access their own personal assignment workspace" ON public.project_student_assignments;
CREATE POLICY "Students can only access their own personal assignment workspace"
ON public.project_student_assignments FOR SELECT
USING (
    -- Admin universal access
    auth.jwt() ->> 'role' = 'admin'
    -- Lecturer supervisory access for supervised projects
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_student_assignments.project_id
        AND (
            p.lecturer_id = auth.jwt() ->> 'sub'
            OR p.lecturer_name = auth.jwt() ->> 'name'
            OR p.lecturer_id = (SELECT id FROM public.lecturers WHERE email = auth.jwt() ->> 'email')
            OR p.course_code = ANY((SELECT assigned_courses FROM public.lecturers WHERE email = auth.jwt() ->> 'email'))
        )
    )
    -- Student can access strictly their own record
    OR student_email = auth.jwt() ->> 'email'
    OR student_id = auth.jwt() ->> 'student_id'
);

-- 3.2 Lecturer and Admin Management Policy
DROP POLICY IF EXISTS "Lecturers and admins can manage individual project student assignments" ON public.project_student_assignments;
CREATE POLICY "Lecturers and admins can manage individual project student assignments"
ON public.project_student_assignments FOR ALL
USING (
    auth.jwt() ->> 'role' IN ('lecturer', 'admin')
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_student_assignments.project_id
        AND (
            p.lecturer_id = auth.jwt() ->> 'sub'
            OR p.lecturer_name = auth.jwt() ->> 'name'
            OR p.lecturer_id = (SELECT id FROM public.lecturers WHERE email = auth.jwt() ->> 'email')
            OR p.course_code = ANY((SELECT assigned_courses FROM public.lecturers WHERE email = auth.jwt() ->> 'email'))
        )
    )
);
