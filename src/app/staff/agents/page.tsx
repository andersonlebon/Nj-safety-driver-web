import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdminProfile } from "@/lib/auth";
import { parseTableQuery } from "@/lib/pagination";
import {
  loadPendingAgentApplications,
  loadStaffDirectoryPaginated,
} from "@/lib/queries/staff-agents";
import { AgentApplicationReview } from "../AgentApplicationReview";
import { AdminAgentsTable } from "../AdminAgentsTable";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffAgentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile: me } = await requireAdminProfile();
  const admin = createAdminClient();
  const tableQuery = parseTableQuery(searchParams);

  const [pending, pageData] = await Promise.all([
    loadPendingAgentApplications(admin),
    loadStaffDirectoryPaginated(admin, tableQuery),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents & administrators"
        description="Review agent applications and manage field agent accounts."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            Pending agent applications
            {pending.length > 0 ? ` (${pending.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {pending.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-8 w-8" />}
              title="No pending applications"
              description="New agent requests appear here for review and approval."
            />
          ) : (
            <AgentApplicationReview applicants={pending} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <AdminAgentsTable
            pathname="/staff/agents"
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
