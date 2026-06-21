"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { getProfilesForUser } from "@/lib/auth/profiles";
import { friendlyError } from "@/lib/errors";
import { sha256File } from "@/lib/file-hash";
import {
  PROFILE_PHOTO_DOC_TYPE,
  PROFILE_PHOTO_LABEL,
  PROFILE_PHOTO_LABELS,
  extensionForImageFile,
  profilePhotoStoragePath,
} from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_EVIDENCE_BYTES,
} from "@/lib/upload-limits";

export type ProfilePhotoActionResult = { ok: true } | { ok: false; error: string };

async function assertProfileOwnership(
  profileId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Session expired. Please sign in again." };

  const profiles = await getProfilesForUser(user.id);
  if (!profiles.some((profile) => profile.id === profileId)) {
    return { ok: false, error: "You do not have access to this profile." };
  }

  return { ok: true };
}

async function removeExistingProfilePhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", profileId)
    .maybeSingle();

  const paths = new Set<string>();
  if (profile?.avatar_path) paths.add(profile.avatar_path);

  const { data: legacyDocs } = await supabase
    .from("documents")
    .select("id, file_path")
    .eq("owner_id", profileId)
    .is("vehicle_id", null)
    .eq("doc_type", PROFILE_PHOTO_DOC_TYPE)
    .in("label", [...PROFILE_PHOTO_LABELS]);

  for (const row of legacyDocs ?? []) {
    if (row.file_path) paths.add(row.file_path);
  }

  if (paths.size > 0) {
    await supabase.storage.from("documents").remove([...paths]);
  }

  if (legacyDocs?.length) {
    await supabase
      .from("documents")
      .delete()
      .eq("owner_id", profileId)
      .is("vehicle_id", null)
      .eq("doc_type", PROFILE_PHOTO_DOC_TYPE)
      .in("label", [...PROFILE_PHOTO_LABELS]);
  }

  await supabase
    .from("profiles")
    .update({ avatar_path: null, updated_at: new Date().toISOString() })
    .eq("id", profileId);
}

function revalidateProfilePhotoPaths() {
  revalidatePath("/driver", "layout");
  revalidatePath("/driver/profile");
  revalidatePath("/staff", "layout");
  revalidatePath("/staff/account");
}

export async function uploadProfilePhoto(
  formData: FormData
): Promise<ProfilePhotoActionResult> {
  const profileId = String(formData.get("profileId") ?? "").trim();
  const file = formData.get("file");

  if (!profileId) return { ok: false, error: "Profile not found." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo to upload." };
  }
  if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
    return { ok: false, error: "Use a JPG, PNG, WEBP, or HEIC image." };
  }
  if (file.size > MAX_EVIDENCE_BYTES) {
    return { ok: false, error: "Image must be 10 MB or smaller." };
  }

  const ownership = await assertProfileOwnership(profileId);
  if (!ownership.ok) return ownership;

  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Session expired. Please sign in again." };

  const supabase = createClient();
  await removeExistingProfilePhoto(supabase, profileId);

  const extension = extensionForImageFile(file);
  const filePath = profilePhotoStoragePath(user.id, profileId, extension);
  const fileHash = await sha256File(file);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { ok: false, error: friendlyError(uploadError) };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_path: filePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (profileError) {
    await supabase.storage.from("documents").remove([filePath]);
    return { ok: false, error: friendlyError(profileError) };
  }

  // Keep a document row for staff review parity with other profile files.
  const { error: insertError } = await supabase.from("documents").insert({
    owner_id: profileId,
    vehicle_id: null,
    group_id: null,
    doc_type: PROFILE_PHOTO_DOC_TYPE,
    label: PROFILE_PHOTO_LABEL,
    file_path: filePath,
    file_name: file.name,
    file_hash: fileHash,
    verification_status: "active",
  });

  if (insertError) {
    await supabase.storage.from("documents").remove([filePath]);
    await supabase
      .from("profiles")
      .update({ avatar_path: null, updated_at: new Date().toISOString() })
      .eq("id", profileId);
    return { ok: false, error: friendlyError(insertError) };
  }

  revalidateProfilePhotoPaths();
  return { ok: true };
}

export async function removeProfilePhoto(
  profileId: string
): Promise<ProfilePhotoActionResult> {
  if (!profileId) return { ok: false, error: "Profile not found." };

  const ownership = await assertProfileOwnership(profileId);
  if (!ownership.ok) return ownership;

  const supabase = createClient();
  await removeExistingProfilePhoto(supabase, profileId);

  revalidateProfilePhotoPaths();
  return { ok: true };
}
