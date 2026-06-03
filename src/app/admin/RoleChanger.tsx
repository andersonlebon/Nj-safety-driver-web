"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import { updateUserRole } from "./actions";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "agent", label: "Agent" },
  { value: "admin", label: "Admin" },
];

/**
 * Single-control role changer.
 *
 * UX choice: a single dropdown that fires `updateUserRole` immediately on
 * change. This keeps the table compact — no extra "Apply" button per row —
 * and matches the table density on the other admin pages.
 *
 * Self-protection: when `isSelf` is true the control is rendered disabled
 * and shows a tooltip explaining why. The server action also re-checks this
 * (defence in depth — never trust the client to enforce its own gate).
 */
export function RoleChanger({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<UserRole>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleChange = (next: UserRole) => {
    if (next === value) return;
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, next);
      if (!result.ok) {
        setError(result.error);
        setValue(previous);
        return;
      }
      router.refresh();
    });
  };

  if (isSelf) {
    return (
      <div className="flex flex-col gap-1">
        <select
          disabled
          value={currentRole}
          title="You can't change your own role."
          className={cn(
            "input h-9 py-1 text-xs w-32 cursor-not-allowed opacity-60"
          )}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} (you)
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className={cn(
          "input h-9 py-1 text-sm w-full max-w-xs",
          pending && "opacity-60 cursor-progress"
        )}
        aria-label="Change role"
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 max-w-[12rem]">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Renders the existing badge styling for a role. Mirrors the pill used on
 * the agents page so the visual vocabulary stays consistent.
 */
export function RoleBadge({ role }: { role: UserRole }) {
  const classes: Record<UserRole, string> = {
    driver: "badge bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300",
    agent: "badge bg-navy-100 text-navy-800 dark:bg-navy-950/40 dark:text-navy-200",
    admin: "badge bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300",
  };
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return <span className={classes[role]}>{label}</span>;
}
