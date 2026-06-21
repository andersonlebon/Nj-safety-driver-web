"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { VerificationStatusBadge } from "@/app/staff/DriverVerificationPanel";
import type { VehicleOwnerProfile } from "@/lib/vehicle-owner-profile";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

type Props = {
  vehicle: Vehicle;
  owner: VehicleOwnerProfile | null;
};

export function VehicleOwnerPanel({ vehicle, owner }: Props) {
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
        No owner or transit driver is linked to this vehicle.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {isRegisteredDriver ? "Registered driver" : "Transit visitor"}
        </h3>
      </div>

      {isRegisteredDriver && owner ? (
        <>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40">
            <dt className="text-stone-500 dark:text-slate-400">Full name</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.full_name || "—"}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">Email</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 break-all">
              {owner.email || "—"}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">Phone</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.phone || "—"}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">Nationality</dt>
            <dd>
              <CountryBadge code={owner.nationality_country ?? "GA"} />
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">National ID</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.national_id || "—"}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">Driver license</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100">
              {owner.driver_license || "—"}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400 sm:col-span-2">
              Address
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 sm:col-span-2">
              {owner.address || "—"}
            </dd>
            <dt className="text-stone-500 dark:text-slate-400">Account status</dt>
            <dd>
              {owner.verification_status ? (
                <VerificationStatusBadge status={owner.verification_status} />
              ) : (
                "—"
              )}
            </dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Link href={`/staff/drivers?q=${encodeURIComponent(owner.email ?? owner.full_name ?? "")}`}>
              <Button type="button" variant="secondary" className="text-sm py-2 px-3">
                View in drivers list
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40">
          <dt className="text-stone-500 dark:text-slate-400">Name</dt>
          <dd className="font-medium text-stone-900 dark:text-stone-100">
            {vehicle.transit_driver_name || "—"}
          </dd>
          <dt className="text-stone-500 dark:text-slate-400">Phone</dt>
          <dd className="font-medium text-stone-900 dark:text-stone-100">
            {vehicle.transit_driver_phone || "—"}
          </dd>
          <dt className="text-stone-500 dark:text-slate-400">Passport / ID no.</dt>
          <dd className="font-medium font-mono text-stone-900 dark:text-stone-100">
            {vehicle.transit_passport_id || "—"}
          </dd>
          {vehicle.border_checkpoint && (
            <>
              <dt className="text-stone-500 dark:text-slate-400">Border checkpoint</dt>
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
