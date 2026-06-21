"use client";

import { DriverProfileComments } from "@/components/driver/DriverProfileComments";
import {
  getDriverProfileCommentsForDriver,
  postDriverProfileCommentAsDriver,
} from "@/app/driver/actions";

type Props = {
  driverProfileId: string;
  driverName: string;
};

export function DriverProfileCommentsPanel({
  driverProfileId,
  driverName,
}: Props) {
  return (
    <DriverProfileComments
      driverProfileId={driverProfileId}
      viewer={{ role: "driver", displayName: driverName }}
      loadComments={async () => getDriverProfileCommentsForDriver()}
      sendComment={postDriverProfileCommentAsDriver}
      embedded
    />
  );
}
