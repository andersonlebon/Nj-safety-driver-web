import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfractionsTable } from "@/app/agent/infractions/InfractionsTable";

export default async function AdminInfractionsPage() {
  const supabase = createClient();
  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="All infractions"
        description="System-wide list of infractions; update status as needed."
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
            <InfractionsTable infractions={infractions} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
