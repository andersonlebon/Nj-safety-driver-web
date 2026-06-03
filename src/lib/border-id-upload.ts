import type { SupabaseClient } from "@supabase/supabase-js";
import { friendlyError } from "@/lib/errors";
import {
  TRANSIT_ID_LABEL_BACK,
  TRANSIT_ID_LABEL_FRONT,
} from "@/lib/transit-id-documents";

export async function uploadTransitIdPhoto(
  supabase: SupabaseClient,
  agentId: string,
  side: "front" | "back",
  file: File
): Promise<{ ok: true; path: string; fileName: string } | { ok: false; error: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const label = side === "front" ? TRANSIT_ID_LABEL_FRONT : TRANSIT_ID_LABEL_BACK;
  const path = `${agentId}/transit/passport-${label}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, path, fileName: file.name };
}

export async function removeTransitIdPaths(
  supabase: SupabaseClient,
  paths: string[]
): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;
  await supabase.storage.from("documents").remove(unique);
}
