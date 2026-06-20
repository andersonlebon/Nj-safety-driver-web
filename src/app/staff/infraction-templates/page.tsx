import { ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { INFRACTION_TEMPLATES } from "@/lib/infraction-templates";
import { InfractionTemplatesManager } from "../InfractionTemplatesManager";

export const dynamic = "force-dynamic";

export default async function AdminInfractionTemplatesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("infraction_templates")
    .select("*")
    .order("label", { ascending: true });

  const templates =
    data && data.length > 0
      ? data
      : INFRACTION_TEMPLATES.map((template, index) => ({
          id: `seed-${index}`,
          code: template.code,
          label: template.label,
          amount: template.amount,
          points: template.points,
          category: template.category,
          active: true,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
        }));

  return (
    <div>
      <PageHeader
        title="Infraction templates"
        description="Create and standardize predefined infractions. Agents can only select active templates."
      />
      <Card>
        <CardBody>
          {templates.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-8 w-8" />}
              title="No templates"
              description="Create the first predefined infraction."
            />
          ) : (
            <InfractionTemplatesManager templates={templates} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

