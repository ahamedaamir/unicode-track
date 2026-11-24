-- ==============================================================================
-- UniCodeTrack AI — Group Assignment Schema & Private Storage Bucket
-- Safe SQL Migration: 20261124_create_group_assignment_schema.sql
-- ==============================================================================

DO $$
BEGIN
    -- 1. assignment_source_type: 'pdf' | 'text' | 'none'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'assignment_source_type') THEN
        ALTER TABLE public.projects ADD COLUMN assignment_source_type VARCHAR(20) DEFAULT 'none';
    END IF;

    -- 2. assignment_file_path: private storage object key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'assignment_file_path') THEN
        ALTER TABLE public.projects ADD COLUMN assignment_file_path TEXT;
    END IF;

    -- 3. assignment_file_name: original uploaded filename
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'assignment_file_name') THEN
        ALTER TABLE public.projects ADD COLUMN assignment_file_name VARCHAR(255);
    END IF;

    -- 4. assignment_file_size: human-readable file size string
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'assignment_file_size') THEN
        ALTER TABLE public.projects ADD COLUMN assignment_file_size VARCHAR(50);
    END IF;

    -- 5. assignment_text: raw pasted text input from lecturer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'assignment_text') THEN
        ALTER TABLE public.projects ADD COLUMN assignment_text TEXT;
    END IF;

    -- 6. assignment_processing_status: 'pending' | 'processing' | 'completed' | 'error' | 'not_uploaded'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'assignment_processing_status') THEN
        ALTER TABLE public.projects ADD COLUMN assignment_processing_status VARCHAR(50) DEFAULT 'not_uploaded';
    END IF;
END $$;

-- 7. Create Private Storage Bucket for Group Assignments (public = false)
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-assignments', 'group-assignments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 8. Storage Security Policies for group-assignments private bucket
DROP POLICY IF EXISTS "Lecturers can view group-assignments" ON storage.objects;
CREATE POLICY "Lecturers can view group-assignments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'group-assignments'
        AND (
            auth.jwt() ->> 'role' IN ('lecturer', 'admin')
            OR auth.role() = 'authenticated'
        )
    );

DROP POLICY IF EXISTS "Lecturers can upload group-assignments" ON storage.objects;
CREATE POLICY "Lecturers can upload group-assignments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'group-assignments'
        AND (
            auth.jwt() ->> 'role' IN ('lecturer', 'admin')
            OR auth.role() = 'authenticated'
        )
    );

DROP POLICY IF EXISTS "Lecturers can update group-assignments" ON storage.objects;
CREATE POLICY "Lecturers can update group-assignments" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'group-assignments'
        AND (
            auth.jwt() ->> 'role' IN ('lecturer', 'admin')
            OR auth.role() = 'authenticated'
        )
    );

DROP POLICY IF EXISTS "Lecturers can delete group-assignments" ON storage.objects;
CREATE POLICY "Lecturers can delete group-assignments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'group-assignments'
        AND (
            auth.jwt() ->> 'role' IN ('lecturer', 'admin')
            OR auth.role() = 'authenticated'
        )
    );
