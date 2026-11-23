-- ====================================================================================
-- UniCodeTrack AI: ER Diagram Submissions, AI Analysis & Database Code Evaluation
-- Migration: 20261124_create_er_diagram_evaluation_schema.sql
-- ====================================================================================

-- 1. ER Diagram Submissions (Shared per Student Group)
CREATE TABLE IF NOT EXISTS er_diagram_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    submitted_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_by_name VARCHAR(255) NOT NULL,
    submitted_by_email VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(64) NOT NULL,
    file_type VARCHAR(16) NOT NULL CHECK (file_type IN ('pdf', 'png', 'jpg', 'jpeg')),
    storage_path TEXT NOT NULL,
    file_url TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    version_note TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'analyzing', 'reviewed', 'approved', 'resubmission_requested', 'published')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy group and project lookups
CREATE INDEX IF NOT EXISTS idx_er_submissions_group ON er_diagram_submissions(project_id, group_id);

-- 2. ER Diagram AI Analysis Records
CREATE TABLE IF NOT EXISTS er_diagram_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES er_diagram_submissions(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    ai_model VARCHAR(64) NOT NULL DEFAULT 'gemini-2.5-flash',
    overall_correctness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    completeness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    implementation_consistency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_suggested_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
    summary TEXT,
    missing_entities JSONB DEFAULT '[]'::jsonb,
    missing_attributes JSONB DEFAULT '[]'::jsonb,
    incorrect_keys JSONB DEFAULT '[]'::jsonb,
    cardinality_problems JSONB DEFAULT '[]'::jsonb,
    normalization_concerns JSONB DEFAULT '[]'::jsonb,
    sql_discrepancies JSONB DEFAULT '[]'::jsonb,
    issues JSONB DEFAULT '[]'::jsonb,
    criterion_evaluations JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    repository_commit_sha VARCHAR(64),
    sql_schema_verified BOOLEAN NOT NULL DEFAULT false,
    sql_verification_note TEXT,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ER Diagram Evaluation Versions & Lecturer Feedback
CREATE TABLE IF NOT EXISTS er_diagram_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES er_diagram_submissions(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES er_diagram_analysis(id) ON DELETE SET NULL,
    project_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    lecturer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lecturer_name VARCHAR(255) NOT NULL,
    approved_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'resubmission_requested', 'published')),
    general_comments TEXT,
    criterion_adjusted_marks JSONB DEFAULT '[]'::jsonb,
    allow_student_ai_feedback_view BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT false,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE er_diagram_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE er_diagram_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE er_diagram_feedback ENABLE ROW LEVEL SECURITY;

-- Lecturers can manage all ER diagram records
CREATE POLICY "Lecturers can manage ER submissions"
    ON er_diagram_submissions FOR ALL
    USING (auth.jwt() ->> 'role' IN ('lecturer', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('lecturer', 'admin'));

CREATE POLICY "Lecturers can manage ER analysis"
    ON er_diagram_analysis FOR ALL
    USING (auth.jwt() ->> 'role' IN ('lecturer', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('lecturer', 'admin'));

CREATE POLICY "Lecturers can manage ER feedback"
    ON er_diagram_feedback FOR ALL
    USING (auth.jwt() ->> 'role' IN ('lecturer', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('lecturer', 'admin'));

-- Students can view and submit ER diagrams for their assigned group
CREATE POLICY "Students can view group ER submissions"
    ON er_diagram_submissions FOR SELECT
    USING (
        group_id IN (
            SELECT group_id::text FROM group_members WHERE student_id = auth.uid()
        )
    );

CREATE POLICY "Students can upload group ER submissions"
    ON er_diagram_submissions FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id::text FROM group_members WHERE student_id = auth.uid()
        )
    );

-- Students can ONLY view published feedback and AI analysis when permitted
CREATE POLICY "Students can view published ER feedback"
    ON er_diagram_feedback FOR SELECT
    USING (
        is_published = true AND
        group_id IN (
            SELECT group_id::text FROM group_members WHERE student_id = auth.uid()
        )
    );

CREATE POLICY "Students can view permitted ER analysis"
    ON er_diagram_analysis FOR SELECT
    USING (
        submission_id IN (
            SELECT submission_id FROM er_diagram_feedback 
            WHERE is_published = true AND allow_student_ai_feedback_view = true
        ) AND
        group_id IN (
            SELECT group_id::text FROM group_members WHERE student_id = auth.uid()
        )
    );
