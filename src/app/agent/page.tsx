import Link from "next/link";
import {
  AlertTriangle,
  Search,
  FileCheck,
  Coins,
  CheckCircle2,
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
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/lib/auth";
import { resolveLedgerStatus } from "@/lib/transactions";
import { loadTransactionsForInfractionIds } from "@/lib/queries/infractions";
import type { PaymentStatus } from "@/lib/types/database";

type InfractionRow = {
  id: string;
  plate_number: string;
  infraction_type: string;
  fine_amount: number | string;
  status: PaymentStatus;
  created_at: string;
};

export default async function AgentOverviewPage() {
  const profile = await requireRole(["agent", "admin"]);
  const supabase = createClient();

  const [
    { count: totalInfractions },
    { count: unpaidCount },
    { data: myInfractions },
  ] = await Promise.all([
    supabase.from("infractions").select("id", { count: "exact", head: true }),
    supabase
      .from("infractions")
      .select("id", { count: "exact", head: true })
      .eq("status", "unpaid"),
    supabase
      .from("infractions")
      .select(
        "id, plate_number, infraction_type, fine_amount, status, created_at"
      )
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const mine: InfractionRow[] = (myInfractions ?? []).map((i) => ({
    ...i,
    fine_amount: Number(i.fine_amount),
  }));

  const transactionStatusByInfraction = await loadTransactionsForInfractionIds(
    supabase,
    mine.map((i) => i.id)
  );

  const mineWithLedger = mine.map((infraction) => ({
    ...infraction,
    ledgerStatus: resolveLedgerStatus(
      infraction.status,
      transactionStatusByInfraction[infraction.id]
    ),
  }));

  const weekly = countByWeek(mine, 8);
  const topTypes = topN(mine, (i) => i.infraction_type, 5);
  const totalFinesIssued = mine.reduce(
    (s, i) => s + Number(i.fine_amount),
    0
  );
  const paid = mineWithLedger.filter((i) => i.ledgerStatus === "paid").length;
  const pending = mineWithLedger.filter((i) => i.ledgerStatus === "pending").length;
  const unpaidMine = mineWithLedger.filter((i) => i.ledgerStatus === "unpaid").length;
  const denom = paid + pending + unpaidMine;
  const resolutionRate = denom === 0 ? 0 : Math.round((paid / denom) * 1000) / 10;

  const recent = mine.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Agent overview"
        description="Quickly find vehicles and review your issuing activity."
        actions={
          <Link href="/agent/search" className="btn-primary">
            <Search className="h-4 w-4" />
            Plate search
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total infractions"
          value={totalInfractions ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="navy"
          hint="System-wide"
        />
        <KpiCard
          label="Currently unpaid"
          value={unpaidCount ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="red"
          hint="System-wide"
        />
        <KpiCard
          label="Issued by you"
          value={mine.length}
          icon={<FileCheck className="h-4 w-4" />}
          accent="brand"
        />
        <KpiCard
          label="Fines issued"
          value={formatCurrency(totalFinesIssued)}
          icon={<Coins className="h-4 w-4" />}
          accent="gold"
          hint="All-time total (XAF)"
        />
        <KpiCard
          label="Resolution rate"
          value={`${resolutionRate.toFixed(1)}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent={resolutionRate >= 60 ? "brand" : "stone"}
          hint={`${paid} paid / ${denom} total`}
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
              series={[
                {
                  key: "value",
                  label: "Infractions",
                  color: chartColors.brand,
                },
              ]}
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
            <span className="text-xs text-stone-500 dark:text-slate-400">
              All-time
            </span>
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
                series={[
                  {
                    key: "value",
                    label: "Count",
                    color: chartColors.navy,
                  },
                ]}
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
              href="/agent/infractions"
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
                    {recent.map((i) => {
                      const ledgerStatus = resolveLedgerStatus(
                        i.status,
                        transactionStatusByInfraction[i.id]
                      );
                      return (
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
                          <InfractionStatusBadge status={ledgerStatus} />
                        </td>
                      </tr>
                      );
                    })}
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
