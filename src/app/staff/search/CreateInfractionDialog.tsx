"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileWarning } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { FormDialog } from "@/components/ui/FormDialog";
import { StepWizard, StepWizardFooter } from "@/components/ui/StepWizard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { PlateScanField } from "@/components/camera/PlateScanField";
import {
  EvidenceSlot,
  PHOTO_ACCEPT,
  type EvidenceSlotValue,
} from "@/components/uploads/EvidenceSlot";
import { formatCurrency } from "@/lib/utils";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";
import {
  CUSTOM_INFRACTION_TEMPLATE_CODE,
  INFRACTION_TEMPLATES,
  mergeInfractionTemplateOptions,
  type InfractionTemplate,
} from "@/lib/infraction-templates";
import { fileInfraction } from "@/app/staff/actions";
import { useI18n } from "@/i18n/context";

type TemplateOption = Pick<
  InfractionTemplate,
  "code" | "label" | "amount" | "points" | "category"
>;

export function CreateInfractionDialog({
  plate: fixedPlate,
  country: fixedCountry,
  vehicleId: fixedVehicleId,
  driverId: fixedDriverId,
  includePlateStep = false,
  templates = INFRACTION_TEMPLATES,
}: {
  plate?: string;
  country?: string;
  vehicleId?: string | null;
  driverId?: string | null;
  includePlateStep?: boolean;
  templates?: readonly TemplateOption[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const emDash = t("staff.shared.emDash");
  const templateOptions = useMemo(
    () => mergeInfractionTemplateOptions(templates),
    [templates]
  );
  const defaultTemplate = templateOptions[0] ?? INFRACTION_TEMPLATES[0];
  const detailStepLabels = [
    t("staff.search.fileInfraction.stepViolation"),
    t("staff.search.fileInfraction.stepEvidence"),
    t("staff.search.fileInfraction.stepReview"),
  ];
  const steps = includePlateStep
    ? [t("staff.search.fileInfraction.stepPlate"), ...detailStepLabels]
    : detailStepLabels;

  const [step, setStep] = useState(0);
  const [plateInput, setPlateInput] = useState(fixedPlate ?? "");
  const [countryInput, setCountryInput] = useState(fixedCountry ?? DEFAULT_COUNTRY);
  const [resolvedVehicleId, setResolvedVehicleId] = useState<string | null>(
    fixedVehicleId ?? null
  );
  const [resolvedDriverId, setResolvedDriverId] = useState<string | null>(
    fixedDriverId ?? null
  );

  const plate =
    fixedPlate ?? (plateInput.trim() ? normalizePlateForCountry(plateInput, countryInput) : "");
  const country = fixedCountry ?? countryInput;

  const detailStep = includePlateStep ? step - 1 : step;

  const [form, setForm] = useState({
    infraction_template_code: defaultTemplate.code,
    infraction_type: defaultTemplate.label,
    description: "",
    location: "",
    fine_amount: String(defaultTemplate.amount),
  });
  const [evidence, setEvidence] = useState<EvidenceSlotValue>({
    file: null,
    previewUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    if (code === CUSTOM_INFRACTION_TEMPLATE_CODE) {
      setForm((prev) => ({
        ...prev,
        infraction_template_code: code,
      }));
      return;
    }
    const template =
      templateOptions.find((option) => option.code === code) ?? defaultTemplate;
    setForm((prev) => ({
      ...prev,
      infraction_template_code: template.code,
      infraction_type: template.label,
      fine_amount: String(template.amount),
    }));
  };

  const resolvePlate = async () => {
    const q = normalizePlateForCountry(plateInput, countryInput);
    if (!q) {
      setError(t("staff.search.fileInfraction.errorValidPlate"));
      return false;
    }
    const supabase = createClient();
    const { data: v } = await supabase
      .from("vehicles")
      .select("id, owner_id")
      .eq("plate_number", q)
      .eq("registration_country", countryInput)
      .maybeSingle();
    setResolvedVehicleId(v?.id ?? null);
    setResolvedDriverId(v?.owner_id ?? null);
    return true;
  };

  const validateStep = (): string | null => {
    if (includePlateStep && step === 0) {
      if (!plateInput.trim()) return t("staff.search.fileInfraction.errorPlateRequired");
      return null;
    }
    if (detailStep === 0) {
      if (!form.infraction_type.trim()) {
        return t("staff.search.fileInfraction.errorTypeRequired");
      }
      if (!form.fine_amount) return t("staff.search.fileInfraction.errorAmountRequired");
    }
    return null;
  };

  const submit = async (close: () => void) => {
    if (!plate) {
      setError(t("staff.search.fileInfraction.errorPlateRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    let evidencePath: string | null = null;

    if (evidence.file) {
      const ext = evidence.file.name.split(".").pop() || "jpg";
      const path = `${plate}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(path, evidence.file, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        setError(friendlyError(uploadError));
        setLoading(false);
        return;
      }
      evidencePath = path;
    }

    const result = await fileInfraction({
      plate_number: plate,
      registration_country: country,
      vehicle_id: resolvedVehicleId,
      driver_id: resolvedDriverId,
      infraction_template_code: form.infraction_template_code,
      infraction_type: form.infraction_type,
      description: form.description,
      location: form.location,
      fine_amount: form.fine_amount,
      status: "unpaid",
      evidence_path: evidencePath,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(t("staff.search.fileInfraction.success"));
    setStep(0);
    setPlateInput("");
    setForm({
      infraction_template_code: defaultTemplate.code,
      infraction_type: defaultTemplate.label,
      description: "",
      location: "",
      fine_amount: String(defaultTemplate.amount),
    });
    setEvidence({ file: null, previewUrl: null });
    router.refresh();
    setTimeout(() => {
      close();
      setSuccess(null);
    }, 1200);
  };

  const titlePlate = plate || t("staff.search.fileInfraction.newPlateFallback");

  return (
    <FormDialog
      triggerLabel={
        <>
          <FileWarning className="h-4 w-4 mr-1.5" />
          {t("staff.search.fileInfraction.trigger")}
        </>
      }
      title={
        includePlateStep
          ? t("staff.search.fileInfraction.titleGeneric")
          : t("staff.search.fileInfraction.titleWithPlate", { plate: titlePlate })
      }
      description={t("staff.search.fileInfraction.description")}
      modalClassName="max-w-xl"
    >
      {({ close }) => (
        <div>
          <StepWizard steps={steps} currentStep={step} onStepChange={setStep} />
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {includePlateStep && step === 0 && (
            <div className="space-y-4 mt-4">
              <Select
                label={t("staff.search.fileInfraction.plateCountry")}
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </Select>
              <PlateScanField value={plateInput} onChange={setPlateInput} />
            </div>
          )}

          {detailStep === 0 && (!includePlateStep || step > 0) && (
            <div className="space-y-4 mt-4">
              <Select
                label={t("staff.search.fileInfraction.infractionTemplate")}
                name="infraction_template_code"
                value={form.infraction_template_code}
                onChange={handleTemplateChange}
              >
                {templateOptions.map((template) => (
                  <option key={template.code} value={template.code}>
                    {t("staff.search.fileInfraction.templateOptionFormat", {
                      label: template.label,
                      amount: formatCurrency(template.amount),
                    })}
                  </option>
                ))}
                <option value={CUSTOM_INFRACTION_TEMPLATE_CODE}>
                  {t("staff.search.fileInfraction.customTemplateOption")}
                </option>
              </Select>
              <Input
                label={t("staff.search.fileInfraction.infractionType")}
                name="infraction_type"
                value={form.infraction_type}
                onChange={handleChange("infraction_type")}
                placeholder={t("staff.search.fileInfraction.infractionTypePlaceholder")}
                required
              />
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {t("staff.search.fileInfraction.templateHint")}
              </p>
              <Textarea
                label={t("staff.search.fileInfraction.descriptionLabel")}
                name="description"
                value={form.description}
                onChange={handleChange("description")}
                placeholder={t("staff.search.fileInfraction.descriptionPlaceholder")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("staff.search.fileInfraction.location")}
                  name="location"
                  value={form.location}
                  onChange={handleChange("location")}
                />
                <Input
                  label={t("staff.search.fileInfraction.fineAmount")}
                  type="number"
                  min="0"
                  step="0.01"
                  name="fine_amount"
                  value={form.fine_amount}
                  readOnly={
                    form.infraction_template_code !== CUSTOM_INFRACTION_TEMPLATE_CODE
                  }
                  required
                />
              </div>
            </div>
          )}

          {detailStep === 1 && (
            <div className="mt-4">
              <EvidenceSlot
                title={t("staff.search.fileInfraction.evidenceTitle")}
                description={t("staff.search.fileInfraction.evidenceDescription")}
                accept={PHOTO_ACCEPT}
                value={evidence}
                onChange={setEvidence}
                showExpiry={false}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full text-sm"
                onClick={() => setStep((s) => s + 1)}
              >
                {t("staff.search.fileInfraction.skipPhoto")}
              </Button>
            </div>
          )}

          {detailStep === 2 && (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/50">
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staff.search.fileInfraction.reviewPlate")}
              </dt>
              <dd className="font-medium">{plate}</dd>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staff.search.fileInfraction.reviewType")}
              </dt>
              <dd className="font-medium">{form.infraction_type}</dd>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staff.search.fileInfraction.reviewLocation")}
              </dt>
              <dd className="font-medium">{form.location || emDash}</dd>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staff.search.fileInfraction.reviewFine")}
              </dt>
              <dd className="font-medium">
                {formatCurrency(Number(form.fine_amount || 0))}
              </dd>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staff.search.fileInfraction.reviewEvidence")}
              </dt>
              <dd className="font-medium">
                {evidence.file ? evidence.file.name : t("staff.search.fileInfraction.reviewNone")}
              </dd>
            </dl>
          )}

          <StepWizardFooter
            step={step}
            totalSteps={steps.length}
            loading={loading}
            onBack={() => {
              setError(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            onCancel={close}
            onNext={async () => {
              const err = validateStep();
              if (err) {
                setError(err);
                return;
              }
              if (includePlateStep && step === 0) {
                const ok = await resolvePlate();
                if (!ok) return;
              }
              setError(null);
              setStep((s) => Math.min(steps.length - 1, s + 1));
            }}
            onSubmit={() => submit(close)}
            submitLabel={t("staff.search.fileInfraction.submit")}
          />
        </div>
      )}
    </FormDialog>
  );
}
