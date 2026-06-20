import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { requireAdminProfile } from "@/lib/auth";
import { parseTableQuery } from "@/lib/pagination";
import { AgentApplicationReview } from "../AgentApplicationReview";
import { AdminAgentsTable } from "../AdminAgentsTable";
import type { StaffRole } from "@/lib/types/database";
import { rangeForPage } from "@/lib/pagination";
import { applyTableQueryFilters } from "@/lib/queries/table-filters";

export const dynamic = "force-dynamic";

export default async function StaffAgentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile: me } = await requireAdminProfile();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);

  let staffQuery = supabase
    .from("profiles")
    .select("*, staff_profiles!inner(staff_role)", { count: "exact" })
    .eq("role", "staff")
    .order("created_at", { ascending: false });

  staffQuery = applyTableQueryFilters(staffQuery, tableQuery, {
    searchColumns: [{ column: "full_name" }, { column: "email" }, { column: "phone" }],
    dateColumn: "created_at",
  });

  const [{ data: pendingStaff }, { data: staffRows, count }] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select(
        "profile_id, staff_role, application_status, application_note, profiles(id, full_name, email, phone, created_at)"
      )
      .eq("application_status", "pending")
      .eq("staff_role", "agent")
      .order("created_at", { ascending: false }),
    staffQuery.range(from, to),
  ]);

  const pending = (pendingStaff ?? []).map((sp) => ({
    ...((sp.profiles as unknown as Record<string, unknown>) ?? {}),
    staff_profile_id: sp.profile_id,
    application_status: sp.application_status,
    application_note: sp.application_note,
  }));

  const agents = (staffRows ?? []).map((row) => ({
    ...row,
    staff_role: (
      (row.staff_profiles as { staff_role: StaffRole } | null)?.staff_role ?? "agent"
    ) as StaffRole,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents & administrators"
        description="Review agent applications and manage field agent accounts."
      />

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending agent applications ({pending.length})</CardTitle>
          </CardHeader>
          <CardBody>
            <AgentApplicationReview applicants={pending} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <AdminAgentsTable
            pathname="/staff/agents"
            query={tableQuery}
            totalCount={count ?? 0}
            agents={agents}
            currentUserId={me.id}
          />
        </CardBody>
      </Card>
    </div>
  );
}
