"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getDriverInfractionPaymentDetail,
  type DriverInfractionPaymentDetail,
} from "@/app/driver/payment-actions";
import { friendlyError } from "@/lib/errors";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
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
  t: ReturnType<typeof useI18n>["t"]
) {
  switch (method) {
    case "manual":
      return t("driver.payments.methods.manual");
    case "mobile_money":
      return t("driver.payments.methods.mobile_money");
    case "card":
      return t("driver.payments.methods.card");
    case "bank_transfer":
      return t("driver.payments.methods.bank_transfer");
    default:
      return method;
  }
}

export function DriverInfractionPaymentDetailModal({
  infractionId,
  open,
  onClose,
  onPay,
}: {
  infractionId: string | null;
  open: boolean;
  onClose: () => void;
  onPay?: (detail: DriverInfractionPaymentDetail) => void;
}) {
  const { t } = useI18n();
  const emDash = t("driver.infractions.emptyValue");
  const [detail, setDetail] = useState<DriverInfractionPaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  useEffect(() => {
    if (!open || !infractionId) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getDriverInfractionPaymentDetail(infractionId).then((result) => {
      if (cancelled) return;
      if (!result) {
        setError(t("driver.infractions.detail.loadError"));
        setDetail(null);
      } else {
        setDetail(result);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, infractionId, t]);

  const viewEvidence = async (path: string) => {
    setEvidenceLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("evidence")
      .createSignedUrl(path, 60);
    setEvidenceLoading(false);
    if (signError) {
      setError(friendlyError(signError));
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const viewReceipt = async (path: string) => {
    setError(null);
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

  const canPay =
    detail &&
    onPay &&
    detail.summary.ledgerStatus !== "paid" &&
    detail.summary.remaining > 0 &&
    !detail.summary.hasPendingReview;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("driver.infractions.detail.title")}
      description={
        detail
          ? t("driver.infractions.detail.description", {
              plate: detail.infraction.plate_number,
            })
          : undefined
      }
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 w-full">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            {t("driver.infractions.detail.close")}
          </Button>
          {canPay && detail && (
            <Button
              type="button"
              onClick={() => onPay(detail)}
              className="w-full sm:w-auto"
            >
              {t("driver.infractions.detail.payNow")}
            </Button>
          )}
        </div>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-stone-500 dark:text-slate-400">
          {t("driver.infractions.detail.loading")}
        </p>
      ) : detail ? (
        <div className="space-y-6 max-h-[min(70vh,36rem)] overflow-y-auto pr-1">
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {t("driver.infractions.detail.sectionInfraction")}
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <DetailLabel>{t("driver.infractions.plate")}</DetailLabel>
                <DetailValue className="font-mono">{detail.infraction.plate_number}</DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.infractions.type")}</DetailLabel>
                <DetailValue>{detail.infraction.infraction_type}</DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.infractions.status")}</DetailLabel>
                <DetailValue>
                  <InfractionStatusBadge status={detail.summary.ledgerStatus} />
                </DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.infractions.amount")}</DetailLabel>
                <DetailValue>{formatCurrency(Number(detail.infraction.fine_amount))}</DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.infractions.location")}</DetailLabel>
                <DetailValue>{detail.infraction.location || emDash}</DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.infractions.date")}</DetailLabel>
                <DetailValue>{formatDate(detail.infraction.created_at)}</DetailValue>
              </div>
              <div className="sm:col-span-2">
                <DetailLabel>{t("driver.infractions.detail.descriptionLabel")}</DetailLabel>
                <DetailValue>{detail.infraction.description || emDash}</DetailValue>
              </div>
              <div className="sm:col-span-2">
                <DetailLabel>{t("driver.infractions.detail.evidence")}</DetailLabel>
                <DetailValue>
                  {detail.infraction.evidence_path ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs py-1.5"
                      loading={evidenceLoading}
                      onClick={() => void viewEvidence(detail.infraction.evidence_path as string)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t("driver.infractions.detail.viewEvidence")}
                    </Button>
                  ) : (
                    t("driver.infractions.detail.noEvidence")
                  )}
                </DetailValue>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {t("driver.infractions.detail.sectionPayment")}
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <DetailLabel>{t("driver.payments.totalDue")}</DetailLabel>
                <DetailValue>{formatCurrency(detail.summary.totalDue)}</DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.payments.paidSoFar")}</DetailLabel>
                <DetailValue>{formatCurrency(detail.summary.amountPaid)}</DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.payments.remaining")}</DetailLabel>
                <DetailValue>{formatCurrency(detail.summary.remaining)}</DetailValue>
              </div>
              <div>
                <DetailLabel>{t("driver.payments.transactions")}</DetailLabel>
                <DetailValue>{detail.summary.transactionCount}</DetailValue>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {t("driver.infractions.detail.sectionTransactions")}
            </h4>
            {detail.transactions.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-slate-400">
                {t("driver.infractions.detail.noTransactions")}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="text-left text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-2 px-3 font-medium">{t("driver.infractions.date")}</th>
                      <th className="py-2 px-3 font-medium">{t("driver.payments.amount")}</th>
                      <th className="py-2 px-3 font-medium">{t("driver.infractions.status")}</th>
                      <th className="py-2 px-3 font-medium">{t("driver.infractions.detail.receipt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-t border-stone-100 dark:border-slate-800 align-top"
                      >
                        <td className="py-2 px-3 whitespace-nowrap">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {formatCurrency(Number(transaction.amount))}
                          <span className="block text-xs text-stone-500 dark:text-slate-400 font-normal">
                            {paymentMethodLabel(transaction.payment_method, t)}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <InfractionStatusBadge status={transaction.status} />
                          {transaction.rejection_reason && (
                            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                              {transaction.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {transaction.receipt_path ? (
                            <Button
                              type="button"
                              variant="secondary"
                              className="text-xs py-1.5"
                              onClick={() =>
                                void viewReceipt(transaction.receipt_path as string)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-stone-400">{emDash}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
