import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/lib/auth";
import { RoleBadge, RoleChanger } from "../RoleChanger";
import {
  DriverVerificationPanel,
  VerificationStatusBadge,
} from "../DriverVerificationPanel";
import type { UserRole } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
  const me = await requireRole(["admin"]);
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Review driver accounts, verification status, and role assignments."
      />
      <Card>
        <CardBody>
          {!drivers || drivers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No drivers"
              description="Driver accounts will appear here once people register."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">License #</th>
                    <th className="py-2 pr-4 font-medium">Joined</th>
                    <th className="py-2 pr-4 font-medium">Verification</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-stone-100 dark:border-slate-800 last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                        {d.full_name || "—"}
                      </td>
                      <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                        {d.email || "—"}
                      </td>
                      <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                        {d.phone || "—"}
                      </td>
                      <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                        {d.driver_license || "—"}
                      </td>
                      <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                        {formatDate(d.created_at)}
                      </td>
                      <td className="py-2 pr-4">
                        <VerificationStatusBadge
                          status={d.verification_status ?? "pending_documents"}
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <RoleBadge role={d.role as UserRole} />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-col gap-2">
                          <RoleChanger
                            userId={d.id}
                            currentRole={d.role as UserRole}
                            isSelf={d.id === me.id}
                          />
                          <DriverVerificationPanel
                            userId={d.id}
                            status={d.verification_status ?? "pending_documents"}
                            adminMessage={d.admin_message}
                          />
                        </div>
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
