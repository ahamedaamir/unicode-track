import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Health check endpoint for Supabase connection verification
 * GET /api/health/supabase
 */
export async function GET() {
  const configured = isSupabaseConfigured();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "not_configured";
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-supabase-anon-key"));
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("your-supabase-service-role-key"));

  if (!configured) {
    return NextResponse.json({
      status: "unconfigured",
      message: "Supabase credentials are not configured yet in .env.local",
      supabaseConfigured: false,
      hasAnonKey,
      hasServiceKey,
      url: url.startsWith("https://") ? url : "https://your-project-id.supabase.co",
      instruction: "Copy .env.example to .env.local and add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    });
  }

  try {
    const supabase = createClient();
    
    // Quick probe to check connection with timeout
    const { data, error } = await supabase.from("projects").select("id").limit(1);

    if (error) {
      return NextResponse.json({
        status: "connected_with_warning",
        message: "Connected to Supabase endpoint, but table query returned an error. Ensure you ran supabase/full_schema_setup.sql in your Supabase SQL Editor.",
        supabaseConfigured: true,
        error: error.message,
        hint: error.hint || "Make sure tables are created in the public schema.",
        url,
      });
    }

    return NextResponse.json({
      status: "connected",
      message: "Supabase database connected successfully! UniCodeTrack AI tables are accessible.",
      supabaseConfigured: true,
      hasAnonKey,
      hasServiceKey,
      url,
      recordsFound: data ? data.length : 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Supabase database.",
        error: err.message || "Unknown network error",
        supabaseConfigured: true,
        url,
      },
      { status: 500 }
    );
  }
}
