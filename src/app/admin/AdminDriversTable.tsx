"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { StaffDocumentsLoader } from "@/components/documents/StaffDocumentsLoader";
import { formatDate } from "@/lib/utils";
import { RoleBadge, RoleChanger } from "./RoleChanger";
import {
  DriverVerificationPanel,
  VerificationStatusBadge,
} from "./DriverVerificationPanel";
import type { Database, UserRole } from "@/lib/types/database";

type Driver = Database["public"]["Tables"]["profiles"]["Row"];
type DriverVehicle = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number" | "registration_country" | "brand" | "model" | "verification_status"
>;

export function AdminDriversTable({
  drivers,
  staffId,
  staffRole,
  vehiclesByDriver = {},
  canManageDrivers = staffRole === "admin",
}: {
  drivers: Driver[];
  staffId: string;
  staffRole: UserRole;
  vehiclesByDriver?: Record<string, DriverVehicle[]>;
  canManageDrivers?: boolean;
}) {
  const [selected, setSelected] = useState<Driver | null>(null);

  const open = (driver: Driver) => setSelected(driver);
  const close = () => setSelected(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Phone</th>
              <th className="py-2 pr-4 font-medium">Nationality</th>
              <th className="py-2 pr-4 font-medium">License #</th>
              <th className="py-2 pr-4 font-medium">Joined</th>
              <th className="py-2 pr-4 font-medium">Verification</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr
                key={d.id}
                className="border-b border-stone-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors"
                onClick={() => open(d)}
              >
                <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                  {d.full_name || "—"}
                </td>
                <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                  {d.email || "—"}
                </td>
                <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                  {d.phone || "—"}
                </td>
                <td className="py-2 pr-4">
                  <CountryBadge code={d.nationality_country ?? "GA"} />
                </td>
                <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                  {d.driver_license || "—"}
                </td>
                <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                  {formatDate(d.created_at)}
                </td>
                <td className="py-2 pr-4">
                  <VerificationStatusBadge
                    status={d.verification_status ?? "pending_documents"}
                  />
                </td>
                <td className="py-2 pr-4">
                  <RoleBadge role={d.role as UserRole} />
                </td>
                <td className="py-2 pr-4" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    className="text-xs py-1.5 px-3 min-w-[6.5rem] shadow-sm"
                    onClick={() => open(d)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal
          open={Boolean(selected)}
          onClose={close}
          title={selected.full_name || selected.email || "Driver details"}
          description="Review profile, uploaded documents, and verification — actions stay pinned at the bottom."
          className="max-w-4xl"
          sectionNav={[
            { id: "driver-detail-profile", label: "Profile" },
            { id: "driver-detail-documents", label: "Documents" },
            { id: "driver-detail-vehicles", label: "Vehicles" },
            ...(canManageDrivers
              ? [
                  { id: "driver-detail-role", label: "Role" },
                  { id: "driver-detail-verification", label: "Verify" },
                ]
              : []),
          ]}
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:items-end gap-3 sm:justify-between">
              <Button type="button" variant="secondary" onClick={close} className="w-full sm:w-auto">
                Close
              </Button>
              {canManageDrivers && (
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400 mb-2">
                    Driver verification
                  </p>
                  <DriverVerificationPanel
                    userId={selected.id}
                    status={selected.verification_status ?? "pending_documents"}
                    adminMessage={selected.admin_message}
                  />
                </div>
              )}
            </div>
          }
        >
          <DriverDetailModalBody
            driver={selected}
            staffId={staffId}
            staffRole={staffRole}
            vehicles={vehiclesByDriver[selected.id] ?? []}
            canManageDrivers={canManageDrivers}
          />
        </Modal>
      )}
    </>
  );
}

function DriverDetailModalBody({
  driver,
  staffId,
  staffRole,
  vehicles,
  canManageDrivers,
}: {
  driver: Driver;
  staffId: string;
  staffRole: UserRole;
  vehicles: DriverVehicle[];
  canManageDrivers: boolean;
}) {
  return (
    <div className="space-y-6">
      <dl
        id="driver-detail-profile"
        className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40 scroll-mt-3"
      >
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
        <dt className="text-stone-500 dark:text-slate-400">Current role</dt>
        <dd>
          <RoleBadge role={driver.role as UserRole} />
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

      <StaffDocumentsLoader
        ownerId={driver.id}
        title="Driver documents"
        sectionId="driver-detail-documents"
        scope="driver"
      />

      <DriverVehiclesSection vehicles={vehicles} />

      {canManageDrivers && (
        <>
          <div
            id="driver-detail-role"
            className="space-y-3 border-t border-stone-200 dark:border-slate-800 pt-4 scroll-mt-3"
          >
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Change role
            </h3>
            <RoleChanger
              userId={driver.id}
              currentRole={driver.role as UserRole}
              isSelf={driver.id === staffId}
              actorRole={staffRole}
            />
          </div>

          <div
            id="driver-detail-verification"
            className="rounded-lg border border-dashed border-stone-200 dark:border-slate-700 p-3 text-sm text-stone-600 dark:text-slate-400 scroll-mt-3"
          >
            Compare documents above with the profile, then approve or reject using
            the actions pinned at the bottom.
          </div>
        </>
      )}
    </div>
  );
}

function DriverVehiclesSection({ vehicles }: { vehicles: DriverVehicle[] }) {
  return (
    <section
      id="driver-detail-vehicles"
      className="space-y-3 border-t border-stone-200 dark:border-slate-800 pt-4 scroll-mt-3"
    >
      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
        Vehicles and plates
      </h3>
      {vehicles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-200 dark:border-slate-700 p-3 text-sm text-stone-500 dark:text-slate-400">
          No vehicles registered for this driver.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="text-left bg-stone-50/60 dark:bg-slate-900/60 text-stone-500 dark:text-slate-400">
              <tr>
                <th className="py-2 px-3 font-medium">Plate</th>
                <th className="py-2 px-3 font-medium">Country</th>
                <th className="py-2 px-3 font-medium">Vehicle</th>
                <th className="py-2 px-3 font-medium">Verification</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
