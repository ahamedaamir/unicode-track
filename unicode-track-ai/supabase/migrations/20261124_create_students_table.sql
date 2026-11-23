-- UniCodeTrack AI — Students Table and Security Schema
-- Connected to Supabase Authentication users

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL,
    academic_year SMALLINT CHECK (academic_year BETWEEN 1 AND 4) NOT NULL,
    semester SMALLINT CHECK (semester BETWEEN 1 AND 2) NOT NULL,
    profile_photo_url TEXT,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
    must_change_password BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile
CREATE POLICY "Students can view own profile" 
ON public.students FOR SELECT 
USING (auth.uid() = id);

-- Students can update their own profile and password status
CREATE POLICY "Students can update own profile" 
ON public.students FOR UPDATE 
USING (auth.uid() = id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_students_updated ON public.students;
CREATE TRIGGER on_students_updated
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
