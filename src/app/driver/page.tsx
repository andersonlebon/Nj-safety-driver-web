import Link from "next/link";
import {
  Car,
  FileText,
  AlertTriangle,
  Wallet,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireDriverProfile } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import { LineChartCard } from "@/components/charts/LineChartCard";
import {
  DonutChartCard,
  type DonutSlice,
} from "@/components/charts/DonutChartCard";
import { statusColor } from "@/components/charts/theme";
import {
  computeComplianceScore,
  COMPLIANCE_RULES,
  sumByMonth,
} from "@/components/dashboard/analytics";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTranslations } from "@/i18n/server";
import type { PaymentStatus } from "@/lib/types/database";

type InfractionRow = {
  id: string;
  plate_number: string;
  infraction_type: string;
  fine_amount: number;
  amount_paid: number;
  status: PaymentStatus;
  points: number;
  created_at: string;
};

type VehicleRow = {
  id: string;
  insurance_status: boolean;
  inspection_status: boolean;
};

export default async function DriverOverviewPage() {
  const { profile } = await requireDriverProfile();
  const { t } = await getTranslations();
  const supabase = createClient();

  const [
    { count: docCount },
    { data: vehicleRows },
    { data: infractionRows },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profile.id),
    supabase
      .from("vehicles")
      .select("id, insurance_status, inspection_status")
      .eq("owner_id", profile.id),
    supabase
      .from("infractions")
      .select(
        "id, plate_number, infraction_type, fine_amount, amount_paid, status, points, created_at"
      )
      .eq("driver_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const vehicles: VehicleRow[] = vehicleRows ?? [];
  const infractions: InfractionRow[] = (infractionRows ?? []).map((i) => ({
    ...i,
    fine_amount: Number(i.fine_amount),
    amount_paid: Number(i.amount_paid ?? 0),
    points: Number(i.points ?? COMPLIANCE_RULES.defaultInfractionPoints),
  }));

  const transactionStatusCounts = infractions.reduce(
    (counts, infraction) => {
      if (infraction.status === "paid") counts.paid += 1;
      else if (infraction.status === "pending") counts.pending += 1;
      else counts.unpaid += 1;
      return counts;
    },
    { paid: 0, pending: 0, unpaid: 0 }
  );
  const totalDue = infractions.reduce((sum, infraction) => {
    if (infraction.status === "paid") return sum;
    return sum + Math.max(infraction.fine_amount - infraction.amount_paid, 0);
  }, 0);

  const transactionTotals = infractions.reduce(
    (totals, infraction) => {
      const remaining = Math.max(infraction.fine_amount - infraction.amount_paid, 0);
      if (infraction.status === "paid") {
        totals.paid += infraction.fine_amount;
      } else if (infraction.status === "pending") {
        totals.paid += infraction.amount_paid;
        totals.pending += remaining;
      } else {
        totals.unpaid += remaining;
      }
      return totals;
    },
    { paid: 0, pending: 0, unpaid: 0 }
  );

  const monthly = sumByMonth(infractions, 6);
  const recent = infractions.slice(0, 5);

  const score = computeComplianceScore(infractions);

  const statusSlices: DonutSlice[] = [
    { label: t("driver.overview.charts.paid"), value: transactionStatusCounts.paid, color: statusColor.paid },
    { label: t("driver.overview.charts.pending"), value: transactionStatusCounts.pending, color: statusColor.pending },
    { label: t("driver.overview.charts.unpaid"), value: transactionStatusCounts.unpaid, color: statusColor.unpaid },
  ];

  const scoreDescription =
    score >= 80
      ? t("driver.overview.compliance.descriptionExcellent")
      : score >= COMPLIANCE_RULES.minimumAllowedToDrive
        ? t("driver.overview.compliance.descriptionWarning")
        : t("driver.overview.compliance.descriptionCritical");

  const firstName = profile?.full_name?.split(" ")[0];
  const welcomeTitle = firstName
    ? t("driver.overview.welcomeWithName", { firstName })
    : t("driver.overview.welcome");

  return (
    <div>
      <PageHeader
        title={welcomeTitle}
        description={t("driver.overview.description")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t("driver.overview.kpi.vehicles")}
          value={vehicles.length}
          icon={<Car className="h-4 w-4" />}
          accent="brand"
          hint={
            vehicles.length === 0
              ? t("driver.overview.kpi.registerFirst")
              : t("driver.overview.kpi.insuredInspected", {
                  insured: vehicles.filter((v) => v.insurance_status).length,
                  inspected: vehicles.filter((v) => v.inspection_status).length,
                })
          }
        />
        <KpiCard
          label={t("driver.overview.kpi.documents")}
          value={docCount ?? 0}
          icon={<FileText className="h-4 w-4" />}
          accent="navy"
        />
        <KpiCard
          label={t("driver.overview.kpi.openInfractions")}
          value={transactionStatusCounts.unpaid + transactionStatusCounts.pending}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent={
            transactionStatusCounts.unpaid + transactionStatusCounts.pending > 0
              ? "red"
              : "stone"
          }
          hint={
            transactionStatusCounts.pending > 0
              ? t("driver.overview.kpi.pendingPayment", {
                  count: transactionStatusCounts.pending,
                })
              : t("driver.overview.kpi.noOutstanding")
          }
        />
        <KpiCard
          label={t("driver.overview.kpi.totalDue")}
          value={formatCurrency(totalDue)}
          icon={<Wallet className="h-4 w-4" />}
          accent={totalDue > 0 ? "gold" : "stone"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                {t("driver.overview.charts.finesTitle")}
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {t("driver.overview.charts.total", {
                amount: formatCurrency(monthly.reduce((s, m) => s + m.value, 0)),
              })}
            </span>
          </CardHeader>
          <CardBody>
            <LineChartCard
              data={monthly}
              valueFormat="currency-short"
              tickFormat="month"
              labelFormat="month"
              tooltipSeriesName={t("driver.overview.charts.finesTooltipSeries")}
              ariaLabel={t("driver.overview.charts.finesAriaLabel")}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                {t("driver.overview.charts.paymentStatusTitle")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChartCard
              data={statusSlices}
              valueFormat="number"
              ariaLabel={t("driver.overview.charts.paymentStatusAriaLabel")}
            />
            <div className="mt-2 grid grid-cols-3 text-center text-xs">
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrency(transactionTotals.paid)}
                </p>
                <p className="text-stone-500 dark:text-slate-400">
                  {t("driver.overview.charts.paid")}
                </p>
              </div>
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrency(transactionTotals.pending)}
                </p>
                <p className="text-stone-500 dark:text-slate-400">
                  {t("driver.overview.charts.pending")}
                </p>
              </div>
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrency(transactionTotals.unpaid)}
                </p>
                <p className="text-stone-500 dark:text-slate-400">
                  {t("driver.overview.charts.unpaid")}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                {t("driver.overview.compliance.title")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <ScoreGauge
              score={score}
              description={scoreDescription}
              valueFormat="raw"
            />
            <p className="mt-3 text-xs text-stone-500 dark:text-slate-400">
              {t("driver.overview.compliance.formula", {
                minimum: COMPLIANCE_RULES.minimumAllowedToDrive,
              })}
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("driver.overview.recentInfractions.title")}</CardTitle>
            <Link
              href="/driver/infractions"
              className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline"
            >
              {t("driver.overview.recentInfractions.viewAll")}
            </Link>
          </CardHeader>
          <CardBody>
            {recent.length === 0 ? (
              <EmptyState
                title={t("driver.overview.recentInfractions.emptyTitle")}
                description={t("driver.overview.recentInfractions.emptyDescription")}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 pr-4 font-medium">
                        {t("driver.overview.recentInfractions.date")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("driver.overview.recentInfractions.plate")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("driver.overview.recentInfractions.type")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("driver.overview.recentInfractions.amount")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("driver.overview.recentInfractions.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((i) => (
                      <tr
                        key={i.id}
                        className="border-b border-stone-100 dark:border-slate-800 last:border-0"
                      >
                        <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                          {formatDate(i.created_at)}
                        </td>
                        <td className="py-2 pr-4 font-mono font-medium text-stone-900 dark:text-stone-100">
                          {i.plate_number}
                        </td>
                        <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                          {i.infraction_type}
                        </td>
                        <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                          {formatCurrency(Number(i.fine_amount))}
                        </td>
                        <td className="py-2 pr-4">
                          <StatusBadge status={i.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
