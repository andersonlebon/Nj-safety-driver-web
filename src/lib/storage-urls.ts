import { createClient } from "@/lib/supabase/server";

/** Batch-sign storage paths in the documents bucket (server-only). */
export async function signDocumentPaths(
  paths: string[],
  expiresIn = 3600
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const unique = [...new Set(paths.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (path) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, expiresIn);
      return [path, data?.signedUrl ?? ""] as const;
    })
  );
  return Object.fromEntries(entries);
}
