"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StaffDocumentsLoader } from "@/components/documents/StaffDocumentsLoader";
import { useI18n } from "@/i18n/context";

type VehicleTab = {
  id: string;
  plate_number: string;
  brand: string | null;
  model: string | null;
};

export function DriverDocumentsTabs({
  ownerId,
  vehicles,
}: {
  ownerId: string;
  vehicles: VehicleTab[];
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"driver" | string>("driver");

  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("driver")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            activeTab === "driver"
              ? "bg-brand-700 text-white"
              : "bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300"
          )}
        >
          {t("staff.drivers.detail.documentsDriver")}
        </button>
        {vehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => setActiveTab(vehicle.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold font-mono transition-colors",
              activeTab === vehicle.id
                ? "bg-brand-700 text-white"
                : "bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {vehicle.plate_number}
          </button>
        ))}
      </div>

      {activeTab === "driver" ? (
        <StaffDocumentsLoader
          ownerId={ownerId}
          title={t("staff.drivers.detail.documentsDriverTitle")}
          scope="driver"
        />
      ) : activeVehicle ? (
        <StaffDocumentsLoader
          ownerId={ownerId}
          vehicleId={activeVehicle.id}
          title={t("staff.drivers.detail.documentsVehicleTitle", {
            plate: activeVehicle.plate_number,
          })}
          scope="vehicle"
        />
      ) : null}
    </div>
  );
}
