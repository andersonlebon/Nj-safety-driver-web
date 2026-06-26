"use client";

import { useMemo, useState } from "react";
import { Eye, Users } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { Button } from "@/components/ui/Button";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { TableQuery } from "@/lib/pagination";
import { DriverDetailModal } from "./DriverDetailModal";
import { VerificationStatusBadge } from "./DriverVerificationPanel";
import type { Database, StaffRole } from "@/lib/types/database";

type Driver = Database["public"]["Tables"]["profiles"]["Row"];

type DriverVehicle = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number" | "registration_country" | "brand" | "model" | "verification_status"
>;

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
  canManageDrivers = true,
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
  const { t } = useI18n();
  const emDash = t("staff.shared.emDash");
  const verificationFilterOptions = useMemo(
    () => [
      { value: "active", label: t("staff.drivers.table.filterActive") },
      { value: "pending_review", label: t("staff.drivers.table.filterPendingReview") },
      { value: "pending_documents", label: t("staff.drivers.table.filterPendingDocuments") },
      { value: "rejected", label: t("staff.drivers.table.filterRejected") },
    ],
    [t]
  );
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
        statusOptions={verificationFilterOptions}
        statusLabel={t("staff.drivers.table.statusLabel")}
        searchPlaceholder={t("staff.drivers.table.searchPlaceholder")}
        emptyIcon={<Users className="h-8 w-8" />}
        emptyTitle={t("staff.drivers.table.emptyTitle")}
        unfilteredHint={t("staff.drivers.table.unfilteredHint", { count: totalCount })}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
              <tr>
                <th className="py-2 pr-4 font-medium">{t("staff.drivers.table.name")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.drivers.table.email")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.drivers.table.phone")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.drivers.table.nationality")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.drivers.table.license")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.drivers.table.joined")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.drivers.table.verification")}</th>
                <th className="py-2 pr-4 font-medium w-28">{t("staff.drivers.table.actions")}</th>
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
                    {d.full_name || emDash}
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {d.email || emDash}
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {d.phone || emDash}
                  </td>
                  <td className="py-2 pr-4">
                    <CountryBadge code={d.nationality_country ?? "GA"} />
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {d.driver_license || emDash}
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
                      {t("staff.drivers.table.viewDetails")}
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
