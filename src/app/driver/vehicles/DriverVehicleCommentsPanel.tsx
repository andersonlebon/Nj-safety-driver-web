"use client";

import { DriverProfileComments } from "@/components/driver/DriverProfileComments";
import {
  getVehicleCommentsForDriver,
  postVehicleCommentAsDriver,
} from "@/app/driver/actions";
import { useI18n } from "@/i18n/context";

type Props = {
  vehicleId: string;
  driverName: string;
  embedded?: boolean;
  fillHeight?: boolean;
};

export function DriverVehicleCommentsPanel({
  vehicleId,
  driverName,
  embedded = false,
  fillHeight = false,
}: Props) {
  const { t } = useI18n();

  return (
    <DriverProfileComments
      driverProfileId={vehicleId}
      viewer={{ role: "driver", displayName: driverName }}
      loadComments={getVehicleCommentsForDriver}
      sendComment={postVehicleCommentAsDriver}
      embedded={embedded}
      fillHeight={fillHeight}
      copy={{
        title: t("driver.vehicles.detail.comments.title"),
        empty: t("driver.vehicles.detail.comments.empty"),
        formLabel: t("driver.vehicles.detail.comments.formLabel"),
        formPlaceholder: t("driver.vehicles.detail.comments.formPlaceholder"),
        formSend: t("driver.vehicles.detail.comments.formSend"),
        loadingAria: t("driver.vehicles.detail.comments.loadingAria"),
        senderYou: t("driver.vehicles.detail.comments.senderYou"),
        errorEmpty: t("driver.vehicles.detail.comments.errorEmpty"),
      }}
    />
  );
}
