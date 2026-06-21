"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { logVehicleCheckIn } from "@/app/staff/actions";
import { useI18n } from "@/i18n/context";

export function LogVehicleCheckIn({
  plate,
  country = "GA",
  vehicleId,
}: {
  plate: string;
  country?: string;
  vehicleId: string | null;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!location.trim()) {
      setError(t("staff.search.results.checkInLocationRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await logVehicleCheckIn({
        plate,
        country,
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
        {t("staff.search.results.checkInTrigger")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("staff.search.results.checkInTitle")}
        description={t("staff.search.results.checkInDescription", { plate })}
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t("staff.search.results.checkInLocation")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("staff.search.results.checkInLocationPlaceholder")}
            required
          />
          <Textarea
            label={t("staff.search.results.checkInNotesOptional")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("staff.search.results.checkInNotesPlaceholder")}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {t("staff.search.results.checkInCancel")}
            </Button>
            <Button type="button" loading={pending} onClick={submit}>
              {t("staff.search.results.checkInSave")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
