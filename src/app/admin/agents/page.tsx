import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/utils";

export default async function AdminAgentsPage() {
  const supabase = createClient();
  const { data: agents } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["agent", "admin"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" description="Field agents and administrators." />
      <Alert variant="info">
        To promote an existing user to <strong>agent</strong> or{" "}
        <strong>admin</strong>, run the following SQL in the Supabase SQL Editor:
        <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-900/5 text-xs">
          update public.profiles set role = &apos;agent&apos; where email = &apos;user@example.com&apos;;
        </code>
      </Alert>
      <Card>
        <CardBody>
          {!agents || agents.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-8 w-8" />}
              title="No agents"
              description="Promote a registered user to agent role to see them here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-medium text-slate-900">{a.full_name || "—"}</td>
                      <td className="py-2 pr-4 text-slate-700">{a.email || "—"}</td>
                      <td className="py-2 pr-4 text-slate-700">{a.phone || "—"}</td>
                      <td className="py-2 pr-4">
                        <span className="badge bg-brand-50 text-brand-800">
                          {a.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{formatDate(a.created_at)}</td>
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
