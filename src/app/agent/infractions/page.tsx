import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { parseTableQuery } from "@/lib/pagination";
import { loadInfractionsPaginated } from "@/lib/queries/infractions";
import { InfractionsTable } from "./InfractionsTable";
import { CreateInfractionDialog } from "../search/CreateInfractionDialog";

export default async function AgentInfractionsPage({
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
        description="Agents file infractions from plate search. Update payment status here as fines are collected."
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
            pathname="/agent/infractions"
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
