import Link from "next/link";
import {
  AlertTriangle,
  Search,
  FileCheck,
  BarChart3,
  ListOrdered,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { chartColors } from "@/components/charts/theme";
import { countByWeek, topN } from "@/components/dashboard/analytics";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireStaffProfile } from "@/lib/auth";
import { loadTransactionsForInfractionIds } from "@/lib/queries/infractions";
import { AgentRecentInfractionsTable } from "./AgentRecentInfractionsTable";
import type { PaymentStatus } from "@/lib/types/database";

type InfractionRow = {
  id: string;
  plate_number: string;
  registration_country: string | null;
  infraction_type: string;
  description: string | null;
  location: string | null;
  fine_amount: string;
  status: PaymentStatus;
  evidence_path: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function AgentOverviewPage() {
  const { profile } = await requireStaffProfile();
  const supabase = createClient();

  const [
    { count: totalInfractions },
    { data: myInfractions },
  ] = await Promise.all([
    supabase.from("infractions").select("id", { count: "exact", head: true }),
    supabase
      .from("infractions")
      .select(
        "id, plate_number, registration_country, infraction_type, description, location, fine_amount, status, evidence_path, vehicle_id, driver_id, agent_id, created_at, updated_at"
      )
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const mine: InfractionRow[] = myInfractions ?? [];

  const transactionStatusByInfraction = await loadTransactionsForInfractionIds(
    supabase,
    mine.map((i) => i.id)
  );

  const weekly = countByWeek(mine, 8);
  const topTypes = topN(mine, (i) => i.infraction_type, 5);
  const recent = mine.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Agent overview"
        description="Quickly find vehicles and review your issuing activity."
        actions={
          <Link href="/staff/search" className="btn-primary">
            <Search className="h-4 w-4" />
            Plate search
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Total infractions"
          value={totalInfractions ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="navy"
          hint="System-wide"
        />
        <KpiCard
          label="Issued by you"
          value={mine.length}
          icon={<FileCheck className="h-4 w-4" />}
          accent="brand"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                Your activity — last 8 weeks
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {weekly.reduce((s, w) => s + w.value, 0)} infractions
            </span>
          </CardHeader>
          <CardBody>
            <BarChartCard
              data={weekly}
              series={[{ key: "value", label: "Infractions", color: chartColors.brand }]}
              valueFormat="number"
              tickFormat="week"
              labelFormat="date"
              ariaLabel="Infractions issued by you per week, last 8 weeks"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                Top 5 infraction types
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">All-time</span>
          </CardHeader>
          <CardBody>
            {topTypes.length === 0 ? (
              <EmptyState
                title="Nothing to show yet"
                description="Start issuing infractions to populate this chart."
              />
            ) : (
              <BarChartCard
                data={topTypes}
                series={[{ key: "value", label: "Count", color: chartColors.navy }]}
                layout="horizontal"
                valueFormat="number"
                tickFormat="raw"
                ariaLabel="Top 5 infraction types you have issued"
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent infractions</CardTitle>
            <Link
              href="/staff/infractions"
              className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {recent.length === 0 ? (
              <EmptyState
                title="No infractions yet"
                description="Use the plate search to look up a vehicle and create one."
              />
            ) : (
              <AgentRecentInfractionsTable
                infractions={recent}
                transactionStatusByInfraction={transactionStatusByInfraction}
                canManageVehicles={false}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
