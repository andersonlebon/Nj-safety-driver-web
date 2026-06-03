"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { StepWizard, StepWizardFooter } from "@/components/ui/StepWizard";
import { PlateScanField } from "@/components/camera/PlateScanField";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { isDomesticCountry } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";

const STEPS = ["Country & plate", "Vehicle details", "Status"];

export function VehicleForm({
  ownerId,
  onSuccess,
}: {
  ownerId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    registration_country: DEFAULT_COUNTRY,
    plate_number: "",
    brand: "",
    model: "",
    color: "",
    year: "",
    insurance_status: "false",
    inspection_status: "false",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isForeign = !isDomesticCountry(form.registration_country);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.plate_number.trim()) {
      setError("Plate number is required.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const plate = normalizePlateForCountry(
      form.plate_number,
      form.registration_country
    );

    const { error: insertError } = await supabase.from("vehicles").insert({
      owner_id: ownerId,
      plate_number: plate,
      registration_country: form.registration_country,
      is_foreign: isForeign,
      is_border_transit: false,
      brand: form.brand || null,
      model: form.model || null,
      color: form.color || null,
      year: form.year ? Number(form.year) : null,
      insurance_status: form.insurance_status === "true",
      inspection_status: form.inspection_status === "true",
      verification_status: "pending_review",
    });

    if (insertError) {
      setError(friendlyError(insertError));
      setLoading(false);
      return;
    }

    await supabase.from("vehicle_tracking_events").insert({
      plate_number: plate,
      registration_country: form.registration_country,
      event_type: "registration",
      notes: isForeign ? "Foreign vehicle registered by driver" : "Vehicle registered",
    });

    setLoading(false);
    router.refresh();
    onSuccess?.();
  };

  return (
    <div className="space-y-4">
      <StepWizard steps={STEPS} currentStep={step} onStepChange={setStep} />
      {error && <Alert variant="error">{error}</Alert>}
      {isForeign && (
        <Alert variant="info">
          Foreign plate — ensure border documents are uploaded after registration.
        </Alert>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <Select
            label="Registration country"
            name="registration_country"
            value={form.registration_country}
            onChange={handleChange("registration_country")}
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
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Brand" name="brand" value={form.brand} onChange={handleChange("brand")} />
          <Input label="Model" name="model" value={form.model} onChange={handleChange("model")} />
          <Select label="Color" name="color" value={form.color} onChange={handleChange("color")}>
            <option value="">Select a color</option>
            {["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input label="Year" type="number" min={1900} max={2100} name="year" value={form.year} onChange={handleChange("year")} />
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Insurance" name="insurance_status" value={form.insurance_status} onChange={handleChange("insurance_status")}>
            <option value="false">Not insured</option>
            <option value="true">Insured</option>
          </Select>
          <Select label="Technical inspection" name="inspection_status" value={form.inspection_status} onChange={handleChange("inspection_status")}>
            <option value="false">Not inspected</option>
            <option value="true">Inspection valid</option>
          </Select>
        </div>
      )}

      <StepWizardFooter
        step={step}
        totalSteps={STEPS.length}
        loading={loading}
        onBack={() => { setError(null); setStep((s) => Math.max(0, s - 1)); }}
        onNext={() => {
          if (!form.plate_number.trim()) {
            setError("Plate number is required.");
            return;
          }
          setError(null);
          setStep((s) => Math.min(STEPS.length - 1, s + 1));
        }}
        onSubmit={handleSubmit}
        submitLabel="Register vehicle"
      />
    </div>
  );
}
