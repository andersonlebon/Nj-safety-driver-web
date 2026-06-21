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
import { getTranslations } from "@/i18n/server";

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
  const { t } = await getTranslations();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("staff.agents.page.title")}
        description={t("staff.agents.page.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {pending.length > 0
              ? t("staff.agents.pending.titleWithCount", { count: pending.length })
              : t("staff.agents.pending.title")}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {pending.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-8 w-8" />}
              title={t("staff.agents.pending.emptyTitle")}
              description={t("staff.agents.pending.emptyDescription")}
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
