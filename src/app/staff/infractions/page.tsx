import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { parseTableQuery } from "@/lib/pagination";
import { loadInfractionsPaginated } from "@/lib/queries/infractions";
import { requireStaffProfile } from "@/lib/auth";
import { InfractionsTable } from "./InfractionsTable";
import { CreateInfractionDialog } from "../search/CreateInfractionDialog";
import { getTranslations } from "@/i18n/server";

export default async function AgentInfractionsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const { staffProfile } = await requireStaffProfile();
  const canManageVehicles = staffProfile.staff_role === "admin";
  const { t } = await getTranslations();

  const [pageData, { data: templates }] = await Promise.all([
    loadInfractionsPaginated(supabase, tableQuery),
    supabase
      .from("infraction_templates")
      .select("code, label, amount, points, category")
      .eq("active", true)
      .order("label", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("staff.infractions.page.title")}
        description={t("staff.infractions.page.description")}
        actions={
          <CreateInfractionDialog
            includePlateStep
            templates={templates ?? undefined}
          />
        }
      />
      <Card>
        <CardBody>
          <InfractionsTable
            pathname="/staff/infractions"
            query={pageData.query}
            totalCount={pageData.totalCount}
            infractions={pageData.rows}
            transactionStatusByInfraction={pageData.transactionStatusByInfraction}
            canManageVehicles={canManageVehicles}
          />
        </CardBody>
      </Card>
    </div>
  );
}
