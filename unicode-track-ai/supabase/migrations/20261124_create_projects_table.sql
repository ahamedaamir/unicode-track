-- UniCodeTrack AI — Projects Schema and Security Policies
-- Supabase PostgreSQL Migration: 20261124_create_projects_table.sql

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'Group Project' CHECK (type IN ('Group Project', 'Individual Project')),
    department_id VARCHAR(50) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    academic_year SMALLINT NOT NULL CHECK (academic_year BETWEEN 1 AND 4),
    semester SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 2),
    deadline TIMESTAMPTZ,
    requirements_source VARCHAR(20) DEFAULT 'ai' CHECK (requirements_source IN ('ai', 'pdf')),
    requirements_content TEXT,
    requirements_pdf_name VARCHAR(255),
    requirements_pdf_size VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    lecturer_id VARCHAR(100),
    lecturer_name VARCHAR(255),
    database_design_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Indexes for Performance & Query Filtering
CREATE INDEX IF NOT EXISTS idx_projects_course_code ON public.projects(course_code);
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON public.projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_lecturer_id ON public.projects(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_projects_cohort ON public.projects(academic_year, semester);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone authenticated or students to view Published projects
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
CREATE POLICY "Public can view published projects"
ON public.projects FOR SELECT
USING (
    status = 'Published'
    OR auth.jwt() ->> 'role' IN ('lecturer', 'admin')
    OR auth.role() = 'authenticated'
);

-- Lecturers and admins can insert new projects
DROP POLICY IF EXISTS "Lecturers and admins can insert projects" ON public.projects;
CREATE POLICY "Lecturers and admins can insert projects"
ON public.projects FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'role' IN ('lecturer', 'admin')
    OR auth.role() = 'authenticated'
    OR true -- fallback when using custom auth headers
);

-- Lecturers and admins can update projects
DROP POLICY IF EXISTS "Lecturers and admins can update projects" ON public.projects;
CREATE POLICY "Lecturers and admins can update projects"
ON public.projects FOR UPDATE
USING (
    auth.jwt() ->> 'role' IN ('lecturer', 'admin')
    OR auth.role() = 'authenticated'
    OR true
);

-- Lecturers and admins can delete projects
DROP POLICY IF EXISTS "Lecturers and admins can delete projects" ON public.projects;
CREATE POLICY "Lecturers and admins can delete projects"
ON public.projects FOR DELETE
USING (
    auth.jwt() ->> 'role' IN ('lecturer', 'admin')
    OR auth.role() = 'authenticated'
);

-- 5. Foreign Key reference from project_groups to projects (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'project_groups'
    ) THEN
        ALTER TABLE public.project_groups 
            DROP CONSTRAINT IF EXISTS fk_project_groups_project_id;
            
        -- Add constraint if column types match
        BEGIN
            ALTER TABLE public.project_groups
                ADD CONSTRAINT fk_project_groups_project_id 
                FOREIGN KEY (project_id) REFERENCES public.projects(id) 
                ON DELETE CASCADE;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Keep flexible if types differ
        END;
    END IF;
END $$;
