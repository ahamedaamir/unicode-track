-- ==============================================================================
-- UniCodeTrack AI — Add Project Requirements, Instructions & Type Columns
-- Safe SQL Migration: 20261124_add_project_requirements_and_type_columns.sql
-- ==============================================================================

DO $$
BEGIN
    -- 1. Add project_type column (individual | group)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE public.projects ADD COLUMN project_type VARCHAR(50) DEFAULT 'group';
    END IF;

    -- 2. Add course_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'course_id') THEN
        ALTER TABLE public.projects ADD COLUMN course_id VARCHAR(50);
    END IF;

    -- 3. Add requirements (comprehensive text / specification)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'requirements') THEN
        ALTER TABLE public.projects ADD COLUMN requirements TEXT;
    END IF;

    -- 4. Add instructions (guidelines, student instructions)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'instructions') THEN
        ALTER TABLE public.projects ADD COLUMN instructions TEXT;
    END IF;

    -- 5. Add er_diagram_required flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'er_diagram_required') THEN
        ALTER TABLE public.projects ADD COLUMN er_diagram_required BOOLEAN DEFAULT true;
    END IF;

    -- 6. Add er_diagram_deadline
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'er_diagram_deadline') THEN
        ALTER TABLE public.projects ADD COLUMN er_diagram_deadline TIMESTAMPTZ;
    END IF;

    -- 7. Add database_required flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'database_required') THEN
        ALTER TABLE public.projects ADD COLUMN database_required BOOLEAN DEFAULT true;
    END IF;

    -- 8. Add database_requirements text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'database_requirements') THEN
        ALTER TABLE public.projects ADD COLUMN database_requirements TEXT;
    END IF;

    -- 9. Add github_required flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'github_required') THEN
        ALTER TABLE public.projects ADD COLUMN github_required BOOLEAN DEFAULT true;
    END IF;

    -- 10. Add final_report_required flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'final_report_required') THEN
        ALTER TABLE public.projects ADD COLUMN final_report_required BOOLEAN DEFAULT true;
    END IF;

    -- 11. Add additional_requirements text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'additional_requirements') THEN
        ALTER TABLE public.projects ADD COLUMN additional_requirements TEXT;
    END IF;
END $$;
