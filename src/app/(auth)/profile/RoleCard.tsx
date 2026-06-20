"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectActiveProfile } from "@/lib/auth/actions";
import { staffRoleLabel } from "@/lib/auth/profile-session";
import { Car, Shield, ShieldCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileRole, StaffRole } from "@/lib/types/database";

type Props = {
  profileId: string;
  role: ProfileRole;
  staffRole?: StaffRole | null;
  redirectTo?: string;
  isActive?: boolean;
};

function resolveConfig(role: ProfileRole, staffRole?: StaffRole | null) {
  if (role === "driver") {
    return {
      label: "Driver",
      description: "Manage your vehicle, documents, and infractions",
      icon: Car,
    };
  }
  const sr = staffRole ?? "agent";
  return {
    label: staffRoleLabel(sr),
    description:
      sr === "admin"
        ? "Full system access — manage agents, finance, and all drivers"
        : "Issue infractions and approve driver profiles",
    icon: sr === "admin" ? ShieldCheck : Shield,
  };
}

export function ProfileCard({
  profileId,
  role,
  staffRole,
  redirectTo,
  isActive = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = resolveConfig(role, staffRole);
  const Icon = config.icon;

  const handleSelect = async () => {
    setLoading(true);
    setError(null);
    const result = await selectActiveProfile(profileId, redirectTo);
    if (result.ok) {
      router.replace(result.redirectTo);
      router.refresh();
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleSelect}
        disabled={loading}
        className={cn(
          "w-full text-left rounded-xl border p-4 transition-colors disabled:opacity-50",
          isActive
            ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 ring-2 ring-brand-500/25"
            : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/50"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              isActive
                ? "bg-brand-600 text-white"
                : "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-stone-900 dark:text-stone-100">
                {config.label}
              </p>
              {isActive && (
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              {config.description}
            </p>
          </div>
          {loading && (
            <svg
              className="ml-auto h-4 w-4 animate-spin text-stone-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
        </div>
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 px-1">{error}</p>
      )}
    </div>
  );
}

/** Shown when a staff application is pending approval. */
export function PendingStaffCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
        <Clock className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          Field Agent
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Application pending administrator approval
        </p>
      </div>
    </div>
  );
}
