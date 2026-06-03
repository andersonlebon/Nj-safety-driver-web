import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/auth";
import { AdminDriversTable } from "../AdminDriversTable";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
  const me = await requireRole(["admin"]);
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Review driver accounts. Click a row or View details to approve, reject, or change roles."
      />
      <Card>
        <CardBody>
          {!drivers || drivers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No drivers"
              description="Driver accounts will appear here once people register."
            />
          ) : (
            <AdminDriversTable drivers={drivers} adminId={me.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
