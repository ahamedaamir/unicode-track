-- ==============================================================================
-- Multi-Tenancy & User Hierarchy Linking:
-- University Faculty (Admin) -> Lecturers, Students, Courses, Departments
-- ==============================================================================

-- 1. Add admin_email column to Departments
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_departments_admin_email ON public.departments(admin_email);

-- 2. Add admin_email column to Courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_courses_admin_email ON public.courses(admin_email);

-- 3. Add admin_email column to Lecturers
ALTER TABLE public.lecturers ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_lecturers_admin_email ON public.lecturers(admin_email);

-- 4. Add admin_email column to Students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_students_admin_email ON public.students(admin_email);

-- 5. Add admin_email column to Projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_projects_admin_email ON public.projects(admin_email);

-- Backfill legacy records to default admin if null
UPDATE public.departments SET admin_email = 'admin@university.edu' WHERE admin_email IS NULL;
UPDATE public.courses SET admin_email = 'admin@university.edu' WHERE admin_email IS NULL;
UPDATE public.lecturers SET admin_email = 'admin@university.edu' WHERE admin_email IS NULL;
UPDATE public.students SET admin_email = 'admin@university.edu' WHERE admin_email IS NULL;
UPDATE public.projects SET admin_email = 'admin@university.edu' WHERE admin_email IS NULL;
