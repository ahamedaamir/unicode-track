import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { universityName, faculty, location, email, password } = body;

    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    let authCreated = false;

    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        if (adminClient) {
          // Attempt to create the user with admin privileges and auto-confirmed email
          const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
            email: trimmedEmail,
            password,
            email_confirm: true,
            user_metadata: {
              role: "admin",
              university_name: universityName || "University",
              faculty: faculty || "Faculty of Computing",
              location: location || "",
            },
          });

          if (!createError && userData?.user) {
            userId = userData.user.id;
            authCreated = true;
          } else if (createError && createError.message.toLowerCase().includes("already")) {
            // If already registered, update their password so they can log in immediately
            const { data: existingUsers } = await adminClient.auth.admin.listUsers();
            const existing = existingUsers?.users?.find(
              (u) => u.email?.toLowerCase() === trimmedEmail
            );
            if (existing) {
              await adminClient.auth.admin.updateUserById(existing.id, {
                password,
                email_confirm: true,
                user_metadata: {
                  role: "admin",
                  university_name: universityName || "University",
                },
              });
              userId = existing.id;
              authCreated = true;
            }
          }
        } else {
          // Fallback to regular signUp
          const supabase = createClient();
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                role: "admin",
                university_name: universityName || "University",
              },
            },
          });
          if (!signUpError && signUpData?.user) {
            userId = signUpData.user.id;
            authCreated = true;
          }
        }
      } catch (err: any) {
        console.error("Supabase admin registration warning:", err?.message || err);
      }
    }

    return NextResponse.json({
      success: true,
      authCreated,
      user: {
        id: userId || `admin-${Date.now()}`,
        email: trimmedEmail,
        role: "admin",
        universityName: universityName || "University",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
