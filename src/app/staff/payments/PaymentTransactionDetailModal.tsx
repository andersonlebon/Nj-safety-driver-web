"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  approvePaymentTransaction,
  rejectPaymentTransaction,
} from "@/app/staff/payment-actions";
import { fetchTransactionsForInfraction } from "@/lib/api/staff-payments";
import { friendlyError } from "@/lib/errors";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { StaffPaymentRow } from "@/lib/queries/payments";
import type { Database } from "@/lib/types/database";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-stone-500 dark:text-slate-400 text-sm">{children}</dt>
  );
}

function DetailValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <dd
      className={[
        "text-stone-900 dark:text-stone-100 font-medium break-words",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </dd>
  );
}

function paymentMethodLabel(
  method: TransactionRow["payment_method"],
  t: (key: string) => string
) {
  switch (method) {
    case "manual":
      return t("staff.payments.methodManual");
    case "mobile_money":
      return t("staff.payments.methodMobileMoney");
    case "card":
      return t("staff.payments.methodCard");
    case "bank_transfer":
      return t("staff.payments.methodBankTransfer");
    default:
      return method;
  }
}

export function PaymentTransactionDetailModal({
  row,
  open,
  onClose,
}: {
  row: StaffPaymentRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const emDash = t("staff.shared.emDash");
  const [related, setRelated] = useState<TransactionRow[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [busy, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !row) {
      setRelated([]);
      setRejectOpen(false);
      setRejectReason("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingRelated(true);
    void fetchTransactionsForInfraction(row.infraction_id).then((transactions) => {
      if (!cancelled) {
        setRelated(transactions);
        setLoadingRelated(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, row]);

  if (!row) return null;

  const infraction = row.infraction;
  const totalDue = Number(infraction.fine_amount);
  const paidSoFar = Number(infraction.amount_paid);
  const isPending = row.status === "pending";

  const viewReceipt = async (path: string) => {
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60);
    if (signError) {
      setError(friendlyError(signError));
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approvePaymentTransaction(row.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectPaymentTransaction(row.id, rejectReason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("staff.payments.detailTitle")}
      description={t("staff.payments.detailDescription")}
      className="max-w-2xl"
      footer={
        <div className="flex flex-col gap-3 w-full">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("staff.shared.close")}
            </Button>
            {isPending && (
              <div className="flex flex-wrap gap-2 justify-end">
                {rejectOpen ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setRejectOpen(false);
                        setRejectReason("");
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      loading={busy}
                      disabled={!rejectReason.trim()}
                      onClick={handleReject}
                    >
                      {t("staff.payments.confirmReject")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setRejectOpen(true)}
                    >
                      {t("staff.payments.reject")}
                    </Button>
                    <Button type="button" loading={busy} onClick={handleApprove}>
                      {t("staff.payments.approve")}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          {isPending && rejectOpen && (
            <Input
              label={t("staff.payments.rejectReasonLabel")}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
            />
          )}
        </div>
      }
    >
      <div className="space-y-6 max-h-[min(70vh,36rem)] overflow-y-auto pr-1">
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {t("staff.payments.detailTransactionSection")}
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <DetailLabel>{t("staff.payments.status")}</DetailLabel>
              <DetailValue>
                <InfractionStatusBadge status={row.status} />
              </DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.amount")}</DetailLabel>
              <DetailValue>{formatCurrency(Number(row.amount))}</DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.method")}</DetailLabel>
              <DetailValue>{paymentMethodLabel(row.payment_method, t)}</DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.submittedAt")}</DetailLabel>
              <DetailValue>{formatDate(row.created_at)}</DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.submittedBy")}</DetailLabel>
              <DetailValue>{row.submitter_name ?? emDash}</DetailValue>
            </div>
            {row.reviewed_at && (
              <div>
                <DetailLabel>{t("staff.payments.reviewedAt")}</DetailLabel>
                <DetailValue>{formatDate(row.reviewed_at)}</DetailValue>
              </div>
            )}
            {row.reviewer_name && (
              <div>
                <DetailLabel>{t("staff.payments.reviewedBy")}</DetailLabel>
                <DetailValue>{row.reviewer_name}</DetailValue>
              </div>
            )}
            {row.rejection_reason && (
              <div className="sm:col-span-2">
                <DetailLabel>{t("staff.payments.rejectReasonLabel")}</DetailLabel>
                <DetailValue>{row.rejection_reason}</DetailValue>
              </div>
            )}
            <div className="sm:col-span-2">
              <DetailLabel>{t("staff.payments.receipt")}</DetailLabel>
              <DetailValue>
                {row.receipt_path ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs py-1.5"
                    onClick={() => void viewReceipt(row.receipt_path as string)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t("staff.payments.viewReceipt")}
                  </Button>
                ) : (
                  t("staff.payments.noReceipt")
                )}
              </DetailValue>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {t("staff.payments.detailInfractionSection")}
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <DetailLabel>{t("staff.payments.plate")}</DetailLabel>
              <DetailValue className="font-mono">{infraction.plate_number}</DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.country")}</DetailLabel>
              <DetailValue>
                <CountryBadge code={infraction.registration_country ?? "GA"} />
              </DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.driver")}</DetailLabel>
              <DetailValue>
                {row.driver_name ?? t("staff.payments.unknownDriver")}
              </DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.infraction")}</DetailLabel>
              <DetailValue>{infraction.infraction_type}</DetailValue>
            </div>
            <div className="sm:col-span-2">
              <DetailLabel>{t("staff.payments.location")}</DetailLabel>
              <DetailValue>{infraction.location || emDash}</DetailValue>
            </div>
            <div className="sm:col-span-2">
              <DetailLabel>{t("staff.payments.infractionDescription")}</DetailLabel>
              <DetailValue>{infraction.description || emDash}</DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.fineTotal")}</DetailLabel>
              <DetailValue>{formatCurrency(totalDue)}</DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.progress")}</DetailLabel>
              <DetailValue>
                {formatCurrency(paidSoFar)} / {formatCurrency(totalDue)}
              </DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.infractionStatus")}</DetailLabel>
              <DetailValue>
                <InfractionStatusBadge status={infraction.status} />
              </DetailValue>
            </div>
            <div>
              <DetailLabel>{t("staff.payments.infractionDate")}</DetailLabel>
              <DetailValue>{formatDate(infraction.created_at)}</DetailValue>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {t("staff.payments.detailHistorySection")}
          </h4>
          {loadingRelated ? (
            <p className="text-sm text-stone-500 dark:text-slate-400">
              {t("staff.payments.loadingHistory")}
            </p>
          ) : related.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-slate-400">
              {t("staff.payments.noHistory")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="text-left text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="py-2 px-3 font-medium">{t("staff.payments.submittedAt")}</th>
                    <th className="py-2 px-3 font-medium">{t("staff.payments.amount")}</th>
                    <th className="py-2 px-3 font-medium">{t("staff.payments.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {related.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={[
                        "border-t border-stone-100 dark:border-slate-800",
                        transaction.id === row.id
                          ? "bg-brand-50/60 dark:bg-brand-950/30"
                          : "",
                      ].join(" ")}
                    >
                      <td className="py-2 px-3">{formatDate(transaction.created_at)}</td>
                      <td className="py-2 px-3 font-medium">
                        {formatCurrency(Number(transaction.amount))}
                      </td>
                      <td className="py-2 px-3">
                        <InfractionStatusBadge status={transaction.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
