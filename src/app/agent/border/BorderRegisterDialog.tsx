"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/ui/FormDialog";
import { StepWizard, StepWizardFooter } from "@/components/ui/StepWizard";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { BORDER_CHECKPOINTS, type BorderCheckpoint } from "@/lib/countries";
import { registerBorderVehicle } from "@/app/agent/actions";
import { friendlyError } from "@/lib/errors";

const STEPS = ["Vehicle & direction", "Checkpoint", "Notes"];

export type BorderVehicleOption = {
  id: string;
  plate_number: string;
  registration_country: string;
  owner_name: string | null;
  owner_email: string | null;
};

type BorderForm = {
  vehicle_id: string;
  border_direction: "entry" | "exit";
  border_checkpoint: BorderCheckpoint;
  foreign_notes: string;
};

const emptyForm = (vehicleId = ""): BorderForm => ({
  vehicle_id: vehicleId,
  border_direction: "entry",
  border_checkpoint: BORDER_CHECKPOINTS[0],
  foreign_notes: "",
});

export function BorderRegisterDialog({
  vehicles,
}: {
  vehicles: BorderVehicleOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BorderForm>(
    emptyForm(vehicles[0]?.id ?? "")
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicle_id);

  const reset = () => {
    setStep(0);
    setError(null);
    setForm(emptyForm(vehicles[0]?.id ?? ""));
  };

  const submit = (close: () => void) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await registerBorderVehicle({
          ...form,
          id_documents: null,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        const plate = selectedVehicle?.plate_number ?? "";
        const country = selectedVehicle?.registration_country ?? "GA";
        reset();
        close();
        router.refresh();
        if (plate) {
          router.push(
            `/agent/search?plate=${encodeURIComponent(plate)}&country=${country}`
          );
        }
      } catch (err) {
        setError(friendlyError(err));
      }
    });
  };

  return (
    <FormDialog
      triggerLabel="Log border crossing"
      title="Border crossing"
      description="Register vehicle entry/exit against an existing driver and vehicle."
      modalClassName="max-w-2xl"
    >
      {({ close }) => (
        <div>
          <Alert variant="info" className="mb-4">
            Border crossings must be linked to a registered driver vehicle. If
            the driver is not in the system yet, use{" "}
            <Link href="/register" className="underline font-medium">
              driver registration
            </Link>
            {" "}first, then log this crossing.
          </Alert>
          <StepWizard steps={STEPS} currentStep={step} onStepChange={setStep} />
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          {step === 0 && (
            <div className="space-y-4">
              <Select
                label="Registered vehicle"
                value={form.vehicle_id}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    vehicle_id: e.target.value,
                  }))
                }
                disabled={vehicles.length === 0}
              >
                {vehicles.length === 0 ? (
                  <option value="">No registered vehicles available</option>
                ) : (
                  vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} ({vehicle.registration_country}) —{" "}
                      {vehicle.owner_name || vehicle.owner_email || "Driver"}
                    </option>
                  ))
                )}
              </Select>
              {selectedVehicle && (
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Selected driver:{" "}
                  {selectedVehicle.owner_name ||
                    selectedVehicle.owner_email ||
                    "registered account"}
                </p>
              )}
              <Select
                label="Direction"
                value={form.border_direction}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    border_direction: e.target.value as "entry" | "exit",
                  }))
                }
              >
                <option value="entry">Entry into Gabon</option>
                <option value="exit">Exit from Gabon</option>
              </Select>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Select
                label="Border checkpoint"
                value={form.border_checkpoint}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    border_checkpoint: e.target.value as BorderCheckpoint,
                  }))
                }
              >
                {BORDER_CHECKPOINTS.map((cp) => (
                  <option key={cp} value={cp}>
                    {cp}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Textarea
                label="Notes"
                value={form.foreign_notes}
                onChange={(e) => setForm((p) => ({ ...p, foreign_notes: e.target.value }))}
                rows={2}
              />
            </div>
          )}

          <StepWizardFooter
            step={step}
            totalSteps={STEPS.length}
            loading={pending}
            onBack={() => setStep((s) => Math.max(0, s - 1))}
            onCancel={close}
            onNext={() => {
              if (step === 0 && !form.vehicle_id) {
                setError("Select an existing registered vehicle.");
                return;
              }
              setError(null);
              setStep((s) => s + 1);
            }}
            onSubmit={() => submit(close)}
            submitLabel="Log crossing"
          />
        </div>
      )}
    </FormDialog>
  );
}
