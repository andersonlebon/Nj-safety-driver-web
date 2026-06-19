"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectActiveRole } from "@/app/auth/actions";
import type { Database, UserRole } from "@/lib/types/database";
import { Car, Shield, ShieldCheck } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const ROLE_CONFIG: Record<UserRole, { label: string; description: string; icon: typeof Car }> = {
  driver: {
    label: "Driver",
    description: "Manage your vehicle, documents, and infractions",
    icon: Car,
  },
  agent: {
    label: "Field Agent",
    description: "Issue infractions and manage driver compliance",
    icon: Shield,
  },
  admin: {
    label: "Administrator",
    description: "Manage drivers, agents, and platform settings",
    icon: ShieldCheck,
  },
};

type Props = {
  role: UserRole;
  profile: Profile;
  redirectTo?: string;
};

export function RoleCard({ role, profile, redirectTo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  const handleSelect = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.set("role", role);
    if (redirectTo) fd.set("redirect", redirectTo);
    const result = await selectActiveRole(fd);
    if (result.ok) {
      router.replace(result.redirectTo);
      router.refresh();
    } else {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSelect}
      disabled={loading}
      className="w-full text-left rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-stone-900 dark:text-stone-100">{config.label}</p>
          <p className="text-sm text-stone-500 dark:text-slate-400">{config.description}</p>
        </div>
        {loading && (
          <svg className="ml-auto h-4 w-4 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>
    </button>
  );
}
