import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireDriverProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { parseTableQuery } from "@/lib/pagination";
import { loadInfractionsPaginated } from "@/lib/queries/infractions";
import { DriverInfractionsTable } from "./DriverInfractionsTable";
import { getTranslations } from "@/i18n/server";

export default async function DriverInfractionsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile } = await requireDriverProfile();
  const { t } = await getTranslations();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadInfractionsPaginated(supabase, tableQuery, {
    driverId: profile.id,
  });

  return (
    <div>
      <PageHeader
        title={t("driver.infractions.title")}
        description={t("driver.infractions.description")}
      />
      <Card>
        <CardBody>
          <DriverInfractionsTable
            pathname="/driver/infractions"
            query={pageData.query}
            totalCount={pageData.totalCount}
            infractions={pageData.rows}
            transactionStatusByInfraction={pageData.transactionStatusByInfraction}
          />
        </CardBody>
      </Card>
    </div>
  );
}
