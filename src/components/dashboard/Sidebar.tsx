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
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-slate-200">
      <div className="px-5 py-5 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              NJ Safety Driver
            </p>
            <p className="text-xs text-slate-500">{workspaceLabel}</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-800"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center",
                  isActive ? "text-brand-700" : "text-slate-500"
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
