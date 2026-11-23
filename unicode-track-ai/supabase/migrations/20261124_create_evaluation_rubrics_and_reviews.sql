-- ====================================================================================
-- UniCodeTrack AI: Academic Evaluation Rubrics, AI Code Reviews & Marks Schema
-- Migration: 20261124_create_evaluation_rubrics_and_reviews.sql
-- ====================================================================================

-- 1. Evaluation Rubrics
CREATE TABLE IF NOT EXISTS evaluation_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Standard Academic Capstone Rubric',
    description TEXT,
    total_marks INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Rubric Criteria
CREATE TABLE IF NOT EXISTS rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubric_id UUID NOT NULL REFERENCES evaluation_rubrics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_marks INTEGER NOT NULL,
    evaluation_instructions TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Project Evaluations (Versioned)
CREATE TABLE IF NOT EXISTS project_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    lecturer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lecturer_name VARCHAR(255),
    rubric_id UUID REFERENCES evaluation_rubrics(id) ON DELETE SET NULL,
    version INTEGER NOT NULL DEFAULT 1,
    commit_sha VARCHAR(64) NOT NULL DEFAULT 'HEAD',
    repo_url TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'not_evaluated' 
        CHECK (status IN ('not_evaluated', 'ai_completed', 'in_review', 'approved', 'published')),
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    ai_model VARCHAR(64) NOT NULL DEFAULT 'gemini-2.5-flash',
    summary TEXT,
    git_telemetry_analysis TEXT,
    lecturer_comments TEXT,
    evaluated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, group_id, version)
);

-- 4. Evaluation Criterion Scores
CREATE TABLE IF NOT EXISTS evaluation_criterion_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES project_evaluations(id) ON DELETE CASCADE,
    criterion_id UUID REFERENCES rubric_criteria(id) ON DELETE SET NULL,
    criterion_name VARCHAR(255) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL,
    ai_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    lecturer_score NUMERIC(5,2),
    final_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    explanation TEXT,
    suggestions JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Evaluation Requirements Coverage Items
CREATE TABLE IF NOT EXISTS evaluation_requirements_coverage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES project_evaluations(id) ON DELETE CASCADE,
    requirement_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('Implemented', 'Partial', 'Missing', 'Unable to verify')),
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE evaluation_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criterion_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_requirements_coverage ENABLE ROW LEVEL SECURITY;

-- Lecturers can manage rubrics and evaluations
CREATE POLICY "Lecturers can manage rubrics"
    ON evaluation_rubrics FOR ALL
    USING (auth.jwt() ->> 'role' IN ('lecturer', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('lecturer', 'admin'));

CREATE POLICY "Lecturers can manage criteria"
    ON rubric_criteria FOR ALL
    USING (auth.jwt() ->> 'role' IN ('lecturer', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('lecturer', 'admin'));

CREATE POLICY "Lecturers can manage evaluations"
    ON project_evaluations FOR ALL
    USING (auth.jwt() ->> 'role' IN ('lecturer', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('lecturer', 'admin'));

CREATE POLICY "Lecturers can manage criterion scores"
    ON evaluation_criterion_scores FOR ALL
    USING (auth.jwt() ->> 'role' IN ('lecturer', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('lecturer', 'admin'));

-- Students can ONLY view published evaluations for their group
CREATE POLICY "Students can view published evaluations"
    ON project_evaluations FOR SELECT
    USING (
        status = 'published' AND
        group_id IN (
            SELECT group_id::text FROM group_members WHERE student_id = auth.uid()
        )
    );

CREATE POLICY "Students can view published criterion scores"
    ON evaluation_criterion_scores FOR SELECT
    USING (
        evaluation_id IN (
            SELECT id FROM project_evaluations WHERE status = 'published'
        )
    );

CREATE POLICY "Students can view published requirements coverage"
    ON evaluation_requirements_coverage FOR SELECT
    USING (
        evaluation_id IN (
            SELECT id FROM project_evaluations WHERE status = 'published'
        )
    );

