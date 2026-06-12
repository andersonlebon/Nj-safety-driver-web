import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfractionsTable } from "@/app/agent/infractions/InfractionsTable";
import { CreateInfractionDialog } from "@/app/agent/search/CreateInfractionDialog";

export default async function AdminInfractionsPage() {
  const supabase = createClient();
  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: templates } = await supabase
    .from("infraction_templates")
    .select("code, label, amount, points, category")
    .eq("active", true)
    .order("label", { ascending: true });
  const infractionIds = (infractions ?? []).map((infraction) => infraction.id);
  const { data: transactions } =
    infractionIds.length > 0
      ? await supabase
          .from("transactions")
          .select("infraction_id, status")
          .in("infraction_id", infractionIds)
      : { data: [] };
  const transactionStatusByInfraction = Object.fromEntries(
    (transactions ?? []).map((transaction) => [
      transaction.infraction_id,
      transaction.status,
    ])
  );

  return (
    <div>
      <PageHeader
        title="All infractions"
        description="Only agents and administrators file infractions. Search a plate to add a new record."
        actions={<CreateInfractionDialog includePlateStep templates={templates ?? undefined} />}
      />
      <Card>
        <CardBody>
          {!infractions || infractions.length === 0 ? (
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
