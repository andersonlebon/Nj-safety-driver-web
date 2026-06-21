import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireDriverProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert } from "@/components/ui/Alert";
import { parseTableQuery } from "@/lib/pagination";
import { loadInfractionsPaginated } from "@/lib/queries/infractions";
import { formatCurrency } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/types/database";
import { DriverPaymentsTable } from "./DriverPaymentsTable";
import { getTranslations } from "@/i18n/server";

type LedgerTransaction = { amount: number | string; status: TransactionStatus };

/**
 * Loads every infraction + matching transaction for a driver exactly once.
 * Returns both the aggregate stats and the full transaction map so the page can
 * build the ledger rows without re-querying transactions.
 */
async function loadDriverPaymentLedger(
  supabase: ReturnType<typeof createClient>,
  driverId: string
) {
  const { data: infractions } = await supabase
    .from("infractions")
    .select("id, fine_amount, status")
    .eq("driver_id", driverId);

  const list = infractions ?? [];
  const infractionIds = list.map((infraction) => infraction.id);
  const { data: transactions } =
    infractionIds.length > 0
      ? await supabase
          .from("transactions")
          .select("infraction_id, amount, status")
          .in("infraction_id", infractionIds)
      : { data: [] };

  const transactionMap = new Map<string, LedgerTransaction>(
    (transactions ?? []).map((transaction) => [
      transaction.infraction_id,
      { amount: transaction.amount, status: transaction.status as TransactionStatus },
    ])
  );

  let unpaid = 0;
  let pending = 0;
  let paid = 0;
  let totalDue = 0;

  for (const infraction of list) {
    const transaction = transactionMap.get(infraction.id);
    const status = (transaction?.status ?? infraction.status) as TransactionStatus;
    const amount = Number(transaction?.amount ?? infraction.fine_amount);

    if (status === "unpaid" || status === "initialized") {
      unpaid += 1;
      totalDue += amount;
    } else if (status === "pending") {
      pending += 1;
    } else if (status === "paid") {
      paid += 1;
    }
  }

  return { stats: { unpaid, pending, paid, totalDue }, transactionMap };
}

export default async function DriverPaymentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile } = await requireDriverProfile();
  const { t } = await getTranslations();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);

  const [pageData, ledger] = await Promise.all([
    loadInfractionsPaginated(supabase, tableQuery, { driverId: profile.id }),
    loadDriverPaymentLedger(supabase, profile.id),
  ]);

  const { stats, transactionMap } = ledger;

  const ledgerRows = pageData.rows.map((infraction) => {
    const transaction = transactionMap.get(infraction.id);
    return {
      infraction,
      amount: Number(transaction?.amount ?? infraction.fine_amount),
      status: (transaction?.status ?? infraction.status) as TransactionStatus,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("driver.payments.title")}
        description={t("driver.payments.description")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("driver.payments.stats.totalDue")}
          value={formatCurrency(stats.totalDue)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard label={t("driver.payments.stats.unpaid")} value={stats.unpaid} />
        <StatCard label={t("driver.payments.stats.pending")} value={stats.pending} />
        <StatCard label={t("driver.payments.stats.paid")} value={stats.paid} />
      </div>

      <Alert variant="info">{t("driver.payments.manualNotice")}</Alert>

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            {t("driver.payments.ledgerTitle")}
          </h3>
          <DriverPaymentsTable
            pathname="/driver/payments"
            query={pageData.query}
            totalCount={pageData.totalCount}
            rows={ledgerRows}
          />
        </CardBody>
      </Card>
    </div>
  );
}
