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
import { getTranslations } from "@/i18n/server";
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
  const { t } = await getTranslations();
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
        title={t("staff.overview.agent.title")}
        description={t("staff.overview.agent.description")}
        actions={
          <Link href="/staff/search" className="btn-primary">
            <Search className="h-4 w-4" />
            {t("staff.overview.agent.plateSearchAction")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label={t("staff.overview.agent.totalInfractions")}
          value={totalInfractions ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="navy"
          hint={t("staff.overview.agent.systemWideHint")}
        />
        <KpiCard
          label={t("staff.overview.agent.issuedByYou")}
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
                {t("staff.overview.agent.activityTitle")}
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {t("staff.overview.agent.infractionsCount", {
                count: weekly.reduce((s, w) => s + w.value, 0),
              })}
            </span>
          </CardHeader>
          <CardBody>
            <BarChartCard
              data={weekly}
              series={[
                {
                  key: "value",
                  label: t("staff.overview.agent.seriesInfractions"),
                  color: chartColors.brand,
                },
              ]}
              valueFormat="number"
              tickFormat="week"
              labelFormat="date"
              ariaLabel={t("staff.overview.agent.ariaWeeklyActivity")}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                {t("staff.overview.agent.topTypesTitle")}
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {t("staff.overview.agent.allTime")}
            </span>
          </CardHeader>
          <CardBody>
            {topTypes.length === 0 ? (
              <EmptyState
                title={t("staff.overview.agent.emptyTitle")}
                description={t("staff.overview.agent.emptyDescription")}
              />
            ) : (
              <BarChartCard
                data={topTypes}
                series={[
                  {
                    key: "value",
                    label: t("staff.overview.agent.seriesCount"),
                    color: chartColors.navy,
                  },
                ]}
                layout="horizontal"
                valueFormat="number"
                tickFormat="raw"
                ariaLabel={t("staff.overview.agent.ariaTopTypes")}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("staff.overview.agent.recentInfractionsTitle")}</CardTitle>
            <Link
              href="/staff/infractions"
              className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline"
            >
              {t("staff.overview.agent.viewAll")}
            </Link>
          </CardHeader>
          <CardBody>
            {recent.length === 0 ? (
              <EmptyState
                title={t("staff.overview.agent.noInfractionsTitle")}
                description={t("staff.overview.agent.noInfractionsDescription")}
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
