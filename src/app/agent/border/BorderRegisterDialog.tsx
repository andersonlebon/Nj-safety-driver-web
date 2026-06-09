"use client";

import Link from "next/link";
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
import { friendlyError } from "@/lib/errors";

const STEPS = ["Vehicle & direction", "Checkpoint", "Details"];

type BorderForm = {
  registration_country: CountryCode;
  plate_number: string;
  border_direction: "entry" | "exit";
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
  border_direction: "entry",
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
        const plate = form.plate_number;
        const country = form.registration_country;
        reset();
        close();
        router.refresh();
        router.push(
          `/agent/search?plate=${encodeURIComponent(plate)}&country=${country}`
        );
      } catch (err) {
        setError(friendlyError(err));
      }
    });
  };

  return (
    <FormDialog
      triggerLabel="Log border crossing"
      title="Border crossing"
      description="Register vehicle entry/exit. New drivers should sign up at /register first (nationality + vehicle country)."
      modalClassName="max-w-2xl"
    >
      {({ close }) => (
        <div>
          <Alert variant="info" className="mb-4">
            For full identity verification use the same driver onboarding flow:{" "}
            <Link href="/register" className="underline font-medium">
              register account
            </Link>
            , upload ID & license (same as Gabon drivers), then add the vehicle
            with its origin country.
          </Alert>
          <StepWizard steps={STEPS} currentStep={step} onStepChange={setStep} />
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          {step === 0 && (
            <div className="space-y-4">
              <Select
                label="Vehicle origin (plate country)"
                value={form.registration_country}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    registration_country: e.target.value as CountryCode,
                  }))
                }
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </Select>
              <PlateScanField
                value={form.plate_number}
                onChange={(v) => setForm((p) => ({ ...p, plate_number: v }))}
              />
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
                  <option key={cp} value={cp}>{cp}</option>
                ))}
              </Select>
              <Input
                label="Driver name (if no account yet)"
                value={form.transit_driver_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transit_driver_name: e.target.value }))
                }
              />
              <Input
                label="Phone"
                value={form.transit_driver_phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transit_driver_phone: e.target.value }))
                }
              />
              <Input
                label="Passport / ID number (optional)"
                value={form.transit_passport_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transit_passport_id: e.target.value }))
                }
              />
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
                setError("Driver name is required when no registered account exists.");
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
