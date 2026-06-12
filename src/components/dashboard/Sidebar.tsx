"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export function Sidebar({
  items,
  workspaceLabel,
}: {
  items: NavItem[];
  workspaceLabel: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col w-64 glass-panel border-r border-stone-200/80 dark:border-slate-800/80">
      <div className="px-5 py-5 border-b border-stone-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white shadow-sm ring-1 ring-brand-600/20">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tight">
              NJ-Drive
            </p>
            <p className="text-xs text-stone-500 dark:text-slate-400 leading-tight">
              {workspaceLabel}
            </p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300"
                  : "text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-slate-200"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center flex-shrink-0",
                  isActive
                    ? "text-brand-700 dark:text-brand-400"
                    : "text-stone-400 dark:text-slate-500"
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      {/* Gabon flag accent stripe at sidebar bottom */}
      <div className="px-5 py-4 border-t border-stone-200 dark:border-slate-800">
        <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-brand-600/60 via-gold-500/60 to-navy-700/60" />
      </div>
    </aside>
  );
}
