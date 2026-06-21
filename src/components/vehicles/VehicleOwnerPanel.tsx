"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { VerificationStatusBadge } from "@/app/staff/DriverVerificationPanel";
import { useI18n } from "@/i18n/context";
import type { VehicleOwnerProfile } from "@/lib/vehicle-owner-profile";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

type Props = {
  vehicle: Vehicle;
  owner: VehicleOwnerProfile | null;
};

export function VehicleOwnerPanel({ vehicle, owner }: Props) {
  const { t } = useI18n();
  const emDash = t("staff.shared.emDash");
  const isRegisteredDriver = Boolean(owner?.id);
  const isTransit =
    !isRegisteredDriver &&
    Boolean(
      vehicle.transit_driver_name ||
        vehicle.transit_driver_phone ||
        vehicle.transit_passport_id
    );

  if (!isRegisteredDriver && !isTransit) {
    return (
      <p className="rounded-lg border border-dashed border-stone-200 dark:border-slate-700 p-4 text-sm text-stone-500 dark:text-slate-400">
        {t("staff.vehicles.ownerPanel.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {isRegisteredDriver
            ? t("staff.vehicles.ownerPanel.registeredDriver")
            : t("staff.vehicles.ownerPanel.transitVisitor")}
        </h3>
      </div>

      {isRegisteredDriver && owner ? (
        <>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40">
            <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.fullName")}</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.full_name || emDash}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.email")}</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 break-all">
              {owner.email || emDash}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.phone")}</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.phone || emDash}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.nationality")}</dt>
            <dd>
              <CountryBadge code={owner.nationality_country ?? "GA"} />
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.nationalId")}</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.national_id || emDash}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.driverLicense")}</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.driver_license || emDash}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400 sm:col-span-2">
              {t("staff.vehicles.ownerPanel.address")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 sm:col-span-2">
              {owner.address || emDash}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.accountStatus")}</dt>
            <dd>
              {owner.verification_status ? (
                <VerificationStatusBadge status={owner.verification_status} />
              ) : (
                emDash
              )}
            </dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Link href={`/staff/drivers?q=${encodeURIComponent(owner.email ?? owner.full_name ?? "")}`}>
              <Button type="button" variant="secondary" className="text-sm py-2 px-3">
                {t("staff.vehicles.ownerPanel.viewInDriversList")}
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40">
          <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.name")}</dt>
          <dd className="font-medium text-stone-900 dark:text-stone-100">
            {vehicle.transit_driver_name || emDash}
          </dd>
          <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.phone")}</dt>
          <dd className="font-medium text-stone-900 dark:text-stone-100">
            {vehicle.transit_driver_phone || emDash}
          </dd>
          <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.passportId")}</dt>
          <dd className="font-medium font-mono text-stone-900 dark:text-stone-100">
            {vehicle.transit_passport_id || emDash}
          </dd>
          {vehicle.border_checkpoint && (
            <>
              <dt className="text-stone-500 dark:text-slate-400">{t("staff.vehicles.ownerPanel.borderCheckpoint")}</dt>
              <dd className="font-medium text-stone-900 dark:text-stone-100">
                {vehicle.border_checkpoint}
              </dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}
