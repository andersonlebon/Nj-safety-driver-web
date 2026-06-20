import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireDriverProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { parseTableQuery } from "@/lib/pagination";
import { loadInfractionsPaginated } from "@/lib/queries/infractions";
import { DriverInfractionsTable } from "./DriverInfractionsTable";

export default async function DriverInfractionsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile } = await requireDriverProfile();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadInfractionsPaginated(supabase, tableQuery, {
    driverId: profile.id,
  });

  return (
    <div>
      <PageHeader
        title="Infractions"
        description="View-only: infractions are filed by field agents and administrators. Contact support if you believe a record is incorrect."
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
