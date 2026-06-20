"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { TableQuery } from "@/lib/pagination";
import type { Database, StaffRole } from "@/lib/types/database";
import { promoteAgentToAdmin } from "./actions";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function StaffRoleBadge({ role }: { role: StaffRole }) {
  const classes: Record<StaffRole, string> = {
    agent: "badge bg-navy-100 text-navy-800 dark:bg-navy-950/40 dark:text-navy-200",
    admin: "badge bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300",
  };
  const labels: Record<StaffRole, string> = { agent: "Agent", admin: "Admin" };
  return <span className={classes[role]}>{labels[role]}</span>;
}

function PromoteButton({
  staffProfileId,
  isSelf,
}: {
  staffProfileId: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (isSelf) {
    return <span className="text-xs text-stone-400">—</span>;
  }

  return (
    <Button
      type="button"
      variant="secondary"
      loading={pending}
      className="text-xs py-1 px-2"
      onClick={() => {
        startTransition(async () => {
          const result = await promoteAgentToAdmin(staffProfileId);
          if (!result.ok) alert(result.error);
          else router.refresh();
        });
      }}
    >
      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
      Promote
    </Button>
  );
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
  agents: (Profile & { staff_role?: StaffRole })[];
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
      emptyTitle="No staff members yet"
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
              <th className="py-2 pr-4 font-medium">Sub-role</th>
              <th className="py-2 pr-4 font-medium">Joined</th>
              <th className="py-2 pr-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const staffRole: StaffRole = (agent as { staff_role?: StaffRole }).staff_role ?? "agent";
              return (
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
                    <StaffRoleBadge role={staffRole} />
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {formatDate(agent.created_at)}
                  </td>
                  <td className="py-2 pr-4">
                    {staffRole === "agent" ? (
                      <PromoteButton
                        staffProfileId={agent.id}
                        isSelf={agent.id === currentUserId}
                      />
                    ) : (
                      <span className="text-xs text-stone-400">Admin</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PaginatedTableFrame>
  );
}
