import { Wallet } from "lucide-react";
import { requireAdminProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { createClient } from "@/lib/supabase/server";
import { parseTableQuery } from "@/lib/pagination";
import { loadStaffPaymentsPaginated } from "@/lib/queries/payments";
import { getTranslations } from "@/i18n/server";
import { StaffPaymentsTable } from "./StaffPaymentsTable";

export default async function StaffPaymentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  await requireAdminProfile();
  const { t } = await getTranslations();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadStaffPaymentsPaginated(supabase, tableQuery);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("staff.payments.title")}
        description={t("staff.payments.description")}
      />

      <Alert variant="info">{t("staff.payments.reviewNotice")}</Alert>

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {t("staff.payments.ledgerTitle")}
            </h3>
          </div>
          <StaffPaymentsTable
            pathname="/staff/payments"
            query={pageData.query}
            totalCount={pageData.totalCount}
            rows={pageData.rows}
          />
        </CardBody>
      </Card>
    </div>
  );
}
