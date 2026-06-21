"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/utils";
import { submitManualInfractionPayment } from "@/app/driver/payment-actions";
import { useI18n } from "@/i18n/context";
import type { DriverPaymentLedgerRow } from "./DriverPaymentsTable";

export function SubmitManualPaymentDialog({
  open,
  row,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  row: DriverPaymentLedgerRow | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useI18n();
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && row) {
      setAmount(String(row.summary.remaining));
      setReceipt(null);
      setError(null);
    }
  }, [open, row]);

  if (!row) return null;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("infractionId", row.infraction.id);
    formData.set("amount", amount);
    if (receipt) formData.set("receipt", receipt);

    const result = await submitManualInfractionPayment(formData);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSubmitted();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("driver.payments.submitDialog.title")}
      description={t("driver.payments.submitDialog.description", {
        plate: row.infraction.plate_number,
        remaining: formatCurrency(row.summary.remaining),
      })}
      className="max-w-md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="manual-payment-form" loading={loading}>
            {t("driver.payments.submitDialog.submit")}
          </Button>
        </div>
      }
    >
      <form id="manual-payment-form" className="space-y-4" onSubmit={handleSubmit}>
        {error && <Alert variant="error">{error}</Alert>}

        <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-900/40 p-3 text-sm space-y-1">
          <p className="flex justify-between gap-3">
            <span className="text-stone-500 dark:text-slate-400">
              {t("driver.payments.totalDue")}
            </span>
            <span className="font-medium">{formatCurrency(row.summary.totalDue)}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-stone-500 dark:text-slate-400">
              {t("driver.payments.paidSoFar")}
            </span>
            <span className="font-medium">{formatCurrency(row.summary.amountPaid)}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-stone-500 dark:text-slate-400">
              {t("driver.payments.remaining")}
            </span>
            <span className="font-semibold text-brand-700 dark:text-brand-300">
              {formatCurrency(row.summary.remaining)}
            </span>
          </p>
        </div>

        <Input
          label={t("driver.payments.submitDialog.amountLabel")}
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
            {t("driver.payments.submitDialog.receiptLabel")}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            className="block w-full text-sm text-stone-600 dark:text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600"
            onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
            required
          />
          <p className="text-xs text-stone-500 dark:text-slate-400">
            {t("driver.payments.submitDialog.receiptHint")}
          </p>
        </div>

        <Alert variant="info">{t("driver.payments.submitDialog.manualOnly")}</Alert>
      </form>
    </Modal>
  );
}
