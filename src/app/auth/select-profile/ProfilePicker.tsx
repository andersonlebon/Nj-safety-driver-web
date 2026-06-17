"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectActiveProfile } from "@/app/auth/actions";
import {
  profileDisplayName,
  portalLabel,
  type LoginPortal,
  type ProfileSummary,
} from "@/lib/auth/profile-session";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ProfilePicker({
  profiles,
  redirectTo,
  portal,
}: {
  profiles: ProfileSummary[];
  redirectTo?: string;
  portal?: LoginPortal;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const choose = (profileId: string) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("profile_id", profileId);
      if (redirectTo) formData.set("redirect", redirectTo);
      if (portal) formData.set("portal", portal);

      const result = await selectActiveProfile(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(result.redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}
      {profiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          disabled={pending}
          onClick={() => choose(profile.id)}
          className="w-full rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <span className="block font-medium text-stone-900 dark:text-stone-100">
            {profileDisplayName(profile)}
          </span>
          <span className="text-xs text-stone-500 dark:text-slate-400 capitalize">
            {portalLabel(profile.role as LoginPortal)} profile
          </span>
        </button>
      ))}
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => router.push("/login")}
      >
        Sign out and use another account
      </Button>
    </div>
  );
}
