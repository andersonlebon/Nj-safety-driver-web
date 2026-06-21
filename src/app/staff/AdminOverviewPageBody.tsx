import {
  Users,
  Car,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  HandCoins,
  TrendingUp,
  Activity,
  PieChart as PieIcon,
  ListOrdered,
  UserCog,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import {
  DonutChartCard,
  type DonutSlice,
} from "@/components/charts/DonutChartCard";
import { chartColors, statusColor } from "@/components/charts/theme";
import {
  countByDay,
  countByMonthByStatus,
  pctDelta,
  totalsByPaymentStatus,
  topN,
} from "@/components/dashboard/analytics";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { loadAdminOverviewData } from "@/lib/queries/admin-overview";
import { getTranslations } from "@/i18n/server";
import type { PaymentStatus } from "@/lib/types/database";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type AgentRef = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function AdminOverviewPageBody() {
  const { t } = await getTranslations();
  const now = new Date();
  const cutoff30 = new Date(now.getTime() - 30 * MS_PER_DAY).toISOString();
  const cutoff60 = new Date(now.getTime() - 60 * MS_PER_DAY).toISOString();

  const overview = await loadAdminOverviewData();

  const infractions = overview.analyticsInfractions;
  const recent = overview.recentInfractions;
  const financialRows = overview.financialRows;
  const vehicles = {
    length: overview.vehicleTotal,
    insured: overview.vehicleInsured,
    inspected: overview.vehicleInspected,
  };

  const totals = totalsByPaymentStatus(financialRows);
  const collected = totals.paid;
  const pendingTotal = totals.pending;
  const unpaidTotal = totals.unpaid;

  const cur = infractions.filter((i) => i.created_at >= cutoff30);
  const prev = infractions.filter(
    (i) => i.created_at < cutoff30 && i.created_at >= cutoff60
  );
  const curFinancial = financialRows.filter((r) => r.created_at >= cutoff30);
  const prevFinancial = financialRows.filter(
    (r) => r.created_at < cutoff30 && r.created_at >= cutoff60
  );
  const curCollected = curFinancial
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.fine_amount, 0);
  const prevCollected = prevFinancial
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.fine_amount, 0);
  const curUnpaid = curFinancial
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + i.fine_amount, 0);
  const prevUnpaid = prevFinancial
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + i.fine_amount, 0);

  const dailyInfractions = countByDay(infractions, 30);
  const monthlyByStatus = countByMonthByStatus(infractions, 6);
  const topPlates = topN(infractions, (i) => i.plate_number, 5);
  const topAgents = topN(infractions, (i) => i.agent_id ?? null, 5);

  const agentLookup = new Map<string, AgentRef>();
  for (const a of overview.agentProfiles as AgentRef[]) {
    agentLookup.set(a.id, a);
  }

  const insuranceSlices: DonutSlice[] = [
    { label: t("staff.overview.admin.insuranceInsured"), value: vehicles.insured, color: chartColors.brand },
    {
      label: t("staff.overview.admin.insuranceNotInsured"),
      value: vehicles.length - vehicles.insured,
      color: chartColors.unpaid,
    },
  ];
  const inspectionSlices: DonutSlice[] = [
    { label: t("staff.overview.admin.inspectionInspected"), value: vehicles.inspected, color: chartColors.navy },
    {
      label: t("staff.overview.admin.inspectionNotInspected"),
      value: vehicles.length - vehicles.inspected,
      color: chartColors.gold,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("staff.overview.admin.title")}
        description={t("staff.overview.admin.description")}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label={t("staff.overview.admin.drivers")}
          value={overview.drivers}
          icon={<Users className="h-4 w-4" />}
          accent="brand"
        />
        <KpiCard
          label={t("staff.overview.admin.agents")}
          value={overview.agents}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="navy"
        />
        <KpiCard
          label={t("staff.overview.admin.vehicles")}
          value={vehicles.length}
          icon={<Car className="h-4 w-4" />}
          accent="stone"
          hint={t("staff.overview.admin.vehiclesHint", {
            insured: vehicles.insured,
            inspected: vehicles.inspected,
          })}
        />
        <KpiCard
          label={t("staff.overview.admin.infractions")}
          value={overview.totalInfractions}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="gold"
          delta={pctDelta(cur.length, prev.length)}
          deltaLabel={t("staff.overview.admin.deltaLabel")}
          invertDelta
        />
        <KpiCard
          label={t("staff.overview.admin.finesCollected")}
          value={formatCurrency(collected)}
          icon={<HandCoins className="h-4 w-4" />}
          accent="brand"
          delta={pctDelta(curCollected, prevCollected)}
          deltaLabel={t("staff.overview.admin.deltaLabel")}
        />
        <KpiCard
          label={t("staff.overview.admin.unpaidFines")}
          value={formatCurrency(unpaidTotal)}
          icon={<Wallet className="h-4 w-4" />}
          accent="red"
          delta={pctDelta(curUnpaid, prevUnpaid)}
          deltaLabel={t("staff.overview.admin.deltaLabel")}
          invertDelta
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t("staff.overview.admin.financialTotalsTitle")}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <PaymentTotal label={t("staff.overview.admin.totalPaid")} value={collected} tone="paid" />
            <PaymentTotal label={t("staff.overview.admin.totalPending")} value={pendingTotal} tone="pending" />
            <PaymentTotal label={t("staff.overview.admin.totalUnpaid")} value={unpaidTotal} tone="unpaid" />
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                {t("staff.overview.admin.infractionsPerDay")}
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {t("staff.overview.admin.inWindow", { count: cur.length })}
            </span>
          </CardHeader>
          <CardBody>
            <LineChartCard
              data={dailyInfractions}
              valueFormat="number"
              tickFormat="date"
              labelFormat="date"
              tooltipSeriesName={t("staff.overview.admin.tooltipInfractions")}
              ariaLabel={t("staff.overview.admin.ariaInfractionsPerDay")}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                {t("staff.overview.admin.byStatus")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <BarChartCard
              data={monthlyByStatus}
              series={[
                { key: "paid", label: t("staff.overview.admin.seriesPaid"), color: statusColor.paid, stackId: "s" },
                { key: "pending", label: t("staff.overview.admin.seriesPending"), color: statusColor.pending, stackId: "s" },
                { key: "unpaid", label: t("staff.overview.admin.seriesUnpaid"), color: statusColor.unpaid, stackId: "s" },
              ]}
              showLegend
              valueFormat="number"
              tickFormat="month"
              labelFormat="month"
              ariaLabel={t("staff.overview.admin.ariaMonthlyByStatus")}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                {t("staff.overview.admin.insurance")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChartCard
              data={insuranceSlices}
              valueFormat="number"
              ariaLabel={t("staff.overview.admin.ariaInsurance")}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                {t("staff.overview.admin.inspection")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChartCard
              data={inspectionSlices}
              valueFormat="number"
              ariaLabel={t("staff.overview.admin.ariaInspection")}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-gold-700 dark:text-gold-400" />
                {t("staff.overview.admin.mostFlaggedPlates")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            {topPlates.length === 0 ? (
              <EmptyState title={t("staff.overview.admin.noData")} />
            ) : (
              <ol className="space-y-2.5">
                {topPlates.map((p, idx) => (
                  <li key={p.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-stone-600 dark:text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {p.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 tabular-nums">
                      {p.value}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <UserCog className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                {t("staff.overview.admin.mostActiveAgents")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            {topAgents.length === 0 ? (
              <EmptyState title={t("staff.overview.admin.noData")} />
            ) : (
              <ol className="space-y-2.5">
                {topAgents.map((p, idx) => {
                  const a = agentLookup.get(p.label);
                  const displayName =
                    a?.full_name?.trim() ||
                    a?.email ||
                    t("staff.overview.admin.agentFallbackName", {
                      idPrefix: p.label.slice(0, 6),
                    });
                  return (
                    <li key={p.label} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-950/40 text-xs font-semibold text-brand-700 dark:text-brand-300">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                          {displayName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 tabular-nums">
                        {p.value}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("staff.overview.admin.recentInfractionsTitle")}</CardTitle>
          </CardHeader>
          <CardBody>
            {!recent || recent.length === 0 ? (
              <EmptyState title={t("staff.overview.admin.recentInfractionsEmpty")} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 pr-4 font-medium">{t("staff.overview.admin.date")}</th>
                      <th className="py-2 pr-4 font-medium">{t("staff.overview.admin.plate")}</th>
                      <th className="py-2 pr-4 font-medium">{t("staff.overview.admin.type")}</th>
                      <th className="py-2 pr-4 font-medium">{t("staff.overview.admin.amount")}</th>
                      <th className="py-2 pr-4 font-medium">{t("staff.overview.admin.status")}</th>
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

function PaymentTotal({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "paid" | "pending" | "unpaid";
}) {
  const toneClass = {
    paid: "text-brand-700 dark:text-brand-300",
    pending: "text-amber-700 dark:text-amber-300",
    unpaid: "text-red-700 dark:text-red-300",
  }[tone];

  return (
    <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/40 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
