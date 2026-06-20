import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Service-role Supabase client.
 *
 * SECURITY: this client bypasses Row Level Security. It must NEVER be
 * imported from a "use client" component or from any code that ships to
 * the browser. The `import "server-only"` directive above will cause the
 * Next.js bundler to refuse if that ever happens.
 *
 * Currently the only consumer is `/setup`, which uses the Auth Admin API
 * to create the very first administrator user. New consumers should be
 * added very deliberately and reviewed with that in mind.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured — cannot create admin client."
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured — cannot create admin client. " +
        "Add it to .env.local (Supabase Dashboard → Project Settings → API → service_role)."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
