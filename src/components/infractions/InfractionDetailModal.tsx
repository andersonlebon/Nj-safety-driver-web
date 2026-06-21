"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { useI18n } from "@/i18n/context";
import type { Database, PaymentStatus, TransactionStatus } from "@/lib/types/database";

export type InfractionDetail = Pick<
  Database["public"]["Tables"]["infractions"]["Row"],
  | "id"
  | "plate_number"
  | "infraction_type"
  | "description"
  | "location"
  | "fine_amount"
  | "status"
  | "evidence_path"
  | "vehicle_id"
  | "driver_id"
  | "agent_id"
  | "created_at"
  | "updated_at"
> & {
  registration_country?: string | null;
};

type Props = {
  infraction: InfractionDetail | null;
  open: boolean;
  onClose: () => void;
  ledgerStatus: PaymentStatus | TransactionStatus;
};

function DetailLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <dt className={["text-stone-500 dark:text-slate-400", className].filter(Boolean).join(" ")}>
      {children}
    </dt>
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

export function InfractionDetailModal({
  infraction,
  open,
  onClose,
  ledgerStatus,
}: Props) {
  const { t } = useI18n();
  const emptyValue = t("infractions.detail.emptyValue");
  const [error, setError] = useState<string | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  if (!infraction) return null;

  const country = infraction.registration_country ?? DEFAULT_COUNTRY;
  const searchHref = `/staff/search?plate=${encodeURIComponent(infraction.plate_number)}&country=${encodeURIComponent(country)}`;

  const viewEvidence = async () => {
    if (!infraction.evidence_path) return;
    setEvidenceLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("evidence")
      .createSignedUrl(infraction.evidence_path, 60);
    setEvidenceLoading(false);
    if (signError) {
      setError(friendlyError(signError));
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={infraction.infraction_type}
      description={t("infractions.detail.description", { plate: infraction.plate_number })}
      className="max-w-lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:justify-between">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            {t("infractions.detail.close")}
          </Button>
          <Link href={searchHref} className="btn-primary w-full sm:w-auto justify-center">
            <Search className="h-4 w-4" />
            {t("infractions.detail.openPlateSearch")}
          </Link>
        </div>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <DetailLabel>{t("infractions.detail.plate")}</DetailLabel>
        <DetailValue>
          <span className="font-mono">{infraction.plate_number}</span>
        </DetailValue>

        <DetailLabel>{t("infractions.detail.country")}</DetailLabel>
        <DetailValue>
          <CountryBadge code={country} />
        </DetailValue>

        <DetailLabel>{t("infractions.detail.type")}</DetailLabel>
        <DetailValue>{infraction.infraction_type}</DetailValue>

        <DetailLabel>{t("infractions.detail.status")}</DetailLabel>
        <DetailValue>
          <InfractionStatusBadge status={ledgerStatus} />
        </DetailValue>

        <DetailLabel>{t("infractions.detail.fineAmount")}</DetailLabel>
        <DetailValue>{formatCurrency(Number(infraction.fine_amount))}</DetailValue>

        <DetailLabel>{t("infractions.detail.location")}</DetailLabel>
        <DetailValue>{infraction.location || emptyValue}</DetailValue>

        <DetailLabel className="sm:col-span-1">{t("infractions.detail.descriptionLabel")}</DetailLabel>
        <DetailValue className="sm:col-span-1">{infraction.description || emptyValue}</DetailValue>

        <DetailLabel>{t("infractions.detail.filedOn")}</DetailLabel>
        <DetailValue>{formatDate(infraction.created_at)}</DetailValue>

        <DetailLabel>{t("infractions.detail.lastUpdated")}</DetailLabel>
        <DetailValue>{formatDate(infraction.updated_at)}</DetailValue>

        <DetailLabel>{t("infractions.detail.evidence")}</DetailLabel>
        <DetailValue>
          {infraction.evidence_path ? (
            <Button
              type="button"
              variant="secondary"
              loading={evidenceLoading}
              onClick={viewEvidence}
            >
              <Eye className="h-4 w-4" />
              {t("infractions.detail.viewEvidence")}
            </Button>
          ) : (
            t("infractions.detail.evidenceNone")
          )}
        </DetailValue>
      </dl>
    </Modal>
  );
}
