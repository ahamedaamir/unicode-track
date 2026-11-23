-- UniCodeTrack AI — Academic Project Groups, Shared Workspaces, and Code Review Schema
-- Configured for Supabase PostgreSQL with Row Level Security (RLS)

-- 1. Project Groups Table
CREATE TABLE IF NOT EXISTS public.project_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) NOT NULL,
    group_number INTEGER NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    workspace_id UUID DEFAULT gen_random_uuid() NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, group_number)
);

-- 2. Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
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

-- 3. Group Proposals Table
CREATE TABLE IF NOT EXISTS public.group_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
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

-- 4. Proposal Lecturer Feedback Table
CREATE TABLE IF NOT EXISTS public.proposal_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.group_proposals(id) ON DELETE CASCADE,
    lecturer_name VARCHAR(255) NOT NULL,
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('approved', 'changes_requested')),
    comments TEXT NOT NULL,
    rubric_score SMALLINT CHECK (rubric_score BETWEEN 0 AND 100),
    reviewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Repository Commits Table
CREATE TABLE IF NOT EXISTS public.repository_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
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

-- 6. Project Timeline Activities Table
CREATE TABLE IF NOT EXISTS public.project_timeline_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) NOT NULL,
    group_id UUID REFERENCES public.project_groups(id) ON DELETE CASCADE,
    group_number INTEGER,
    activity_type VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('student', 'lecturer', 'system')),
    action_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_timeline_activities ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_groups_project_id ON public.project_groups(project_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_email ON public.group_members(email);
CREATE INDEX IF NOT EXISTS idx_group_proposals_group_id ON public.group_proposals(group_id);
CREATE INDEX IF NOT EXISTS idx_repository_commits_group_id ON public.repository_commits(group_id);
CREATE INDEX IF NOT EXISTS idx_timeline_project_id ON public.project_timeline_activities(project_id);

-- RLS Policies
-- Students can view only their own assigned group
CREATE POLICY "Students can view assigned group"
ON public.project_groups FOR SELECT
USING (
    id IN (
        SELECT group_id FROM public.group_members 
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- Students can view members of their own group
CREATE POLICY "Students can view own group members"
ON public.group_members FOR SELECT
USING (
    group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- Students can view and insert proposals for their own group
CREATE POLICY "Students can view own group proposals"
ON public.group_proposals FOR SELECT
USING (
    group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE email = auth.jwt() ->> 'email'
    )
);

CREATE POLICY "Students can insert proposals for own group"
ON public.group_proposals FOR INSERT
WITH CHECK (
    group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE email = auth.jwt() ->> 'email'
    )
);

