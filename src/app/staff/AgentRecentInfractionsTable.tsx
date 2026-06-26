"use client";

import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { resolveLedgerStatus } from "@/lib/transactions";
import { useStaffVehicleDetailModal } from "@/hooks/use-staff-vehicle-detail-modal";
import { useI18n } from "@/i18n/context";
import type { InfractionDetail } from "@/components/infractions/InfractionDetailModal";
import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";

type Row = InfractionDetail & {
  status: PaymentStatus;
  registration_country?: string | null;
};

export function AgentRecentInfractionsTable({
  infractions,
  transactionStatusByInfraction,
  canManageVehicles = true,
  staffName,
}: {
  infractions: Row[];
  transactionStatusByInfraction: Record<string, TransactionStatus>;
  canManageVehicles?: boolean;
  staffName: string;
}) {
  const { t } = useI18n();
  const { openFromInfraction, modal } = useStaffVehicleDetailModal({
    canManageVehicles,
    staffName,
    transactionStatusByInfraction,
  });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-4 font-medium">{t("staff.overview.agent.date")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.overview.agent.plate")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.overview.agent.type")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.overview.agent.amount")}</th>
              <th className="py-2 pr-4 font-medium">{t("staff.overview.agent.status")}</th>
            </tr>
          </thead>
          <tbody>
            {infractions.map((infraction) => {
              const status = resolveLedgerStatus(
                infraction.status,
                transactionStatusByInfraction[infraction.id]
              );
              return (
                <tr
                  key={infraction.id}
                  className="border-b border-stone-100 dark:border-slate-800 last:border-0 cursor-pointer transition-colors hover:bg-stone-50/80 dark:hover:bg-slate-800/40"
                  onClick={() =>
                    openFromInfraction(infraction, { initialTab: "fines" })
                  }
                >
                  <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                    {formatDate(infraction.created_at)}
                  </td>
                  <td className="py-2 pr-4 font-mono font-medium text-stone-900 dark:text-stone-100">
                    {infraction.plate_number}
                  </td>
                  <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                    {infraction.infraction_type}
                  </td>
                  <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                    {formatCurrency(Number(infraction.fine_amount))}
                  </td>
                  <td className="py-2 pr-4">
                    <InfractionStatusBadge status={status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal}
    </>
  );
}
