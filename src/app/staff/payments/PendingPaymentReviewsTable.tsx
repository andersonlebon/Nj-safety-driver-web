"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, Wallet } from "lucide-react";
import {
  approvePaymentTransaction,
  rejectPaymentTransaction,
} from "@/app/staff/payment-actions";
import { friendlyError } from "@/lib/errors";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { PendingPaymentReviewRow } from "@/lib/queries/payments";

export function PendingPaymentReviewsTable({
  rows,
}: {
  rows: PendingPaymentReviewRow[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const approve = async (transactionId: string) => {
    setBusyId(transactionId);
    setError(null);
    const result = await approvePaymentTransaction(transactionId);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const reject = async (transactionId: string) => {
    setBusyId(transactionId);
    setError(null);
    const result = await rejectPaymentTransaction(transactionId, rejectReason);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRejectingId(null);
    setRejectReason("");
    router.refresh();
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="h-8 w-8" />}
        title={t("staff.payments.emptyTitle")}
        description={t("staff.payments.emptyDescription")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.submittedAt")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.driver")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.plate")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.infraction")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.amount")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.progress")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.receipt")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.payments.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const totalDue = Number(row.infraction.fine_amount);
              const paidSoFar = Number(row.infraction.amount_paid);
              const afterApproval = paidSoFar + Number(row.amount);
              return (
                <tr
                  key={row.id}
                  className="border-b border-stone-100 dark:border-slate-800 last:border-0 align-top"
                >
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(row.created_at)}</td>
                  <td className="py-3 pr-4">{row.driver_name ?? t("staff.payments.unknownDriver")}</td>
                  <td className="py-3 pr-4 font-medium">{row.infraction.plate_number}</td>
                  <td className="py-3 pr-4">{row.infraction.infraction_type}</td>
                  <td className="py-3 pr-4 font-medium">{formatCurrency(Number(row.amount))}</td>
                  <td className="py-3 pr-4 text-xs text-stone-600 dark:text-slate-400">
                    {formatCurrency(paidSoFar)} / {formatCurrency(totalDue)}
                    <span className="block mt-1">
                      {t("staff.payments.afterApproval", {
                        amount: formatCurrency(afterApproval),
                        total: formatCurrency(totalDue),
                      })}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {row.receipt_path ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs py-1.5"
                        onClick={() => void viewReceipt(row.receipt_path as string)}
                      >
                        <Eye className="h-4 w-4" />
                        {t("staff.payments.viewReceipt")}
                      </Button>
                    ) : (
                      <span className="text-xs text-stone-400">{t("staff.payments.noReceipt")}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 min-w-[220px]">
                    {rejectingId === row.id ? (
                      <div className="space-y-2">
                        <Input
                          label={t("staff.payments.rejectReasonLabel")}
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="text-xs py-1.5"
                            disabled={busyId === row.id}
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                          >
                            {t("common.cancel")}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            className="text-xs py-1.5"
                            loading={busyId === row.id}
                            onClick={() => void reject(row.id)}
                          >
                            {t("staff.payments.confirmReject")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="text-xs py-1.5"
                          loading={busyId === row.id}
                          onClick={() => void approve(row.id)}
                        >
                          {t("staff.payments.approve")}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs py-1.5"
                          disabled={busyId === row.id}
                          onClick={() => setRejectingId(row.id)}
                        >
                          {t("staff.payments.reject")}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
