"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { VehicleForm } from "./VehicleForm";

export function AddVehicleDialog({ ownerId }: { ownerId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add vehicle
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register a vehicle"
        description="Add a new vehicle in two quick steps. Upload photos from Documents afterward."
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
