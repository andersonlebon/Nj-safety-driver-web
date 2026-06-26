"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { StaffDocumentsLoader } from "@/components/documents/StaffDocumentsLoader";
import {
  VehicleDetailContent,
  type VehicleDetailSection,
} from "@/components/vehicles/VehicleDetailContent";
import { VehicleOwnerPanel } from "@/components/vehicles/VehicleOwnerPanel";
import { DriverProfileComments } from "@/components/driver/DriverProfileComments";
import { cn } from "@/lib/utils";
import {
  approveVehicleAsStaff,
  getVehicleCommentsForStaff,
  postVehicleCommentAsStaff,
  rejectVehicleAsStaff,
} from "./actions";
import {
  DETAIL_MODAL_TAB_PANEL_CLASS,
  DETAIL_MODAL_TAB_SWITCH_MS,
} from "./detail-modal-layout";
import { VehicleDetailTabSkeleton, type VehicleTabId } from "./DriverDetailTabSkeleton";
import { useI18n } from "@/i18n/context";
import type { TrackingEvent } from "@/lib/tracking";
import type { TransitIdDocRow, TransitIdDocUrls } from "@/lib/transit-id-documents";
import type { VehicleOwnerProfile } from "@/lib/vehicle-owner-profile";
import type { Database, TransactionStatus, VerificationStatus } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

type Props = {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  photoUrl?: string | null;
  owner?: VehicleOwnerProfile | null;
  infractions: Infraction[];
  transactionStatusByInfraction: Record<string, TransactionStatus>;
  trackingEvents: TrackingEvent[];
  transitIdDocuments: TransitIdDocRow[];
  transitIdUrls: TransitIdDocUrls;
  detailsLoading?: boolean;
  canManageVehicles: boolean;
  staffName: string;
  borderTransitHint?: ReactNode;
  initialTab?: VehicleTabId;
  /** View-only mode: no approve/reject footer. */
  readOnly?: boolean;
};

export function VehicleDetailModal({
  vehicle,
  open,
  onClose,
  photoUrl,
  owner,
  infractions,
  transactionStatusByInfraction,
  trackingEvents,
  transitIdDocuments,
  transitIdUrls,
  detailsLoading = false,
  canManageVehicles,
  staffName,
  borderTransitHint,
  initialTab = "overview",
  readOnly = false,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<VehicleTabId>(initialTab);
  const [tabLoading, setTabLoading] = useState(false);
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const showId =
    vehicle.is_border_transit ||
    Boolean(vehicle.transit_passport_id) ||
    transitIdDocuments.length > 0;
  const showOwner = Boolean(
    owner ||
      vehicle.transit_driver_name ||
      vehicle.transit_driver_phone ||
      vehicle.transit_passport_id
  );

  const tabs = useMemo(() => {
    const list: { id: VehicleTabId; label: string }[] = [
      { id: "overview", label: t("vehicles.detail.sections.overview") },
    ];
    if (showId) list.push({ id: "id", label: t("vehicles.detail.sections.idDocs") });
    if (showOwner) list.push({ id: "owner", label: t("vehicles.detail.sections.owner") });
    list.push({ id: "documents", label: t("vehicles.detail.sections.documents") });
    list.push({ id: "fines", label: t("vehicles.detail.sections.fines") });
    list.push({ id: "comments", label: t("vehicles.detail.sections.comments") });
    return list;
  }, [showId, showOwner, t]);

  const status = (vehicle.verification_status ?? "pending_review") as VerificationStatus;
  const showVerificationActions = canManageVehicles && !readOnly;
  const canApprove = showVerificationActions && status !== "active";
  const canReject = showVerificationActions && status !== "rejected";

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setTabLoading(false);
      setActionFeedback(null);
    }
  }, [open, vehicle.id, initialTab]);

  useEffect(() => {
    if (!tabLoading) return;
    const id = window.setTimeout(() => setTabLoading(false), DETAIL_MODAL_TAB_SWITCH_MS);
    return () => clearTimeout(id);
  }, [activeTab, tabLoading]);

  const changeTab = (tab: VehicleTabId) => {
    if (tab === activeTab) return;
    setTabLoading(true);
    setActiveTab(tab);
  };

  const handleApprove = () => {
    setActionFeedback(null);
    startApprove(async () => {
      const result = await approveVehicleAsStaff(vehicle.id);
      if (!result.ok) {
        setActionFeedback({ variant: "error", message: result.error });
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const handleReject = () => {
    if (!confirm(t("vehicles.detail.rejectConfirm"))) {
      return;
    }
    setActionFeedback(null);
    startReject(async () => {
      const result = await rejectVehicleAsStaff(vehicle.id);
      if (!result.ok) {
        setActionFeedback({ variant: "error", message: result.error });
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const sectionsForTab = (tab: VehicleTabId): VehicleDetailSection[] | undefined => {
    switch (tab) {
      case "overview": {
        const sections: VehicleDetailSection[] = ["summary", "registration"];
        if (!detailsLoading) {
          sections.push("fines");
          if (infractions.length > 0) sections.push("infractions");
          if (trackingEvents.length > 0) sections.push("tracking");
        }
        return sections;
      }
      case "id":
        return ["id"];
      case "fines":
        return ["fines", "infractions"];
      default:
        return undefined;
    }
  };

  const showTabSkeleton = tabLoading || (detailsLoading && activeTab !== "overview");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vehicle.plate_number}
      description={
        readOnly
          ? t("vehicles.detail.staffModalDescriptionReadOnly")
          : t("vehicles.detail.staffModalDescription")
      }
      className="max-w-4xl"
      footer={
        <div className="flex flex-col gap-3">
          {actionFeedback && (
            <Alert variant={actionFeedback.variant}>{actionFeedback.message}</Alert>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              {t("vehicles.detail.close")}
            </Button>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:justify-end">
              {canReject && (
                <Button
                  type="button"
                  variant="danger"
                  loading={rejectPending}
                  onClick={handleReject}
                  className="w-full sm:w-auto"
                >
                  <Lock className="h-4 w-4 mr-1.5" />
                  {t("vehicles.detail.rejectLock")}
                </Button>
              )}
              {canApprove && (
                <Button
                  type="button"
                  loading={approvePending}
                  onClick={handleApprove}
                  className="w-full sm:w-auto"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  {t("vehicles.detail.approveVehicle")}
                </Button>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className={cn("flex flex-col", DETAIL_MODAL_TAB_PANEL_CLASS)}>
        <div
          role="tablist"
          aria-label={t("vehicles.detail.sections.overview")}
          className="mb-4 flex shrink-0 flex-wrap gap-2 border-b border-stone-200 dark:border-slate-800 pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => changeTab(tab.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className={cn(
          "flex-1 min-h-0 overflow-y-auto overscroll-y-contain",
          activeTab === "comments" && "flex flex-col"
        )}>
          {showTabSkeleton ? (
            <VehicleDetailTabSkeleton tab={activeTab} />
          ) : (
            <>
              {activeTab === "documents" ? (
                <div className="space-y-4">
                  <StaffDocumentsLoader
                    ownerId={undefined}
                    vehicleId={vehicle.id}
                    title={t("vehicles.detail.vehicleDocumentsTitle")}
                    scope="vehicle"
                  />
                  {borderTransitHint}
                </div>
              ) : activeTab === "owner" ? (
                <VehicleOwnerPanel vehicle={vehicle} owner={owner ?? null} />
              ) : activeTab === "comments" ? (
                <div className="flex flex-col min-h-0 h-full space-y-3">
                  <p className="text-sm text-stone-600 dark:text-slate-400 shrink-0">
                    {t("vehicles.detail.comments.hint")}
                  </p>
                  <DriverProfileComments
                    driverProfileId={vehicle.id}
                    viewer={{
                      role: "staff",
                      displayName: staffName,
                    }}
                    loadComments={getVehicleCommentsForStaff}
                    sendComment={postVehicleCommentAsStaff}
                    embedded
                    fillHeight
                    copy={{
                      title: t("vehicles.detail.comments.title"),
                      empty: t("vehicles.detail.comments.empty"),
                      formLabel: t("vehicles.detail.comments.formLabel"),
                      formPlaceholder: t("vehicles.detail.comments.formPlaceholder"),
                      formSend: t("vehicles.detail.comments.formSend"),
                      loadingAria: t("vehicles.detail.comments.loadingAria"),
                      senderYou: t("vehicles.detail.comments.senderYou"),
                      errorEmpty: t("vehicles.detail.comments.errorEmpty"),
                    }}
                  />
                </div>
              ) : (
                <VehicleDetailContent
                  vehicle={vehicle}
                  photoUrl={photoUrl}
                  owner={owner}
                  infractions={infractions}
                  transactionStatusByInfraction={transactionStatusByInfraction}
                  trackingEvents={trackingEvents}
                  showOwner={showOwner}
                  transitIdDocuments={transitIdDocuments}
                  transitIdUrls={transitIdUrls}
                  showIdAuthenticityCheck
                  visibleSections={sectionsForTab(activeTab)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
