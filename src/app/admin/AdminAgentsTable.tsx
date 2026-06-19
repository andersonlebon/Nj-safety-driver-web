"use client";

import { ShieldCheck } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { formatDate } from "@/lib/utils";
import type { TableQuery } from "@/lib/pagination";
import { RoleBadge, RoleChanger } from "./RoleChanger";
import type { Database, UserRole } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function primaryRole(types: UserRole[] | null | undefined): UserRole {
  const t = types ?? [];
  if (t.includes("admin")) return "admin";
  if (t.includes("agent")) return "agent";
  return "driver";
}

export function AdminAgentsTable({
  pathname,
  query,
  totalCount,
  agents,
  currentUserId,
}: {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  agents: Profile[];
  currentUserId: string;
}) {
  return (
    <PaginatedTableFrame
      pathname={pathname}
      query={query}
      totalCount={totalCount}
      searchPlaceholder="Name, email, phone…"
      showDateFilters
      emptyIcon={<ShieldCheck className="h-8 w-8" />}
      emptyTitle="No agents yet"
      emptyDescription="Approved applications and promoted users appear here."
      unfilteredHint={`${totalCount} staff account${totalCount === 1 ? "" : "s"}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Phone</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Joined</th>
              <th className="py-2 pr-4 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr
                key={agent.id}
                className="border-b border-stone-100 dark:border-slate-800 last:border-0"
              >
                <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                  {agent.full_name || "—"}
                  {agent.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-stone-500 dark:text-slate-400">
                      (you)
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                  {agent.email || "—"}
                </td>
                <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                  {agent.phone || "—"}
                </td>
                <td className="py-2 pr-4">
                  <RoleBadge role={primaryRole(agent.profile_types as UserRole[])} />
                </td>
                <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                  {formatDate(agent.created_at)}
                </td>
                <td className="py-2 pr-4">
                  <RoleChanger
                    userId={agent.id}
                    currentRole={primaryRole(agent.profile_types as UserRole[])}
                    isSelf={agent.id === currentUserId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PaginatedTableFrame>
  );
}
