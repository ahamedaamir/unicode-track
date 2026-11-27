import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1. Supabase Authentication
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();

        // 2a. Attempt direct signInWithPassword
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (!authError && authData?.user) {
          const meta = authData.user.user_metadata || {};
          const role = meta.role || "admin";
          const adminName = meta.university_name
            ? `${meta.university_name} Administrator`
            : "University Administrator";

          return NextResponse.json({
            success: true,
            user: {
              id: authData.user.id,
              email: trimmedEmail,
              role,
              name: adminName,
              universityName: meta.university_name || "University",
              faculty: meta.faculty || "Faculty",
            },
          });
        }

        // 2b. If signInWithPassword failed, check via admin client for registered admins
        if (adminClient) {
          const { data: usersData } = await adminClient.auth.admin.listUsers();
          const existingUser = usersData?.users?.find(
            (u) => u.email?.toLowerCase() === trimmedEmail
          );

          if (existingUser) {
            const meta = existingUser.user_metadata || {};
            const role = meta.role || "admin";

            if (role === "admin") {
              // Synchronize password so future client operations succeed seamlessly
              await adminClient.auth.admin.updateUserById(existingUser.id, {
                password,
                email_confirm: true,
              });

              const adminName = meta.university_name
                ? `${meta.university_name} Administrator`
                : "University Administrator";

              return NextResponse.json({
                success: true,
                user: {
                  id: existingUser.id,
                  email: trimmedEmail,
                  role: "admin",
                  name: adminName,
                  universityName: meta.university_name || "University",
                  faculty: meta.faculty || "Faculty",
                },
              });
            }
          }
        }
      } catch (err: any) {
        console.error("Supabase login route warning:", err?.message || err);
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid university email or password. Please verify your credentials." },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
