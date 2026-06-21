"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Textarea } from "@/components/ui/Textarea";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { DriverDocumentsTabs } from "@/components/documents/DriverDocumentsTabs";
import { DriverProfileComments } from "@/components/driver/DriverProfileComments";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  approveDriverProfile,
  getDriverProfileCommentsForStaff,
  postDriverProfileCommentAsStaff,
  rejectDriverProfile,
} from "./actions";
import { DriverDetailTabSkeleton } from "./DriverDetailTabSkeleton";
import {
  DETAIL_MODAL_TAB_PANEL_CLASS,
  DETAIL_MODAL_TAB_SWITCH_MS,
} from "./detail-modal-layout";
import {
  DriverVerificationPanel,
  VerificationStatusBadge,
} from "./DriverVerificationPanel";
import type { Database } from "@/lib/types/database";

type Driver = Database["public"]["Tables"]["profiles"]["Row"];

type DriverVehicle = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number" | "registration_country" | "brand" | "model" | "verification_status"
>;

type TabId = "profile" | "documents" | "vehicles" | "comments" | "verify";

const BASE_TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "documents", label: "Documents" },
  { id: "vehicles", label: "Vehicles" },
  { id: "comments", label: "Comments" },
];

type Props = {
  driver: Driver;
  open: boolean;
  onClose: () => void;
  staffName: string;
  vehicles: DriverVehicle[];
  canManageDrivers: boolean;
};

export function DriverDetailModal({
  driver,
  open,
  onClose,
  staffName,
  vehicles,
  canManageDrivers,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [tabLoading, setTabLoading] = useState(false);
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const tabs = canManageDrivers
    ? [...BASE_TABS, { id: "verify" as const, label: "Verify" }]
    : BASE_TABS;

  const canApprove = driver.verification_status !== "active";
  const canReject = driver.verification_status !== "rejected";

  useEffect(() => {
    if (open) {
      setActiveTab("profile");
      setTabLoading(false);
      setActionFeedback(null);
      setRejectOpen(false);
      setRejectMessage("");
    }
  }, [open, driver.id]);

  useEffect(() => {
    if (!tabLoading) return;
    const id = window.setTimeout(() => setTabLoading(false), DETAIL_MODAL_TAB_SWITCH_MS);
    return () => clearTimeout(id);
  }, [activeTab, tabLoading]);

  const changeTab = (tab: TabId) => {
    if (tab === activeTab) return;
    setTabLoading(true);
    setActiveTab(tab);
  };

  const handleApprove = () => {
    setActionFeedback(null);
    startApprove(async () => {
      const result = await approveDriverProfile(driver.id);
      if (!result.ok) {
        setActionFeedback({ variant: "error", message: result.error });
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const handleReject = () => {
    const trimmed = rejectMessage.trim();
    if (!trimmed) {
      setActionFeedback({
        variant: "error",
        message: "Explain why the account is being rejected.",
      });
      return;
    }

    setActionFeedback(null);
    startReject(async () => {
      const result = await rejectDriverProfile(driver.id, trimmed);
      if (!result.ok) {
        setActionFeedback({ variant: "error", message: result.error });
        return;
      }
      setRejectOpen(false);
      router.refresh();
      onClose();
    });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={driver.full_name || driver.email || "Driver details"}
        description="Review profile, uploaded documents, and verification — actions stay pinned at the bottom."
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
                    onClick={() => {
                      setRejectMessage(driver.admin_message ?? "");
                      setRejectOpen(true);
                    }}
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
                    Approve driver
                  </Button>
                )}
                {canManageDrivers && (
                  <DriverVerificationPanel
                    userId={driver.id}
                    status={driver.verification_status ?? "pending_documents"}
                    adminMessage={driver.admin_message}
                    hideApprove
                    hideReject
                    compact
                  />
                )}
              </div>
            </div>
          </div>
        }
      >
        <div className={cn("flex flex-col", DETAIL_MODAL_TAB_PANEL_CLASS)}>
          <div
            role="tablist"
            aria-label="Driver details"
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

          <div
            role="tabpanel"
            className={cn(
              "flex-1 min-h-0 overflow-y-auto overscroll-y-contain",
              activeTab === "comments" && "flex flex-col"
            )}
          >
            {tabLoading ? (
              <DriverDetailTabSkeleton tab={activeTab} />
            ) : (
              <>
                {activeTab === "profile" && <ProfileTab driver={driver} />}
                {activeTab === "documents" && (
                  <DriverDocumentsTabs ownerId={driver.id} vehicles={vehicles} />
                )}
                {activeTab === "vehicles" && <VehiclesTab vehicles={vehicles} />}
                {activeTab === "comments" && (
                  <DriverProfileComments
                    driverProfileId={driver.id}
                    viewer={{
                      role: "staff",
                      displayName: staffName || "Staff member",
                    }}
                    loadComments={getDriverProfileCommentsForStaff}
                    sendComment={postDriverProfileCommentAsStaff}
                    embedded
                    fillHeight
                  />
                )}
                {activeTab === "verify" && canManageDrivers && (
                  <div className="space-y-4">
                    <p className="text-sm text-stone-600 dark:text-slate-400">
                      Compare documents with the profile, then approve or reject the
                      driver. Quick actions are also available in the footer.
                    </p>
                    <DriverVerificationPanel
                      userId={driver.id}
                      status={driver.verification_status ?? "pending_documents"}
                      adminMessage={driver.admin_message}
                      hideApprove
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject and lock driver account"
        description="The driver will see your message on their dashboard and cannot use the account until reviewed again."
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for rejection"
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
            rows={4}
            placeholder="Example: National ID photos are unreadable — please re-upload."
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={rejectPending}
              disabled={!rejectMessage.trim()}
              onClick={handleReject}
            >
              <Lock className="h-4 w-4 mr-1.5" />
              Reject / lock account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ProfileTab({ driver }: { driver: Driver }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40">
      <dt className="text-stone-500 dark:text-slate-400">Email</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100 break-all">
        {driver.email || "—"}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">Phone</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {driver.phone || "—"}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">Nationality</dt>
      <dd>
        <CountryBadge code={driver.nationality_country ?? "GA"} />
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">National ID</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {driver.national_id || "—"}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">License #</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {driver.driver_license || "—"}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">Address</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100 col-span-2">
        {driver.address || "—"}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">Joined</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {formatDate(driver.created_at)}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">Verification</dt>
      <dd>
        <VerificationStatusBadge
          status={driver.verification_status ?? "pending_documents"}
        />
      </dd>
      {driver.admin_message && (
        <>
          <dt className="text-stone-500 dark:text-slate-400 col-span-2">
            Last staff message
          </dt>
          <dd className="col-span-2 text-stone-700 dark:text-slate-300 italic">
            {driver.admin_message}
          </dd>
        </>
      )}
    </dl>
  );
}

function VehiclesTab({ vehicles }: { vehicles: DriverVehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-200 dark:border-slate-700 p-4 text-sm text-stone-500 dark:text-slate-400">
        No vehicles registered for this driver.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="text-left bg-stone-50/60 dark:bg-slate-900/60 text-stone-500 dark:text-slate-400">
          <tr>
            <th className="py-2 px-3 font-medium">Plate</th>
            <th className="py-2 px-3 font-medium">Country</th>
            <th className="py-2 px-3 font-medium">Vehicle</th>
            <th className="py-2 px-3 font-medium">Verification</th>
            <th className="py-2 px-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr
              key={vehicle.id}
              className="border-t border-stone-100 dark:border-slate-800"
            >
              <td className="py-2 px-3 font-mono font-semibold text-stone-900 dark:text-stone-100">
                {vehicle.plate_number}
              </td>
              <td className="py-2 px-3">
                <CountryBadge code={vehicle.registration_country} />
              </td>
              <td className="py-2 px-3 text-stone-700 dark:text-slate-300">
                {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "—"}
              </td>
              <td className="py-2 px-3">
                <VerificationStatusBadge
                  status={vehicle.verification_status ?? "pending_review"}
                />
              </td>
              <td className="py-2 px-3">
                <div className="flex justify-end">
                  <Link href={`/staff/vehicles?openVehicle=${vehicle.id}`}>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs py-1.5 px-3"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Verify vehicle
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
