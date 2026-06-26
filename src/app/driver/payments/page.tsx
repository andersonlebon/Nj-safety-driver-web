import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireDriverProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert } from "@/components/ui/Alert";
import { parseTableQuery } from "@/lib/pagination";
import { loadInfractionsPaginated } from "@/lib/queries/infractions";
import { loadTransactionsByInfractionIds } from "@/lib/queries/payments";
import { summarizeInfractionPayment } from "@/lib/payments";
import { formatCurrency } from "@/lib/utils";
import { DriverPaymentsTable } from "./DriverPaymentsTable";
import { getTranslations } from "@/i18n/server";

export default async function DriverPaymentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile } = await requireDriverProfile();
  const { t } = await getTranslations();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);

  const pageData = await loadInfractionsPaginated(supabase, tableQuery, {
    driverId: profile.id,
  });

  const infractionIds = pageData.rows.map((row) => row.id);
  const transactionsByInfraction = await loadTransactionsByInfractionIds(
    supabase,
    infractionIds
  );

  const ledgerRows = pageData.rows.map((infraction) => ({
    infraction,
    summary: summarizeInfractionPayment({
      fineAmount: infraction.fine_amount,
      amountPaid: infraction.amount_paid,
      paymentTransactionCount: infraction.payment_transaction_count,
      infractionStatus: infraction.status,
      transactions: transactionsByInfraction[infraction.id] ?? [],
    }),
  }));

  const stats = ledgerRows.reduce(
    (acc, { summary }) => {
      if (summary.ledgerStatus === "paid") acc.paid += 1;
      else if (summary.ledgerStatus === "pending") acc.pending += 1;
      else acc.unpaid += 1;
      acc.totalDue += summary.remaining;
      return acc;
    },
    { unpaid: 0, pending: 0, paid: 0, totalDue: 0 }
  );

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
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
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
