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
import { VehicleVerificationActions } from "./VehicleVerificationActions";
import { cn } from "@/lib/utils";
import {
  approveVehicleAsStaff,
  rejectVehicleAsStaff,
} from "./actions";
import {
  DETAIL_MODAL_TAB_PANEL_CLASS,
  DETAIL_MODAL_TAB_SWITCH_MS,
} from "./detail-modal-layout";
import { VehicleDetailTabSkeleton, type VehicleTabId } from "./DriverDetailTabSkeleton";
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
  borderTransitHint?: ReactNode;
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
  borderTransitHint,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<VehicleTabId>("overview");
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
    const list: { id: VehicleTabId; label: string }[] = [{ id: "overview", label: "Overview" }];
    if (showId) list.push({ id: "id", label: "ID docs" });
    if (showOwner) list.push({ id: "owner", label: "Owner" });
    list.push({ id: "documents", label: "Documents" });
    list.push({ id: "fines", label: "Fines" });
    if (canManageVehicles) list.push({ id: "verify", label: "Verify" });
    return list;
  }, [canManageVehicles, showId, showOwner]);

  const status = (vehicle.verification_status ?? "pending_review") as VerificationStatus;
  const canApprove = status !== "active";
  const canReject = status !== "rejected";

  useEffect(() => {
    if (open) {
      setActiveTab("overview");
      setTabLoading(false);
      setActionFeedback(null);
    }
  }, [open, vehicle.id]);

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
    if (!confirm("Reject and lock this vehicle? The owner may need staff review to use it again.")) {
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
      description="Review vehicle details, documents, and verification — actions stay pinned at the bottom."
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
              Close
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
                  Reject / lock
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
                  Approve vehicle
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
          aria-label="Vehicle details"
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

        <div role="tabpanel" className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          {showTabSkeleton ? (
            <VehicleDetailTabSkeleton tab={activeTab} />
          ) : (
            <>
              {activeTab === "documents" ? (
                <div className="space-y-4">
                  <StaffDocumentsLoader
                    ownerId={undefined}
                    vehicleId={vehicle.id}
                    title="Vehicle documents"
                    scope="vehicle"
                  />
                  {borderTransitHint}
                </div>
              ) : activeTab === "verify" && canManageVehicles ? (
                <div className="space-y-4">
                  <p className="text-sm text-stone-600 dark:text-slate-400">
                    Confirm registration papers and photos match this plate before
                    approving. Quick actions are also in the footer.
                  </p>
                  <VehicleVerificationActions vehicleId={vehicle.id} status={status} />
                </div>
              ) : activeTab === "owner" ? (
                <VehicleOwnerPanel vehicle={vehicle} owner={owner ?? null} />
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
