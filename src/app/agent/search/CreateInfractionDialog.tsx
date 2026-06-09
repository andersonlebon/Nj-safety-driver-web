"use client";

import { useState } from "react";
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
import { INFRACTION_TYPES } from "@/lib/infractions";
import { fileInfraction } from "@/app/agent/actions";
import type { PaymentStatus } from "@/lib/types/database";

const DETAIL_STEPS = ["Violation", "Evidence", "Review"];

export function CreateInfractionDialog({
  plate: fixedPlate,
  country: fixedCountry,
  vehicleId: fixedVehicleId,
  driverId: fixedDriverId,
  includePlateStep = false,
}: {
  plate?: string;
  country?: string;
  vehicleId?: string | null;
  driverId?: string | null;
  /** When true, first step asks for plate + country (for infractions list page). */
  includePlateStep?: boolean;
}) {
  const router = useRouter();
  const steps = includePlateStep
    ? ["Plate", ...DETAIL_STEPS]
    : DETAIL_STEPS;

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
    infraction_type: INFRACTION_TYPES[0],
    description: "",
    location: "",
    fine_amount: "",
    status: "unpaid" as PaymentStatus,
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

  const resolvePlate = async () => {
    const q = normalizePlateForCountry(plateInput, countryInput);
    if (!q) {
      setError("Enter a valid plate number.");
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
      if (!plateInput.trim()) return "Plate is required.";
      return null;
    }
    if (detailStep === 0 && !form.fine_amount) {
      return "Fine amount is required.";
    }
    return null;
  };

  const submit = async (close: () => void) => {
    if (!plate) {
      setError("Plate is required.");
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
      infraction_type: form.infraction_type,
      description: form.description,
      location: form.location,
      fine_amount: form.fine_amount,
      status: form.status,
      evidence_path: evidencePath,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess("Infraction filed successfully.");
    setStep(0);
    setPlateInput("");
    setForm({
      infraction_type: INFRACTION_TYPES[0],
      description: "",
      location: "",
      fine_amount: "",
      status: "unpaid",
    });
    setEvidence({ file: null, previewUrl: null });
    router.refresh();
    setTimeout(() => {
      close();
      setSuccess(null);
    }, 1200);
  };

  const titlePlate = plate || "new plate";

  return (
    <FormDialog
      triggerLabel={
        <>
          <FileWarning className="h-4 w-4 mr-1.5" />
          File infraction
        </>
      }
      title={includePlateStep ? "File infraction" : `New infraction — ${titlePlate}`}
      description="Four quick steps: plate, violation, optional photo, confirm."
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
                label="Plate country"
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
                label="Infraction type"
                name="infraction_type"
                value={form.infraction_type}
                onChange={handleChange("infraction_type")}
              >
                {INFRACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Add details about the infraction"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange("location")}
                />
                <Input
                  label="Fine amount"
                  type="number"
                  min="0"
                  step="0.01"
                  name="fine_amount"
                  value={form.fine_amount}
                  onChange={handleChange("fine_amount")}
                  required
                />
              </div>
              <Select
                label="Payment status"
                name="status"
                value={form.status}
                onChange={handleChange("status")}
              >
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
          )}

          {detailStep === 1 && (
            <div className="mt-4">
              <EvidenceSlot
                title="Evidence photo"
                description="Optional — photo of the violation or vehicle."
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
                Skip photo
              </Button>
            </div>
          )}

          {detailStep === 2 && (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/50">
              <dt className="text-stone-500 dark:text-slate-400">Plate</dt>
              <dd className="font-medium">{plate}</dd>
              <dt className="text-stone-500 dark:text-slate-400">Type</dt>
              <dd className="font-medium">{form.infraction_type}</dd>
              <dt className="text-stone-500 dark:text-slate-400">Location</dt>
              <dd className="font-medium">{form.location || "—"}</dd>
              <dt className="text-stone-500 dark:text-slate-400">Fine</dt>
              <dd className="font-medium">
                {formatCurrency(Number(form.fine_amount || 0))}
              </dd>
              <dt className="text-stone-500 dark:text-slate-400">Evidence</dt>
              <dd className="font-medium">
                {evidence.file ? evidence.file.name : "None"}
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
            submitLabel="File infraction"
          />
        </div>
      )}
    </FormDialog>
  );
}
