"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { VehicleDetailContent } from "./VehicleDetailContent";
import { DriverVehicleCommentsPanel } from "@/app/driver/vehicles/DriverVehicleCommentsPanel";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { TrackingEvent } from "@/lib/tracking";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

type TabId = "overview" | "registration" | "fines" | "tracking" | "comments";

export function VehicleDetailModal({
  open,
  onClose,
  vehicle,
  driverName,
  photoUrl,
  owner,
  infractions,
  trackingEvents,
  agentSearchUrl,
  showOwner = true,
}: {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  driverName: string;
  photoUrl?: string | null;
  owner?: { full_name: string | null; email: string | null; phone: string | null } | null;
  infractions?: Infraction[];
  trackingEvents?: TrackingEvent[];
  agentSearchUrl?: string;
  showOwner?: boolean;
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const hasInfractions = (infractions?.length ?? 0) > 0;
  const hasTracking = (trackingEvents?.length ?? 0) > 0;

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string }[] = [
      { id: "overview", label: t("driver.vehicles.detail.sectionOverview") },
      { id: "registration", label: t("driver.vehicles.detail.sectionRegistration") },
      { id: "fines", label: t("driver.vehicles.detail.sectionFines") },
    ];
    if (hasTracking) {
      list.push({ id: "tracking", label: t("driver.vehicles.detail.sectionTracking") });
    }
    list.push({ id: "comments", label: t("driver.vehicles.detail.sectionComments") });
    return list;
  }, [hasTracking, t]);

  useEffect(() => {
    if (open) setActiveTab("overview");
  }, [open, vehicle.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("driver.vehicles.detail.modalTitle", { plate: vehicle.plate_number })}
      description={t("driver.vehicles.detail.modalDescription")}
      className="max-w-xl"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("driver.vehicles.detail.close")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col min-h-[min(58vh,28rem)] max-h-[min(58vh,28rem)]">
        <div
          role="tablist"
          aria-label={t("driver.vehicles.detail.modalTitle", { plate: vehicle.plate_number })}
          className="mb-4 flex shrink-0 flex-wrap gap-2 border-b border-stone-200 dark:border-slate-800 pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          {activeTab === "comments" ? (
            <div className="flex flex-col min-h-0 h-full space-y-3">
              <p className="text-sm text-stone-600 dark:text-slate-400 shrink-0">
                {t("driver.vehicles.detail.comments.hint")}
              </p>
              <DriverVehicleCommentsPanel
                vehicleId={vehicle.id}
                driverName={driverName}
                embedded
                fillHeight
              />
            </div>
          ) : (
            <VehicleDetailContent
              vehicle={vehicle}
              photoUrl={photoUrl}
              owner={owner}
              infractions={infractions}
              trackingEvents={trackingEvents}
              agentSearchUrl={agentSearchUrl}
              showOwner={showOwner}
              visibleSections={
                activeTab === "overview"
                  ? ["summary", "fines"]
                  : activeTab === "registration"
                    ? ["registration"]
                    : activeTab === "fines"
                      ? hasInfractions
                        ? ["fines", "infractions"]
                        : ["fines"]
                      : ["tracking"]
              }
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
