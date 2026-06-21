"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { StepWizard, StepWizardFooter } from "@/components/ui/StepWizard";
import { PlateScanField } from "@/components/camera/PlateScanField";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { isDomesticCountry } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";
import { useI18n } from "@/i18n/context";

const COLOR_VALUES = [
  "Black",
  "White",
  "Silver",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Other",
] as const;

export function VehicleForm({
  ownerId,
  onSuccess,
}: {
  ownerId: string;
  onSuccess?: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const steps = useMemo(
    () => [
      t("driver.vehicles.form.stepCountryPlate"),
      t("driver.vehicles.form.stepDetails"),
      t("driver.vehicles.form.stepStatus"),
    ],
    [t]
  );
  const colorLabels = useMemo(
    () => ({
      Black: t("driver.vehicles.form.colorBlack"),
      White: t("driver.vehicles.form.colorWhite"),
      Silver: t("driver.vehicles.form.colorSilver"),
      Gray: t("driver.vehicles.form.colorGray"),
      Red: t("driver.vehicles.form.colorRed"),
      Blue: t("driver.vehicles.form.colorBlue"),
      Green: t("driver.vehicles.form.colorGreen"),
      Other: t("driver.vehicles.form.colorOther"),
    }),
    [t]
  );
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

  const plateRequiredError = t("driver.vehicles.form.errorPlateRequired");

  const handleSubmit = async () => {
    if (!form.plate_number.trim()) {
      setError(plateRequiredError);
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
      <StepWizard steps={steps} currentStep={step} onStepChange={setStep} />
      {error && <Alert variant="error">{error}</Alert>}
      {isForeign && (
        <Alert variant="info">{t("driver.vehicles.form.foreignAlert")}</Alert>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <Select
            label={t("driver.vehicles.form.registrationCountry")}
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
          <Input
            label={t("driver.vehicles.form.brand")}
            name="brand"
            value={form.brand}
            onChange={handleChange("brand")}
          />
          <Input
            label={t("driver.vehicles.form.model")}
            name="model"
            value={form.model}
            onChange={handleChange("model")}
          />
          <Select
            label={t("driver.vehicles.form.color")}
            name="color"
            value={form.color}
            onChange={handleChange("color")}
          >
            <option value="">{t("driver.vehicles.form.selectColor")}</option>
            {COLOR_VALUES.map((c) => (
              <option key={c} value={c}>
                {colorLabels[c]}
              </option>
            ))}
          </Select>
          <Input
            label={t("driver.vehicles.form.year")}
            type="number"
            min={1900}
            max={2100}
            name="year"
            value={form.year}
            onChange={handleChange("year")}
          />
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t("driver.vehicles.form.insurance")}
            name="insurance_status"
            value={form.insurance_status}
            onChange={handleChange("insurance_status")}
          >
            <option value="false">{t("driver.vehicles.form.notInsured")}</option>
            <option value="true">{t("driver.vehicles.form.insured")}</option>
          </Select>
          <Select
            label={t("driver.vehicles.form.inspection")}
            name="inspection_status"
            value={form.inspection_status}
            onChange={handleChange("inspection_status")}
          >
            <option value="false">{t("driver.vehicles.form.notInspected")}</option>
            <option value="true">{t("driver.vehicles.form.inspectionValid")}</option>
          </Select>
        </div>
      )}

      <StepWizardFooter
        step={step}
        totalSteps={steps.length}
        loading={loading}
        onBack={() => {
          setError(null);
          setStep((s) => Math.max(0, s - 1));
        }}
        onNext={() => {
          if (!form.plate_number.trim()) {
            setError(plateRequiredError);
            return;
          }
          setError(null);
          setStep((s) => Math.min(steps.length - 1, s + 1));
        }}
        onSubmit={handleSubmit}
        submitLabel={t("driver.vehicles.form.submit")}
      />
    </div>
  );
}
