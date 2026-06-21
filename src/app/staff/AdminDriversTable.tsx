"use client";

import { useState } from "react";
import { Eye, Users } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { Button } from "@/components/ui/Button";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { formatDate } from "@/lib/utils";
import type { TableQuery } from "@/lib/pagination";
import { DriverDetailModal } from "./DriverDetailModal";
import { VerificationStatusBadge } from "./DriverVerificationPanel";
import type { Database, StaffRole } from "@/lib/types/database";

type Driver = Database["public"]["Tables"]["profiles"]["Row"];

type DriverVehicle = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number" | "registration_country" | "brand" | "model" | "verification_status"
>;

const VERIFICATION_FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending_review", label: "Pending review" },
  { value: "pending_documents", label: "Pending documents" },
  { value: "rejected", label: "Rejected" },
];

export function AdminDriversTable({
  pathname,
  query,
  totalCount,
  preserveParams,
  drivers,
  staffId,
  staffName,
  staffRole,
  vehiclesByDriver = {},
  canManageDrivers = staffRole === "admin",
}: {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  preserveParams?: Record<string, string>;
  drivers: Driver[];
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  vehiclesByDriver?: Record<string, DriverVehicle[]>;
  canManageDrivers?: boolean;
}) {
  const [selected, setSelected] = useState<Driver | null>(null);

  const open = (driver: Driver) => setSelected(driver);
  const close = () => setSelected(null);

  return (
    <>
      <PaginatedTableFrame
        pathname={pathname}
        query={query}
        totalCount={totalCount}
        preserveParams={preserveParams}
        statusOptions={VERIFICATION_FILTER_OPTIONS}
        statusLabel="Verification"
        searchPlaceholder="Name, email, phone, license…"
        emptyIcon={<Users className="h-8 w-8" />}
        emptyTitle="No drivers"
        unfilteredHint={`${totalCount} driver${totalCount === 1 ? "" : "s"}`}
      >
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
      </PaginatedTableFrame>

      {selected && (
        <DriverDetailModal
          driver={selected}
          open={Boolean(selected)}
          onClose={close}
          staffName={staffName}
          vehicles={vehiclesByDriver[selected.id] ?? []}
          canManageDrivers={canManageDrivers}
        />
      )}
    </>
  );
}
