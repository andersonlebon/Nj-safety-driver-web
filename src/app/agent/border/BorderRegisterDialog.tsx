"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/ui/FormDialog";
import { StepWizard, StepWizardFooter } from "@/components/ui/StepWizard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { PlateScanField } from "@/components/camera/PlateScanField";
import { BORDER_CHECKPOINTS, COUNTRIES, type CountryCode, type BorderCheckpoint } from "@/lib/countries";
import { registerBorderVehicle } from "@/app/agent/actions";

const STEPS = ["Plate & country", "Driver & checkpoint", "Vehicle details"];

type BorderForm = {
  registration_country: CountryCode;
  plate_number: string;
  transit_driver_name: string;
  transit_driver_phone: string;
  transit_passport_id: string;
  border_checkpoint: BorderCheckpoint;
  brand: string;
  model: string;
  color: string;
  year: string;
  foreign_notes: string;
};

const emptyForm = (): BorderForm => ({
  registration_country: "CM",
  plate_number: "",
  transit_driver_name: "",
  transit_driver_phone: "",
  transit_passport_id: "",
  border_checkpoint: BORDER_CHECKPOINTS[0],
  brand: "",
  model: "",
  color: "",
  year: "",
  foreign_notes: "",
});

export function BorderRegisterDialog() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BorderForm>(emptyForm);

  const reset = () => {
    setStep(0);
    setError(null);
    setForm(emptyForm());
  };

  const submit = (close: () => void) => {
    startTransition(async () => {
      const result = await registerBorderVehicle(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
      close();
      router.refresh();
      router.push(
        `/agent/search?plate=${encodeURIComponent(form.plate_number)}&country=${form.registration_country}`
      );
    });
  };

  return (
    <FormDialog
      triggerLabel="Register border crossing"
      title="Border vehicle registration"
      description="Register a foreign or transit vehicle entering Gabon without a full driver account."
      modalClassName="max-w-xl"
    >
      {({ close }) => (
        <div>
          <StepWizard steps={STEPS} currentStep={step} onStepChange={setStep} />
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          {step === 0 && (
            <div className="space-y-4">
              <Select
                label="Plate country"
                value={form.registration_country}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    registration_country: e.target.value as CountryCode,
                  }))
                }
              >
                {COUNTRIES.filter((c) => c.code !== "GA").map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </Select>
              <PlateScanField
                value={form.plate_number}
                onChange={(v) => setForm((p) => ({ ...p, plate_number: v }))}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Driver full name"
                value={form.transit_driver_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transit_driver_name: e.target.value }))
                }
                required
              />
              <Input
                label="Phone"
                value={form.transit_driver_phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transit_driver_phone: e.target.value }))
                }
              />
              <Input
                label="Passport / ID"
                value={form.transit_passport_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transit_passport_id: e.target.value }))
                }
              />
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
                  <option key={cp} value={cp}>{cp}</option>
                ))}
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Brand" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
                <Input label="Model" value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} />
                <Input label="Color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
                <Input label="Year" type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} />
              </div>
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
            onNext={() => {
              if (step === 0 && !form.plate_number.trim()) {
                setError("Plate is required.");
                return;
              }
              if (step === 1 && !form.transit_driver_name.trim()) {
                setError("Driver name is required.");
                return;
              }
              setError(null);
              setStep((s) => s + 1);
            }}
            onSubmit={() => submit(close)}
            submitLabel="Register at border"
          />
        </div>
      )}
    </FormDialog>
  );
}
