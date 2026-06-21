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
import { useI18n } from "@/i18n/context";
import type { Database } from "@/lib/types/database";

type Driver = Database["public"]["Tables"]["profiles"]["Row"];

type DriverVehicle = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number" | "registration_country" | "brand" | "model" | "verification_status"
>;

type TabId = "profile" | "documents" | "vehicles" | "comments" | "verify";

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
  const { t } = useI18n();
  const emDash = t("staff.shared.emDash");
  const baseTabs: { id: TabId; label: string }[] = [
    { id: "profile", label: t("staff.drivers.detail.tabProfile") },
    { id: "documents", label: t("staff.drivers.detail.tabDocuments") },
    { id: "vehicles", label: t("staff.drivers.detail.tabVehicles") },
    { id: "comments", label: t("staff.drivers.detail.tabComments") },
  ];
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
    ? [...baseTabs, { id: "verify" as const, label: t("staff.drivers.detail.tabVerify") }]
    : baseTabs;

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
        message: t("staff.drivers.detail.rejectValidation"),
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
        title={driver.full_name || driver.email || t("staff.drivers.detail.titleFallback")}
        description={t("staff.drivers.detail.description")}
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
                {t("staff.drivers.detail.close")}
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
                    {t("staff.drivers.detail.rejectLock")}
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
                    {t("staff.drivers.detail.approveDriver")}
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
            aria-label={t("staff.drivers.detail.tabsAriaLabel")}
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
                {activeTab === "profile" && <ProfileTab driver={driver} emDash={emDash} t={t} />}
                {activeTab === "documents" && (
                  <DriverDocumentsTabs ownerId={driver.id} vehicles={vehicles} />
                )}
                {activeTab === "vehicles" && <VehiclesTab vehicles={vehicles} t={t} emDash={emDash} />}
                {activeTab === "comments" && (
                  <DriverProfileComments
                    driverProfileId={driver.id}
                    viewer={{
                      role: "staff",
                      displayName: staffName || t("staff.shared.staffMemberFallback"),
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
                      {t("staff.drivers.detail.verifyTabHint")}
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
        title={t("staff.drivers.detail.rejectModalTitle")}
        description={t("staff.drivers.detail.rejectModalDescription")}
      >
        <div className="space-y-4">
          <Textarea
            label={t("staff.drivers.detail.rejectReasonLabel")}
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
            rows={4}
            placeholder={t("staff.drivers.detail.rejectReasonPlaceholder")}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRejectOpen(false)}
            >
              {t("staff.drivers.detail.rejectCancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={rejectPending}
              disabled={!rejectMessage.trim()}
              onClick={handleReject}
            >
              <Lock className="h-4 w-4 mr-1.5" />
              {t("staff.drivers.detail.rejectSubmit")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ProfileTab({
  driver,
  emDash,
  t,
}: {
  driver: Driver;
  emDash: string;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40">
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.email")}</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100 break-all">
        {driver.email || emDash}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.phone")}</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {driver.phone || emDash}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.nationality")}</dt>
      <dd>
        <CountryBadge code={driver.nationality_country ?? "GA"} />
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.nationalId")}</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {driver.national_id || emDash}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.license")}</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {driver.driver_license || emDash}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.address")}</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100 col-span-2">
        {driver.address || emDash}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.joined")}</dt>
      <dd className="font-medium text-stone-900 dark:text-stone-100">
        {formatDate(driver.created_at)}
      </dd>
      <dt className="text-stone-500 dark:text-slate-400">{t("staff.drivers.detail.verification")}</dt>
      <dd>
        <VerificationStatusBadge
          status={driver.verification_status ?? "pending_documents"}
        />
      </dd>
      {driver.admin_message && (
        <>
          <dt className="text-stone-500 dark:text-slate-400 col-span-2">
            {t("staff.drivers.detail.lastStaffMessage")}
          </dt>
          <dd className="col-span-2 text-stone-700 dark:text-slate-300 italic">
            {driver.admin_message}
          </dd>
        </>
      )}
    </dl>
  );
}

function VehiclesTab({
  vehicles,
  t,
  emDash,
}: {
  vehicles: DriverVehicle[];
  t: ReturnType<typeof useI18n>["t"];
  emDash: string;
}) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-200 dark:border-slate-700 p-4 text-sm text-stone-500 dark:text-slate-400">
        {t("staff.drivers.detail.vehiclesEmpty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="text-left bg-stone-50/60 dark:bg-slate-900/60 text-stone-500 dark:text-slate-400">
          <tr>
            <th className="py-2 px-3 font-medium">{t("staff.drivers.detail.vehiclePlate")}</th>
            <th className="py-2 px-3 font-medium">{t("staff.drivers.detail.vehicleCountry")}</th>
            <th className="py-2 px-3 font-medium">{t("staff.drivers.detail.vehicle")}</th>
            <th className="py-2 px-3 font-medium">{t("staff.drivers.detail.vehicleVerification")}</th>
            <th className="py-2 px-3 font-medium text-right">{t("staff.drivers.detail.vehicleActions")}</th>
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
                {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || emDash}
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
                      {t("staff.drivers.detail.verifyVehicle")}
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
