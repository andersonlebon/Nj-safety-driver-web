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
import { createClient } from "@/lib/supabase/server";
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
import type { PaymentStatus } from "@/lib/types/database";

type InfractionRow = {
  id: string;
  plate_number: string;
  infraction_type: string;
  fine_amount: number | string;
  status: PaymentStatus;
  created_at: string;
  agent_id: string | null;
};

type VehicleRow = {
  id: string;
  insurance_status: boolean;
  inspection_status: boolean;
};

type AgentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const now = new Date();
  const cutoff30 = new Date(now.getTime() - 30 * MS_PER_DAY).toISOString();
  const cutoff60 = new Date(now.getTime() - 60 * MS_PER_DAY).toISOString();

  const [
    { count: drivers },
    { count: agents },
    { data: vehicleRows },
    { data: infractionRows },
    { data: recent },
    { data: agentProfiles },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "driver"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "agent"),
    supabase
      .from("vehicles")
      .select("id, insurance_status, inspection_status"),
    supabase
      .from("infractions")
      .select(
        "id, plate_number, infraction_type, fine_amount, status, created_at, agent_id"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("infractions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "agent"),
  ]);

  const vehicles: VehicleRow[] = vehicleRows ?? [];
  const infractions: InfractionRow[] = (infractionRows ?? []).map((i) => ({
    ...i,
    fine_amount: Number(i.fine_amount),
  }));

  const totalInfractions = infractions.length;
  const totals = totalsByPaymentStatus(infractions);
  const collected = totals.paid;
  const pendingTotal = totals.pending;
  const unpaidTotal = totals.unpaid;

  // Deltas: current 30-day window vs previous 30-day window
  const cur = infractions.filter((i) => i.created_at >= cutoff30);
  const prev = infractions.filter(
    (i) => i.created_at < cutoff30 && i.created_at >= cutoff60
  );
  const curCount = cur.length;
  const prevCount = prev.length;
  const curCollected = cur
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.fine_amount), 0);
  const prevCollected = prev
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.fine_amount), 0);
  const curUnpaid = cur
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + Number(i.fine_amount), 0);
  const prevUnpaid = prev
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + Number(i.fine_amount), 0);

  const dailyInfractions = countByDay(infractions, 30);
  const monthlyByStatus = countByMonthByStatus(infractions, 6);
  const topPlates = topN(infractions, (i) => i.plate_number, 5);
  const topAgents = topN(infractions, (i) => i.agent_id ?? null, 5);

  const agentLookup = new Map<string, AgentProfile>();
  for (const a of (agentProfiles ?? []) as AgentProfile[]) {
    agentLookup.set(a.id, a);
  }

  const insured = vehicles.filter((v) => v.insurance_status).length;
  const inspected = vehicles.filter((v) => v.inspection_status).length;

  const insuranceSlices: DonutSlice[] = [
    { label: "Insured", value: insured, color: chartColors.brand },
    {
      label: "Not insured",
      value: vehicles.length - insured,
      color: chartColors.unpaid,
    },
  ];
  const inspectionSlices: DonutSlice[] = [
    { label: "Inspected", value: inspected, color: chartColors.navy },
    {
      label: "Not inspected",
      value: vehicles.length - inspected,
      color: chartColors.gold,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Administrator overview"
        description="System-wide analytics, performance, and recent activity."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Drivers"
          value={drivers ?? 0}
          icon={<Users className="h-4 w-4" />}
          accent="brand"
        />
        <KpiCard
          label="Agents"
          value={agents ?? 0}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="navy"
        />
        <KpiCard
          label="Vehicles"
          value={vehicles.length}
          icon={<Car className="h-4 w-4" />}
          accent="stone"
          hint={`${insured} insured · ${inspected} inspected`}
        />
        <KpiCard
          label="Infractions"
          value={totalInfractions}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="gold"
          delta={pctDelta(curCount, prevCount)}
          deltaLabel="vs prev 30d"
          invertDelta
        />
        <KpiCard
          label="Fines collected"
          value={formatCurrency(collected)}
          icon={<HandCoins className="h-4 w-4" />}
          accent="brand"
          delta={pctDelta(curCollected, prevCollected)}
          deltaLabel="vs prev 30d"
        />
        <KpiCard
          label="Unpaid fines"
          value={formatCurrency(unpaidTotal)}
          icon={<Wallet className="h-4 w-4" />}
          accent="red"
          delta={pctDelta(curUnpaid, prevUnpaid)}
          deltaLabel="vs prev 30d"
          invertDelta
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Financial totals by payment state</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <PaymentTotal label="Total paid" value={collected} tone="paid" />
            <PaymentTotal label="Total pending" value={pendingTotal} tone="pending" />
            <PaymentTotal label="Total unpaid" value={unpaidTotal} tone="unpaid" />
          </div>
        </CardBody>
      </Card>

      {/* Time series row */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                Infractions per day — last 30 days
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {curCount} in window
            </span>
          </CardHeader>
          <CardBody>
            <LineChartCard
              data={dailyInfractions}
              valueFormat="number"
              tickFormat="date"
              labelFormat="date"
              tooltipSeriesName="Infractions"
              ariaLabel="Infractions created per day, last 30 days"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                By status — last 6 months
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <BarChartCard
              data={monthlyByStatus}
              series={[
                {
                  key: "paid",
                  label: "Paid",
                  color: statusColor.paid,
                  stackId: "s",
                },
                {
                  key: "pending",
                  label: "Pending",
                  color: statusColor.pending,
                  stackId: "s",
                },
                {
                  key: "unpaid",
                  label: "Unpaid",
                  color: statusColor.unpaid,
                  stackId: "s",
                },
              ]}
              showLegend
              valueFormat="number"
              tickFormat="month"
              labelFormat="month"
              ariaLabel="Monthly infractions split by status, last 6 months"
            />
          </CardBody>
        </Card>
      </div>

      {/* Vehicle health donuts */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 sm:col-span-1">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                Insurance
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChartCard
              data={insuranceSlices}
              valueFormat="number"
              ariaLabel="Vehicles by insurance status"
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-1 sm:col-span-1">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                Inspection
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChartCard
              data={inspectionSlices}
              valueFormat="number"
              ariaLabel="Vehicles by inspection status"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-gold-700 dark:text-gold-400" />
                Most-flagged plates
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            {topPlates.length === 0 ? (
              <EmptyState title="No data yet" />
            ) : (
              <ol className="space-y-2.5">
                {topPlates.map((p, idx) => (
                  <li
                    key={p.label}
                    className="flex items-center justify-between gap-3"
                  >
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
                Most active agents
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            {topAgents.length === 0 ? (
              <EmptyState title="No data yet" />
            ) : (
              <ol className="space-y-2.5">
                {topAgents.map((p, idx) => {
                  const a = agentLookup.get(p.label);
                  const displayName =
                    a?.full_name?.trim() ||
                    a?.email ||
                    `Agent ${p.label.slice(0, 6)}…`;
                  return (
                    <li
                      key={p.label}
                      className="flex items-center justify-between gap-3"
                    >
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

      {/* Recent activity table */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent infractions</CardTitle>
          </CardHeader>
          <CardBody>
            {!recent || recent.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Plate</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
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
