import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { loadInfractionsWithTransactions } from "@/lib/queries/infractions";
import { InfractionsTable } from "./InfractionsTable";
import { CreateInfractionDialog } from "../search/CreateInfractionDialog";

export default async function AgentInfractionsPage() {
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
          {infractions.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8" />}
              title="No infractions"
              description="Use the plate search to file the first infraction."
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
