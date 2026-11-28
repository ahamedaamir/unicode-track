import { NextRequest, NextResponse } from "next/server";
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

    // 1. Supabase Authentication with strict password verification
    if (isSupabaseConfigured()) {
      try {
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
