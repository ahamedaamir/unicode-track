import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with administrative / service_role permissions.
 * WARNING: This client bypasses Row Level Security (RLS) policies.
 * Strictly used in trusted server-side API routes or background synchronization.
 * NEVER expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("placeholder-project") ||
    supabaseUrl.includes("your-project-id")
  ) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
