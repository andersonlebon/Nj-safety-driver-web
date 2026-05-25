import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/lib/auth";
import { RoleBadge, RoleChanger } from "../RoleChanger";
import { AgentApplicationReview } from "../AgentApplicationReview";
import type { UserRole } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const me = await requireRole(["admin"]);
  const supabase = createClient();

  const [{ data: pending }, { data: agents }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("agent_application_status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("*")
      .in("role", ["agent", "admin"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents & administrators"
        description="Review agent applications and manage field agent accounts."
      />

      {(pending?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending agent applications ({pending!.length})</CardTitle>
          </CardHeader>
          <CardBody>
            <AgentApplicationReview applicants={pending ?? []} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          {!agents || agents.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-8 w-8" />}
              title="No agents yet"
              description="Approved applications and promoted users appear here."
            />
          ) : (
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
                  {agents.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-stone-100 dark:border-slate-800 last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                        {a.full_name || "—"}
                        {a.id === me.id && (
                          <span className="ml-2 text-xs font-normal text-stone-500 dark:text-slate-400">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                        {a.email || "—"}
                      </td>
                      <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                        {a.phone || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <RoleBadge role={a.role as UserRole} />
                      </td>
                      <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-2 pr-4">
                        <RoleChanger
                          userId={a.id}
                          currentRole={a.role as UserRole}
                          isSelf={a.id === me.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
