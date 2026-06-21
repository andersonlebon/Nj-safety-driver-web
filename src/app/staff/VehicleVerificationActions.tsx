"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateVehicleVerification } from "@/app/staff/actions";
import { useI18n } from "@/i18n/context";
import { verificationStatusLabel } from "@/i18n/labels";
import type { VerificationStatus } from "@/lib/types/database";

export function VehicleVerificationActions({
  vehicleId,
  status,
}: {
  vehicleId: string;
  status: VerificationStatus;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const run = (next: "active" | "rejected" | "pending_review") => {
    startTransition(async () => {
      const result = await updateVehicleVerification(vehicleId, next);
      if (!result.ok) alert(result.error);
      else window.location.reload();
    });
  };

  return (
    <div className="flex items-center gap-1">
      <span className={`mr-2 ${status === "active" ? "badge-paid" : status === "rejected" ? "badge-unpaid" : "badge-pending"}`}>
        {verificationStatusLabel(t, status)}
      </span>
      {status !== "active" && (
        <Button
          type="button"
          variant="secondary"
          className="text-xs py-1 px-2"
          loading={pending}
          onClick={() => run("active")}
          title={t("vehicles.detail.verificationApproveTitle")}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}
      {status !== "rejected" && (
        <Button
          type="button"
          variant="danger"
          className="text-xs py-1 px-2"
          loading={pending}
          onClick={() => run("rejected")}
          title={t("vehicles.detail.verificationRejectTitle")}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
