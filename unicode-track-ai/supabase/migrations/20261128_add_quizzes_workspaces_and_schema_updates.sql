-- ==============================================================================
-- UniCodeTrack AI — Migration: Quizzes, Student Workspaces, and Column Alignment
-- File: 20261128_add_quizzes_workspaces_and_schema_updates.sql
-- ==============================================================================

-- 1. Ensure columns exist on core academic tables
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS academic_year INT DEFAULT 1;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1;

ALTER TABLE IF EXISTS public.lecturers ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE IF EXISTS public.lecturers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS student_id VARCHAR(100);
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS academic_year SMALLINT DEFAULT 1;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS semester SMALLINT DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);

-- 2. Projects & Groups columns
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS proposal_required BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS is_past BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS database_design_config JSONB;

ALTER TABLE IF EXISTS public.project_groups ADD COLUMN IF NOT EXISTS ai_review_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE IF EXISTS public.project_groups ADD COLUMN IF NOT EXISTS ai_review_score SMALLINT;
ALTER TABLE IF EXISTS public.project_groups ADD COLUMN IF NOT EXISTS lecturer_evaluation_status VARCHAR(50) DEFAULT 'not_evaluated';

-- 3. Project Workspaces Anchor Table
CREATE TABLE IF NOT EXISTS public.project_workspaces (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    group_id VARCHAR(100),
    group_number INTEGER,
    workspace_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Individual Project Student Assignments Table
CREATE TABLE IF NOT EXISTS public.project_student_assignments (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id VARCHAR(100) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    department_id VARCHAR(50),
    academic_year SMALLINT DEFAULT 1 CHECK (academic_year BETWEEN 1 AND 4),
    semester SMALLINT DEFAULT 1 CHECK (semester BETWEEN 1 AND 2),
    workspace_id VARCHAR(100) NOT NULL,
    repo_url TEXT,
    repo_name VARCHAR(255),
    repo_owner VARCHAR(255),
    default_branch VARCHAR(100) DEFAULT 'main',
    repo_status VARCHAR(50) DEFAULT 'disconnected' CHECK (repo_status IN ('disconnected', 'connected', 'syncing', 'error')),
    last_sync_at TIMESTAMPTZ,
    total_commits INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    progress SMALLINT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    proposal_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (proposal_status IN ('not_submitted', 'submitted', 'under_review', 'changes_requested', 'approved')),
    evaluation_score SMALLINT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, student_email)
);

-- 5. Backward Compatibility View: student_groups -> project_groups
CREATE OR REPLACE VIEW public.student_groups AS
SELECT 
    id,
    project_id,
    group_number,
    group_name,
    workspace_id,
    repo_url,
    repo_status,
    proposal_status,
    evaluation_score,
    created_at,
    updated_at
FROM public.project_groups;

-- 6. Evaluations and ER Submissions Columns
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS ai_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS requirements_coverage JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS general_suggestions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS group_number INTEGER;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS rubric_title VARCHAR(255);

ALTER TABLE IF EXISTS public.er_diagram_submissions ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE IF EXISTS public.er_diagram_submissions ADD COLUMN IF NOT EXISTS lecturer_feedback JSONB;

-- 7. Quizzes and AI Terminal Evaluation Tables
CREATE TABLE IF NOT EXISTS public.quizzes (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255),
    course_code VARCHAR(50),
    evaluation_requirements TEXT,
    duration_minutes INTEGER DEFAULT 30,
    mode VARCHAR(20) DEFAULT 'total' CHECK (mode IN ('total', 'each')),
    start_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
    admin_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id VARCHAR(100) PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    language VARCHAR(20) NOT NULL CHECK (language IN ('c', 'python', 'java')),
    max_marks INTEGER NOT NULL DEFAULT 20,
    starter_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id VARCHAR(100) PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id VARCHAR(100) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    auto_submitted BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER,
    answers JSONB DEFAULT '[]'::jsonb,
    evaluation JSONB,
    total_score NUMERIC(5,2),
    max_score NUMERIC(5,2),
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(quiz_id, student_email)
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_project ON public.project_student_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_student ON public.project_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_email ON public.project_student_assignments(student_email);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_code);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz ON public.quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON public.quiz_submissions(student_email);

-- 9. Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('project-requirements', 'project-requirements', true),
    ('proposals', 'proposals', false),
    ('er-diagrams', 'er-diagrams', false),
    ('profile-photos', 'profile-photos', true),
    ('group-assignments', 'group-assignments', false),
    ('quiz-materials', 'quiz-materials', false)
ON CONFLICT (id) DO NOTHING;

-- 10. Enable RLS
ALTER TABLE public.project_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to project_workspaces" ON public.project_workspaces FOR SELECT USING (true);
CREATE POLICY "Allow manage project_workspaces" ON public.project_workspaces FOR ALL USING (true);

CREATE POLICY "Allow read access to project_student_assignments" ON public.project_student_assignments FOR SELECT USING (true);
CREATE POLICY "Allow manage project_student_assignments" ON public.project_student_assignments FOR ALL USING (true);

CREATE POLICY "Allow read access to quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Allow manage quizzes" ON public.quizzes FOR ALL USING (true);

CREATE POLICY "Allow read access to quiz_questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow manage quiz_questions" ON public.quiz_questions FOR ALL USING (true);

CREATE POLICY "Allow read access to quiz_submissions" ON public.quiz_submissions FOR SELECT USING (true);
CREATE POLICY "Allow manage quiz_submissions" ON public.quiz_submissions FOR ALL USING (true);
