import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth";
import { parseTableQuery } from "@/lib/pagination";
import { loadAgentsPaginated } from "@/lib/queries/agents";
import { AgentApplicationReview } from "../AgentApplicationReview";
import { AdminAgentsTable } from "../AdminAgentsTable";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const me = await requireRole(["admin"]);
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);

  const [{ data: pending }, pageData] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("agent_application_status", "pending")
      .order("created_at", { ascending: false }),
    loadAgentsPaginated(supabase, tableQuery),
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
          <AdminAgentsTable
            pathname="/admin/agents"
            query={pageData.query}
            totalCount={pageData.totalCount}
            agents={pageData.rows}
            currentUserId={me.id}
          />
        </CardBody>
      </Card>
    </div>
  );
}
