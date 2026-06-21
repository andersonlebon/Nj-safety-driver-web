import { Wallet } from "lucide-react";
import { requireAdminProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { createClient } from "@/lib/supabase/server";
import { loadPendingPaymentReviews } from "@/lib/queries/payments";
import { getTranslations } from "@/i18n/server";
import { PendingPaymentReviewsTable } from "./PendingPaymentReviewsTable";

export default async function StaffPaymentsPage() {
  await requireAdminProfile();
  const { t } = await getTranslations();
  const supabase = createClient();
  const rows = await loadPendingPaymentReviews(supabase);

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
              {t("staff.payments.pendingTitle", { count: rows.length })}
            </h3>
          </div>
          <PendingPaymentReviewsTable rows={rows} />
        </CardBody>
      </Card>
    </div>
  );
}
