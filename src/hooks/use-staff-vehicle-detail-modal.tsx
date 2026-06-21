"use client";

import { useCallback, useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { VehicleDetailModal } from "@/app/staff/VehicleDetailModal";
import {
  InfractionDetailModal,
  type InfractionDetail,
} from "@/components/infractions/InfractionDetailModal";
import {
  fetchStaffVehicleDetailBundle,
  type StaffVehicleDetailBundle,
} from "@/lib/api/staff-vehicle-detail";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { resolveLedgerStatus } from "@/lib/transactions";
import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";
import type { VehicleTabId } from "@/app/staff/DriverDetailTabSkeleton";
import { useI18n } from "@/i18n/context";

type InfractionPick = InfractionDetail & {
  status: PaymentStatus;
  registration_country?: string | null;
};

type OpenOptions = {
  initialTab?: VehicleTabId;
};

export function useStaffVehicleDetailModal({
  canManageVehicles = false,
  transactionStatusByInfraction = {},
}: {
  canManageVehicles?: boolean;
  transactionStatusByInfraction?: Record<string, TransactionStatus>;
}) {
  const { t } = useI18n();
  const [bundle, setBundle] = useState<StaffVehicleDetailBundle | null>(null);
  const [fallbackInfraction, setFallbackInfraction] = useState<InfractionPick | null>(
    null
  );
  const [initialTab, setInitialTab] = useState<VehicleTabId>("overview");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const close = useCallback(() => {
    setBundle(null);
    setFallbackInfraction(null);
    setDetailsLoading(false);
  }, []);

  const openFromInfraction = useCallback(
    (infraction: InfractionPick, options?: OpenOptions) => {
      setInitialTab(options?.initialTab ?? "fines");
      setFallbackInfraction(null);
      setBundle(null);
      setDetailsLoading(true);

      startTransition(async () => {
        const result = await fetchStaffVehicleDetailBundle({
          plateNumber: infraction.plate_number,
          registrationCountry: infraction.registration_country ?? DEFAULT_COUNTRY,
          vehicleId: infraction.vehicle_id,
        });

        if (result) {
          setBundle(result);
          setFallbackInfraction(null);
        } else {
          setBundle(null);
          setFallbackInfraction(infraction);
        }
        setDetailsLoading(false);
      });
    },
    []
  );

  const fallbackLedgerStatus = fallbackInfraction
    ? resolveLedgerStatus(
        fallbackInfraction.status,
        transactionStatusByInfraction[fallbackInfraction.id]
      )
    : "unpaid";

  const modal = (
    <>
      {bundle && (
        <VehicleDetailModal
          vehicle={bundle.vehicle}
          open
          onClose={close}
          photoUrl={bundle.photoUrl}
          owner={bundle.owner}
          infractions={bundle.infractions}
          transactionStatusByInfraction={bundle.transactionStatusByInfraction}
          trackingEvents={bundle.trackingEvents}
          transitIdDocuments={bundle.transitIdDocuments}
          transitIdUrls={bundle.transitIdUrls}
          detailsLoading={detailsLoading || pending}
          canManageVehicles={canManageVehicles}
          initialTab={initialTab}
          readOnly
          borderTransitHint={
            bundle.vehicle.is_border_transit &&
            !bundle.vehicle.owner_id &&
            bundle.transitIdDocuments.length === 0 ? (
              <Alert variant="info">
                {t("infractions.detail.noLinkedDriver")}
              </Alert>
            ) : undefined
          }
        />
      )}

      {!bundle && fallbackInfraction && (
        <InfractionDetailModal
          infraction={fallbackInfraction}
          open
          onClose={close}
          ledgerStatus={fallbackLedgerStatus}
        />
      )}
    </>
  );

  return {
    openFromInfraction,
    close,
    modal,
    loading: detailsLoading || pending,
  };
}
