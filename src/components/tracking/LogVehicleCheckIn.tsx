"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { logVehicleCheckIn } from "@/app/agent/actions";

export function LogVehicleCheckIn({
  plate,
  vehicleId,
}: {
  plate: string;
  vehicleId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!location.trim()) {
      setError("Location is required for a check-in.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await logVehicleCheckIn({
        plate,
        vehicleId,
        location: location.trim(),
        notes: notes.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setLocation("");
      setNotes("");
      window.location.reload();
    });
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <MapPin className="h-4 w-4 mr-1.5" />
        Log check-in
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log vehicle check-in"
        description={`Record where you observed plate ${plate}. This helps build the vehicle tracking history.`}
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Boulevard Triomphal, Libreville"
            required
          />
          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Routine patrol, document check, etc."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" loading={pending} onClick={submit}>
              Save check-in
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
