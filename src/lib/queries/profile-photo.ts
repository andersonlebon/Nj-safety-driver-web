import { signDocumentPaths } from "@/lib/storage-urls";
import {
  LEGACY_PORTRAIT_LABEL,
  PROFILE_PHOTO_DOC_TYPE,
  PROFILE_PHOTO_LABEL,
} from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";

/** Profile picture from `profiles.avatar_path`, with legacy document fallback. */
export async function loadProfilePhotoUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", profileId)
    .maybeSingle();

  if (profile?.avatar_path) {
    const signed = await signDocumentPaths([profile.avatar_path]);
    return signed[profile.avatar_path] ?? null;
  }

  const { data: rows } = await supabase
    .from("documents")
    .select("file_path, label")
    .eq("owner_id", profileId)
    .is("vehicle_id", null)
    .eq("doc_type", PROFILE_PHOTO_DOC_TYPE)
    .in("label", [PROFILE_PHOTO_LABEL, LEGACY_PORTRAIT_LABEL])
    .order("uploaded_at", { ascending: false });

  const preferred =
    rows?.find((row) => row.label === PROFILE_PHOTO_LABEL) ?? rows?.[0];
  const filePath = preferred?.file_path;
  if (!filePath) return null;

  const signed = await signDocumentPaths([filePath]);
  return signed[filePath] ?? null;
}

/** @deprecated Use loadProfilePhotoUrl */
export const loadProfilePortraitUrl = loadProfilePhotoUrl;
