"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  MAX_EVIDENCE_BYTES,
  PHOTO_ACCEPT,
} from "@/components/uploads/EvidenceSlot";
import {
  removeProfilePhoto,
  uploadProfilePhoto,
} from "@/app/profile-photo/actions";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";

function initialsFromName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ProfilePhotoEditor({
  profileId,
  photoUrl,
  displayName,
  size = "lg",
}: {
  profileId: string;
  photoUrl?: string | null;
  displayName: string;
  size?: "md" | "lg";
}) {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const pending = isUploading || isRemoving;

  const avatarSize =
    size === "lg" ? "h-24 w-24 text-2xl" : "h-16 w-16 text-lg";
  const currentUrl = localPreview || photoUrl;
  const initials = initialsFromName(displayName.trim() || "?");

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError(t("profilePhoto.invalidType"));
      return;
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      setError(t("profilePhoto.tooLarge"));
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);

    const formData = new FormData();
    formData.set("profileId", profileId);
    formData.set("file", file);

    startUpload(async () => {
      const result = await uploadProfilePhoto(formData);
      URL.revokeObjectURL(preview);
      setLocalPreview(null);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  const handleRemove = () => {
    setError(null);
    startRemove(async () => {
      const result = await removeProfilePhoto(profileId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative shrink-0">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className={cn(
              "rounded-full border border-stone-200 object-cover dark:border-slate-700",
              avatarSize
            )}
          />
        ) : (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-100 font-semibold text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-stone-100",
              avatarSize
            )}
            aria-hidden
          >
            {initials}
          </span>
        )}
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <div>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {t("profilePhoto.title")}
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
            {t("profilePhoto.hint")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              handleFileSelected(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            className="gap-2 text-sm"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {currentUrl ? t("profilePhoto.change") : t("profilePhoto.upload")}
          </Button>
          {currentUrl && (
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              className="gap-2 text-sm"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
              {t("profilePhoto.remove")}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
