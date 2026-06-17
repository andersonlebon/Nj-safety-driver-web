import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { loadInfractionsWithTransactions } from "@/lib/queries/infractions";
import { InfractionsTable } from "@/app/agent/infractions/InfractionsTable";
import { CreateInfractionDialog } from "@/app/agent/search/CreateInfractionDialog";

export default async function AdminInfractionsPage() {
  const supabase = createClient();
  const [{ infractions, transactionStatusByInfraction }, { data: templates }] =
    await Promise.all([
      loadInfractionsWithTransactions(supabase),
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
          {infractions.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8" />}
              title="No infractions"
              description="Infractions filed by agents will appear here."
            />
          ) : (
            <InfractionsTable
              infractions={infractions}
              transactionStatusByInfraction={transactionStatusByInfraction}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
