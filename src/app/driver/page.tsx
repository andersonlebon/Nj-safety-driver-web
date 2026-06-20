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
import type { PaymentStatus } from "@/lib/types/database";

type InfractionRow = {
  id: string;
  plate_number: string;
  infraction_type: string;
  fine_amount: number | string;
  status: PaymentStatus;
  created_at: string;
};

type VehicleRow = {
  id: string;
  insurance_status: boolean;
  inspection_status: boolean;
};

export default async function DriverOverviewPage() {
  const { profile } = await requireDriverProfile();
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
        "id, plate_number, infraction_type, fine_amount, status, created_at"
      )
      .eq("driver_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const vehicles: VehicleRow[] = vehicleRows ?? [];
  const infractions: InfractionRow[] = (infractionRows ?? []).map((i) => ({
    ...i,
    fine_amount: Number(i.fine_amount),
  }));
  const infractionIds = infractions.map((infraction) => infraction.id);
  const { data: transactionRows } =
    infractionIds.length > 0
      ? await supabase
          .from("transactions")
          .select("infraction_id, amount, status")
          .in("infraction_id", infractionIds)
      : { data: [] };
  const transactionMap = new Map(
    (transactionRows ?? []).map((transaction) => [
      transaction.infraction_id,
      transaction,
    ])
  );
  const transactionTotals = infractions.reduce(
    (totals, infraction) => {
      const transaction = transactionMap.get(infraction.id);
      const status = transaction?.status ?? infraction.status;
      const amount = Number(transaction?.amount ?? infraction.fine_amount);
      if (status === "initialized") {
        totals.unpaid += amount;
      } else if (status === "paid") {
        totals.paid += amount;
      } else if (status === "pending") {
        totals.pending += amount;
      } else {
        totals.unpaid += amount;
      }
      return totals;
    },
    { paid: 0, pending: 0, unpaid: 0 }
  );

  const transactionStatusCounts = infractions.reduce(
    (counts, infraction) => {
      const status = transactionMap.get(infraction.id)?.status ?? infraction.status;
      if (status === "initialized") counts.unpaid += 1;
      else if (status === "paid") counts.paid += 1;
      else if (status === "pending") counts.pending += 1;
      else counts.unpaid += 1;
      return counts;
    },
    { paid: 0, pending: 0, unpaid: 0 }
  );
  const totalDue = transactionTotals.unpaid;

  const monthly = sumByMonth(infractions, 6);
  const recent = infractions.slice(0, 5);

  const score = computeComplianceScore({
    infractions,
    verificationStatus: profile.verification_status,
  });

  const statusSlices: DonutSlice[] = [
    { label: "Paid", value: transactionStatusCounts.paid, color: statusColor.paid },
    { label: "Pending", value: transactionStatusCounts.pending, color: statusColor.pending },
    { label: "Unpaid", value: transactionStatusCounts.unpaid, color: statusColor.unpaid },
  ];

  const scoreDescription =
    score >= 80
      ? "All clear. Keep it up — drive safely."
      : score >= 50
        ? "Action recommended. Resolve open items soon."
        : "Critical. Address unpaid infractions before driving.";

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.full_name ? ", " + profile.full_name.split(" ")[0] : ""}`}
        description="Manage your driver profile, vehicles, and infractions."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Vehicles"
          value={vehicles.length}
          icon={<Car className="h-4 w-4" />}
          accent="brand"
          hint={
            vehicles.length === 0
              ? "Register your first vehicle"
              : `${vehicles.filter((v) => v.insurance_status).length} insured · ${vehicles.filter((v) => v.inspection_status).length} inspected`
          }
        />
        <KpiCard
          label="Documents"
          value={docCount ?? 0}
          icon={<FileText className="h-4 w-4" />}
          accent="navy"
        />
        <KpiCard
          label="Open infractions"
          value={transactionStatusCounts.unpaid + transactionStatusCounts.pending}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent={
            transactionStatusCounts.unpaid + transactionStatusCounts.pending > 0
              ? "red"
              : "stone"
          }
          hint={
            transactionStatusCounts.pending > 0
              ? `${transactionStatusCounts.pending} pending payment`
              : "No outstanding fines"
          }
        />
        <KpiCard
          label="Total due"
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
                Fines accumulated — last 6 months
              </span>
            </CardTitle>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              Total: {formatCurrency(
                monthly.reduce((s, m) => s + m.value, 0)
              )}
            </span>
          </CardHeader>
          <CardBody>
            <LineChartCard
              data={monthly}
              valueFormat="currency-short"
              tickFormat="month"
              labelFormat="month"
              tooltipSeriesName="Total"
              ariaLabel="Total fines per month, last 6 months"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-navy-700 dark:text-navy-300" />
                Payment status
              </span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChartCard
              data={statusSlices}
              valueFormat="number"
              ariaLabel="Distribution of payment statuses for your infractions"
            />
            <div className="mt-2 grid grid-cols-3 text-center text-xs">
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrency(transactionTotals.paid)}
                </p>
                <p className="text-stone-500 dark:text-slate-400">Paid</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrency(transactionTotals.pending)}
                </p>
                <p className="text-stone-500 dark:text-slate-400">Pending</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  {formatCurrency(transactionTotals.unpaid)}
                </p>
                <p className="text-stone-500 dark:text-slate-400">Unpaid</p>
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
                Compliance score
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
              Formula: 100 minus {COMPLIANCE_RULES.unpaidInfractionPenalty} pts
              per unpaid infraction. Payment transactions are tracked separately;
              points are restored only when the infraction is marked paid. Scores
              at or below {COMPLIANCE_RULES.minimumAllowedToDrive}% require
              review before driving.
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent infractions</CardTitle>
            <Link
              href="/driver/infractions"
              className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {recent.length === 0 ? (
              <EmptyState
                title="No infractions"
                description="You currently have no infractions on record."
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
