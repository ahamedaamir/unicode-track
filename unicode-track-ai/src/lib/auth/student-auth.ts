import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Student } from "@/types/admin";

export interface StudentAuthResult {
  success: boolean;
  error?: string;
  student?: {
    id: string;
    studentId?: string;
    fullName: string;
    email: string;
    departmentId: string;
    academicYear: number;
    semester: number;
    profilePhotoUrl?: string | null;
    accountStatus: "active" | "inactive";
    mustChangePassword: boolean;
  };
  mustChangePassword?: boolean;
}

/**
 * Validates student credentials through Supabase Auth (or synced store when in local demo).
 */
export async function authenticateStudent(
  email: string,
  password: string,
  fallbackStudents: Student[] = []
): Promise<StudentAuthResult> {
  const trimmedEmail = email.trim().toLowerCase();

  // Basic validation
  if (!trimmedEmail) {
    return { success: false, error: "University email address is required." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { success: false, error: "Please enter a valid university email address." };
  }
  if (!password) {
    return { success: false, error: "Password is required." };
  }

  // 1. Attempt Supabase Auth if credentials are configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!authError && authData?.user) {
        // Query the student profile connected to auth user's UUID
        const { data: profile, error: profileError } = await supabase
          .from("students")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !profile) {
          // Fallback query by email if id is mapped differently
          const { data: profileByEmail } = await supabase
            .from("students")
            .select("*")
            .eq("email", trimmedEmail)
            .single();

          if (profileByEmail) {
            if (profileByEmail.account_status === "inactive") {
              await supabase.auth.signOut();
              return {
                success: false,
                error: "This student account has been deactivated by the university administrator.",
              };
            }

            return {
              success: true,
              mustChangePassword: Boolean(profileByEmail.must_change_password),
              student: {
                id: profileByEmail.id,
                studentId: profileByEmail.student_id,
                fullName: profileByEmail.full_name,
                email: profileByEmail.email,
                departmentId: profileByEmail.department,
                academicYear: profileByEmail.academic_year,
                semester: profileByEmail.semester,
                profilePhotoUrl: profileByEmail.profile_photo_url,
                accountStatus: profileByEmail.account_status,
                mustChangePassword: Boolean(profileByEmail.must_change_password),
                adminEmail: profileByEmail.admin_email || "admin@university.edu",
              } as any,
            };
          }
        } else {
          if (profile.account_status === "inactive") {
            await supabase.auth.signOut();
            return {
              success: false,
              error: "This student account has been deactivated by the university administrator.",
            };
          }

          return {
            success: true,
            mustChangePassword: Boolean(profile.must_change_password),
            student: {
              id: profile.id,
              studentId: profile.student_id,
              fullName: profile.full_name,
              email: profile.email,
              departmentId: profile.department,
              academicYear: profile.academic_year,
              semester: profile.semester,
              profilePhotoUrl: profile.profile_photo_url,
              accountStatus: profile.account_status,
              mustChangePassword: Boolean(profile.must_change_password),
              adminEmail: profile.admin_email || "admin@university.edu",
            } as any,
          };
        }
      }
    } catch {
      // If network fails or Supabase endpoint is unreachable, fallback to verified local store
    }
  }

  // 2. Synchronized database / client-store authentication
  const matchedStudent = fallbackStudents.find(
    (s) => s.email.toLowerCase() === trimmedEmail
  );

  if (!matchedStudent) {
    return {
      success: false,
      error: "No student account found with this email address. Please check your spelling.",
    };
  }

  // Account Status Check
  if (matchedStudent.accountStatus === "inactive") {
    return {
      success: false,
      error: "This student account has been deactivated by the university administrator. Access denied.",
    };
  }

  // Password verification
  const expectedPassword = matchedStudent.defaultPassword || "Student@2026";
  const isMatch = password === expectedPassword;

  if (!isMatch) {
    return {
      success: false,
      error: "Invalid password entered. Please enter the administrator-assigned default password.",
    };
  }

  const mustChange = matchedStudent.mustChangePassword !== false;

  return {
    success: true,
    mustChangePassword: mustChange,
    student: {
      id: matchedStudent.id,
      studentId: matchedStudent.studentId,
      fullName: matchedStudent.fullName,
      email: matchedStudent.email,
      departmentId: matchedStudent.departmentId,
      academicYear: matchedStudent.academicYear,
      semester: matchedStudent.semester,
      profilePhotoUrl: matchedStudent.profilePhotoUrl,
      accountStatus: matchedStudent.accountStatus,
      mustChangePassword: mustChange,
      adminEmail: (matchedStudent as any).adminEmail || "admin@university.edu",
    } as any,
  };
}

/**
 * Updates student password in Supabase Auth and updates student profile must_change_password flag.
 */
export async function updateStudentPassword(
  studentEmail: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      await supabase
        .from("students")
        .update({ must_change_password: false })
        .eq("email", studentEmail.trim().toLowerCase());

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update database password";
      return { success: false, error: message };
    }
  }

  return { success: true };
}

