"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/i18n/context";
import { VehicleForm } from "./VehicleForm";

export function AddVehicleDialog({ ownerId }: { ownerId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        {t("driver.vehicles.addButton")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("driver.vehicles.addDialog.title")}
        description={t("driver.vehicles.addDialog.description")}
        className="max-w-xl"
      >
        <VehicleForm
          ownerId={ownerId}
          onSuccess={() => {
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
