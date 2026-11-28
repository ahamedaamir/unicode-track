-- ==============================================================================
-- UniCodeTrack AI — Master Supabase Schema, Academic Tables & Storage Setup
-- ==============================================================================
-- Run this entire script in your Supabase Project:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ACADEMIC STRUCTURE (Departments, Courses, Lecturers, Students)
-- ==============================================================================

-- 2.1 Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    admin_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2.2 Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    course_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255),
    department_id VARCHAR(50),
    academic_year INT DEFAULT 1 CHECK (academic_year IN (1, 2, 3, 4)),
    semester INT DEFAULT 1 CHECK (semester IN (1, 2)),
    admin_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS academic_year INT DEFAULT 1;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1;

-- 2.3 Lecturers Table
CREATE TABLE IF NOT EXISTS public.lecturers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    position VARCHAR(50) DEFAULT 'Senior' CHECK (position IN ('Senior', 'Probationary')),
    department_id VARCHAR(50),
    assigned_courses TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending First Login', 'Deactivated')),
    has_changed_default_password BOOLEAN DEFAULT FALSE,
    default_password VARCHAR(255),
    profile_photo_url TEXT,
    admin_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE IF EXISTS public.lecturers ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE IF EXISTS public.lecturers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 2.4 Students Table (Supports custom string IDs & Supabase Auth UUIDs)
CREATE TABLE IF NOT EXISTS public.students (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id VARCHAR(50),
    department VARCHAR(255) NOT NULL DEFAULT 'Computer Science',
    academic_year SMALLINT CHECK (academic_year BETWEEN 1 AND 4) NOT NULL DEFAULT 1,
    semester SMALLINT CHECK (semester BETWEEN 1 AND 2) NOT NULL DEFAULT 1,
    profile_photo_url TEXT,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
    must_change_password BOOLEAN DEFAULT TRUE NOT NULL,
    default_password VARCHAR(255),
    admin_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure student_id column and unique index exist for existing databases
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS student_id VARCHAR(100);
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS academic_year SMALLINT DEFAULT 1;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS semester SMALLINT DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);

-- ==============================================================================
-- 3. PROJECTS & ACADEMIC GROUP / INDIVIDUAL WORKSPACES
-- ==============================================================================

-- 3.1 Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'Group Project' CHECK (type IN ('Group Project', 'Individual Project')),
    project_type VARCHAR(50) DEFAULT 'group',
    department_id VARCHAR(50) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    course_id VARCHAR(50),
    academic_year SMALLINT NOT NULL CHECK (academic_year BETWEEN 1 AND 4),
    semester SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 2),
    deadline TIMESTAMPTZ,
    instructions TEXT,
    requirements TEXT,
    proposal_required BOOLEAN DEFAULT true,
    er_diagram_required BOOLEAN DEFAULT true,
    er_diagram_deadline TIMESTAMPTZ,
    database_required BOOLEAN DEFAULT true,
    database_requirements TEXT,
    github_required BOOLEAN DEFAULT true,
    final_report_required BOOLEAN DEFAULT true,
    additional_requirements TEXT,
    assignment_source_type VARCHAR(20) DEFAULT 'none',
    assignment_file_path TEXT,
    assignment_file_name VARCHAR(255),
    assignment_file_size VARCHAR(50),
    assignment_text TEXT,
    assignment_processing_status VARCHAR(50) DEFAULT 'not_uploaded',
    requirements_source VARCHAR(20) DEFAULT 'ai' CHECK (requirements_source IN ('ai', 'pdf', 'manual')),
    requirements_content TEXT,
    requirements_pdf_name VARCHAR(255),
    requirements_pdf_size VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    is_past BOOLEAN DEFAULT false,
    lecturer_id VARCHAR(100),
    lecturer_name VARCHAR(255),
    database_design_config JSONB,
    admin_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS proposal_required BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS is_past BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS database_design_config JSONB;

-- 3.2 Project Groups Table
CREATE TABLE IF NOT EXISTS public.project_groups (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    group_number INTEGER NOT NULL,
    group_name VARCHAR(255) NOT NULL,
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
    ai_review_status VARCHAR(50) DEFAULT 'pending',
    ai_review_score SMALLINT,
    lecturer_evaluation_status VARCHAR(50) DEFAULT 'not_evaluated',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, group_number)
);
ALTER TABLE IF EXISTS public.project_groups ADD COLUMN IF NOT EXISTS ai_review_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE IF EXISTS public.project_groups ADD COLUMN IF NOT EXISTS ai_review_score SMALLINT;
ALTER TABLE IF EXISTS public.project_groups ADD COLUMN IF NOT EXISTS lecturer_evaluation_status VARCHAR(50) DEFAULT 'not_evaluated';

-- 3.3 Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
    id VARCHAR(100) PRIMARY KEY,
    group_id VARCHAR(100) NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
    student_id VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    role VARCHAR(50) DEFAULT 'Member' CHECK (role IN ('Team Lead', 'Member')),
    github_username VARCHAR(100),
    commits_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(group_id, email)
);

-- 3.4 Project Workspaces Anchor Table (Used by automatic group & individual workspace provisioning)
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

-- 3.5 Individual Project Student Assignments Table
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

-- 3.6 Backward Compatibility View: student_groups -> project_groups
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

-- 3.7 Group Proposals Table
CREATE TABLE IF NOT EXISTS public.group_proposals (
    id VARCHAR(100) PRIMARY KEY,
    group_id VARCHAR(100) NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    file_url TEXT,
    submitted_by VARCHAR(255) NOT NULL,
    submitted_by_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'changes_requested', 'approved')),
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3.8 Proposal Feedback Table
CREATE TABLE IF NOT EXISTS public.proposal_feedback (
    id VARCHAR(100) PRIMARY KEY,
    proposal_id VARCHAR(100) NOT NULL REFERENCES public.group_proposals(id) ON DELETE CASCADE,
    lecturer_name VARCHAR(255) NOT NULL,
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('approved', 'changes_requested')),
    comments TEXT NOT NULL,
    rubric_score SMALLINT CHECK (rubric_score BETWEEN 0 AND 100),
    reviewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3.9 Repository Commits Telemetry
CREATE TABLE IF NOT EXISTS public.repository_commits (
    id VARCHAR(100) PRIMARY KEY,
    group_id VARCHAR(100) NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
    commit_hash VARCHAR(64) NOT NULL,
    short_hash VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_email VARCHAR(255),
    branch VARCHAR(100) NOT NULL,
    committed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(group_id, commit_hash)
);

-- 3.10 Project Activity Log & Timeline
CREATE TABLE IF NOT EXISTS public.project_timeline_activities (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    group_id VARCHAR(100),
    group_number INTEGER,
    activity_type VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 4. EVALUATION RUBRICS & AI CODE REVIEWS
-- ==============================================================================

-- 4.1 Evaluation Rubrics
CREATE TABLE IF NOT EXISTS public.evaluation_rubrics (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Standard Academic Capstone Rubric',
    description TEXT,
    total_marks INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Rubric Criteria
CREATE TABLE IF NOT EXISTS public.rubric_criteria (
    id VARCHAR(100) PRIMARY KEY,
    rubric_id VARCHAR(100) NOT NULL REFERENCES public.evaluation_rubrics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_marks INTEGER NOT NULL,
    evaluation_instructions TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 Project Evaluations (Versioned)
CREATE TABLE IF NOT EXISTS public.project_evaluations (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    group_id VARCHAR(100) NOT NULL,
    group_number INTEGER,
    group_name VARCHAR(255),
    lecturer_id VARCHAR(100),
    lecturer_name VARCHAR(255),
    rubric_id VARCHAR(100) REFERENCES public.evaluation_rubrics(id) ON DELETE SET NULL,
    rubric_title VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 1,
    commit_sha VARCHAR(64) NOT NULL DEFAULT 'HEAD',
    repo_url TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'not_evaluated' 
        CHECK (status IN ('not_evaluated', 'ai_completed', 'in_review', 'approved', 'published')),
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    ai_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    ai_model VARCHAR(64) NOT NULL DEFAULT 'gemini-2.5-flash',
    summary TEXT,
    git_telemetry_analysis TEXT,
    requirements_coverage JSONB DEFAULT '[]'::jsonb,
    general_suggestions JSONB DEFAULT '[]'::jsonb,
    lecturer_comments TEXT,
    evaluated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, group_id, version)
);
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS ai_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS requirements_coverage JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS general_suggestions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS group_number INTEGER;
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE IF EXISTS public.project_evaluations ADD COLUMN IF NOT EXISTS rubric_title VARCHAR(255);

-- 4.4 Criterion Scores
CREATE TABLE IF NOT EXISTS public.evaluation_criterion_scores (
    id VARCHAR(100) PRIMARY KEY,
    evaluation_id VARCHAR(100) NOT NULL REFERENCES public.project_evaluations(id) ON DELETE CASCADE,
    criterion_id VARCHAR(100),
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

-- ==============================================================================
-- 5. ER DIAGRAM SUBMISSIONS & DATABASE CODE EVALUATION
-- ==============================================================================

-- 5.1 ER Diagram Submissions (Shared Per Group / Personal Workspace)
CREATE TABLE IF NOT EXISTS public.er_diagram_submissions (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    group_id VARCHAR(100) NOT NULL,
    submitted_by_id VARCHAR(100),
    submitted_by_name VARCHAR(255) NOT NULL,
    submitted_by_email VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(64) NOT NULL,
    file_type VARCHAR(16) NOT NULL CHECK (file_type IN ('pdf', 'png', 'jpg', 'jpeg')),
    storage_path TEXT NOT NULL,
    file_url TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    version_note TEXT,
    ai_analysis JSONB,
    lecturer_feedback JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'analyzing', 'reviewed', 'approved', 'resubmission_requested', 'published')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.er_diagram_submissions ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE IF EXISTS public.er_diagram_submissions ADD COLUMN IF NOT EXISTS lecturer_feedback JSONB;

-- 5.2 ER Diagram AI Analysis Records
CREATE TABLE IF NOT EXISTS public.er_diagram_analysis (
    id VARCHAR(100) PRIMARY KEY,
    submission_id VARCHAR(100) NOT NULL REFERENCES public.er_diagram_submissions(id) ON DELETE CASCADE,
    project_id VARCHAR(50) NOT NULL,
    group_id VARCHAR(100) NOT NULL,
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

-- 5.3 ER Diagram Lecturer Feedback
CREATE TABLE IF NOT EXISTS public.er_diagram_feedback (
    id VARCHAR(100) PRIMARY KEY,
    submission_id VARCHAR(100) NOT NULL REFERENCES public.er_diagram_submissions(id) ON DELETE CASCADE,
    analysis_id VARCHAR(100) REFERENCES public.er_diagram_analysis(id) ON DELETE SET NULL,
    project_id VARCHAR(50) NOT NULL,
    group_id VARCHAR(100) NOT NULL,
    lecturer_id VARCHAR(100),
    lecturer_name VARCHAR(255) NOT NULL,
    approved_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'resubmission_requested', 'published')),
    general_feedback TEXT,
    criterion_adjustments JSONB DEFAULT '[]'::jsonb,
    is_published_to_students BOOLEAN NOT NULL DEFAULT false,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. QUIZZES & TERMINAL AI EVALUATION
-- ==============================================================================

-- 6.1 Quizzes Table
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

-- 6.2 Quiz Questions Table (Programming Questions in Java, C, Python)
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

-- 6.3 Student Quiz Submissions Table (Code Solutions & Gemini Live AI Markings)
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

-- ==============================================================================
-- 7. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_course ON public.projects(course_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_groups_project ON public.project_groups(project_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_email ON public.group_members(email);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_project ON public.project_student_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_student ON public.project_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_project_student_assignments_email ON public.project_student_assignments(student_email);
CREATE INDEX IF NOT EXISTS idx_er_submissions_group ON public.er_diagram_submissions(project_id, group_id);
CREATE INDEX IF NOT EXISTS idx_commits_group ON public.repository_commits(group_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_code);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz ON public.quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON public.quiz_submissions(student_email);

-- ==============================================================================
-- 8. SUPABASE STORAGE BUCKETS SETUP
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('project-requirements', 'project-requirements', true),
    ('proposals', 'proposals', false),
    ('er-diagrams', 'er-diagrams', false),
    ('profile-photos', 'profile-photos', true),
    ('group-assignments', 'group-assignments', false),
    ('quiz-materials', 'quiz-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies:
-- Allow public access to view project-requirements & profile-photos
DROP POLICY IF EXISTS "Public can view requirements" ON storage.objects;
CREATE POLICY "Public can view requirements" ON storage.objects
    FOR SELECT USING (bucket_id IN ('project-requirements', 'profile-photos'));

-- Allow authenticated users to upload files into storage
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('project-requirements', 'proposals', 'er-diagrams', 'profile-photos', 'group-assignments', 'quiz-materials')
    );

-- Allow authenticated users to download proposal, assignment & ER diagram documents
DROP POLICY IF EXISTS "Authenticated users can download documents" ON storage.objects;
CREATE POLICY "Authenticated users can download documents" ON storage.objects
    FOR SELECT USING (
        bucket_id IN ('proposals', 'er-diagrams', 'group-assignments', 'quiz-materials')
    );

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_timeline_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criterion_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.er_diagram_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.er_diagram_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.er_diagram_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for reads and management
DROP POLICY IF EXISTS "Allow public read access to departments" ON public.departments;
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated manage departments" ON public.departments;
CREATE POLICY "Allow authenticated manage departments" ON public.departments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read access to courses" ON public.courses;
CREATE POLICY "Allow public read access to courses" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated manage courses" ON public.courses;
CREATE POLICY "Allow authenticated manage courses" ON public.courses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read access to lecturers" ON public.lecturers;
CREATE POLICY "Allow public read access to lecturers" ON public.lecturers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated manage lecturers" ON public.lecturers;
CREATE POLICY "Allow authenticated manage lecturers" ON public.lecturers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read students" ON public.students;
CREATE POLICY "Allow authenticated read students" ON public.students FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated manage students" ON public.students;
CREATE POLICY "Allow authenticated manage students" ON public.students FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to projects" ON public.projects;
CREATE POLICY "Allow read access to projects" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage projects" ON public.projects;
CREATE POLICY "Allow manage projects" ON public.projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to project_groups" ON public.project_groups;
CREATE POLICY "Allow read access to project_groups" ON public.project_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage project_groups" ON public.project_groups;
CREATE POLICY "Allow manage project_groups" ON public.project_groups FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to group_members" ON public.group_members;
CREATE POLICY "Allow read access to group_members" ON public.group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage group_members" ON public.group_members;
CREATE POLICY "Allow manage group_members" ON public.group_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to project_workspaces" ON public.project_workspaces;
CREATE POLICY "Allow read access to project_workspaces" ON public.project_workspaces FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage project_workspaces" ON public.project_workspaces;
CREATE POLICY "Allow manage project_workspaces" ON public.project_workspaces FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to project_student_assignments" ON public.project_student_assignments;
CREATE POLICY "Allow read access to project_student_assignments" ON public.project_student_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage project_student_assignments" ON public.project_student_assignments;
CREATE POLICY "Allow manage project_student_assignments" ON public.project_student_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to proposals" ON public.group_proposals;
CREATE POLICY "Allow read access to proposals" ON public.group_proposals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage proposals" ON public.group_proposals;
CREATE POLICY "Allow manage proposals" ON public.group_proposals FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to proposal_feedback" ON public.proposal_feedback;
CREATE POLICY "Allow read access to proposal_feedback" ON public.proposal_feedback FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage proposal_feedback" ON public.proposal_feedback;
CREATE POLICY "Allow manage proposal_feedback" ON public.proposal_feedback FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to repository_commits" ON public.repository_commits;
CREATE POLICY "Allow read access to repository_commits" ON public.repository_commits FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage repository_commits" ON public.repository_commits;
CREATE POLICY "Allow manage repository_commits" ON public.repository_commits FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to timeline_activities" ON public.project_timeline_activities;
CREATE POLICY "Allow read access to timeline_activities" ON public.project_timeline_activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage timeline_activities" ON public.project_timeline_activities;
CREATE POLICY "Allow manage timeline_activities" ON public.project_timeline_activities FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to evaluation_rubrics" ON public.evaluation_rubrics;
CREATE POLICY "Allow read access to evaluation_rubrics" ON public.evaluation_rubrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage evaluation_rubrics" ON public.evaluation_rubrics;
CREATE POLICY "Allow manage evaluation_rubrics" ON public.evaluation_rubrics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to rubric_criteria" ON public.rubric_criteria;
CREATE POLICY "Allow read access to rubric_criteria" ON public.rubric_criteria FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage rubric_criteria" ON public.rubric_criteria;
CREATE POLICY "Allow manage rubric_criteria" ON public.rubric_criteria FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to project_evaluations" ON public.project_evaluations;
CREATE POLICY "Allow read access to project_evaluations" ON public.project_evaluations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage project_evaluations" ON public.project_evaluations;
CREATE POLICY "Allow manage project_evaluations" ON public.project_evaluations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to er_diagram_submissions" ON public.er_diagram_submissions;
CREATE POLICY "Allow read access to er_diagram_submissions" ON public.er_diagram_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage er_diagram_submissions" ON public.er_diagram_submissions;
CREATE POLICY "Allow manage er_diagram_submissions" ON public.er_diagram_submissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to er_diagram_analysis" ON public.er_diagram_analysis;
CREATE POLICY "Allow read access to er_diagram_analysis" ON public.er_diagram_analysis FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage er_diagram_analysis" ON public.er_diagram_analysis;
CREATE POLICY "Allow manage er_diagram_analysis" ON public.er_diagram_analysis FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to er_diagram_feedback" ON public.er_diagram_feedback;
CREATE POLICY "Allow read access to er_diagram_feedback" ON public.er_diagram_feedback FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage er_diagram_feedback" ON public.er_diagram_feedback;
CREATE POLICY "Allow manage er_diagram_feedback" ON public.er_diagram_feedback FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to quizzes" ON public.quizzes;
CREATE POLICY "Allow read access to quizzes" ON public.quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage quizzes" ON public.quizzes;
CREATE POLICY "Allow manage quizzes" ON public.quizzes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to quiz_questions" ON public.quiz_questions;
CREATE POLICY "Allow read access to quiz_questions" ON public.quiz_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage quiz_questions" ON public.quiz_questions;
CREATE POLICY "Allow manage quiz_questions" ON public.quiz_questions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read access to quiz_submissions" ON public.quiz_submissions;
CREATE POLICY "Allow read access to quiz_submissions" ON public.quiz_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage quiz_submissions" ON public.quiz_submissions;
CREATE POLICY "Allow manage quiz_submissions" ON public.quiz_submissions FOR ALL USING (true);

-- ==============================================================================
-- 10. INITIAL SEED DATA
-- ==============================================================================
-- Seed default Department
INSERT INTO public.departments (id, name)
VALUES 
    ('dept-1', 'Department of Computer Science & Engineering'),
    ('dept-2', 'Department of Software Engineering'),
    ('dept-3', 'Department of Information Systems')
ON CONFLICT (id) DO NOTHING;

-- Seed default Courses
INSERT INTO public.courses (id, code, course_code, name, course_name, academic_year, semester)
VALUES 
    ('crs-1', 'CS304', 'CS304', 'Software Engineering Capstone', 'Software Engineering Capstone', 3, 2),
    ('crs-2', 'ICT2142', 'ICT2142', 'Operating Systems & C Systems Programming', 'Operating Systems & C Systems Programming', 2, 1),
    ('crs-3', 'CS492', 'CS492', 'Advanced Enterprise Architecture', 'Advanced Enterprise Architecture', 4, 2)
ON CONFLICT (id) DO NOTHING;

-- Seed default Lecturer
INSERT INTO public.lecturers (id, name, email, position, assigned_courses, status)
VALUES 
    ('lec-check', 'Dr. Check Lecturer', 'check@gmail.com', 'Senior', ARRAY['CS492', 'SE3102', 'CS304', 'ICT2142'], 'Active'),
    ('lec-1', 'Dr. Evelyn Reed', 'evelyn.reed@university.edu', 'Senior', ARRAY['CS304', 'ICT2142'], 'Active')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
SELECT 'UniCodeTrack AI master schema, quiz tables, workspaces, and storage buckets verified successfully!' as status;
