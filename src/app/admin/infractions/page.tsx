import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { parseTableQuery } from "@/lib/pagination";
import { loadInfractionsPaginated } from "@/lib/queries/infractions";
import { InfractionsTable } from "@/app/agent/infractions/InfractionsTable";
import { CreateInfractionDialog } from "@/app/agent/search/CreateInfractionDialog";

export default async function AdminInfractionsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);

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
        title="All infractions"
        description="Only agents and administrators file infractions. Search a plate to add a new record."
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
            pathname="/admin/infractions"
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
