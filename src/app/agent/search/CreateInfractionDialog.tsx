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
import {
  EvidenceSlot,
  PHOTO_ACCEPT,
  type EvidenceSlotValue,
} from "@/components/uploads/EvidenceSlot";
import { formatCurrency } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types/database";

const STEPS = ["Infraction details", "Evidence photo", "Review & submit"];

const types = [
  "Speeding",
  "Running red light",
  "Illegal parking",
  "Reckless driving",
  "Driving without insurance",
  "Expired inspection",
  "No seatbelt",
  "Other",
];

export function CreateInfractionDialog({
  plate,
  vehicleId,
  driverId,
  agentId,
}: {
  plate: string;
  vehicleId: string | null;
  driverId: string | null;
  agentId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    infraction_type: types[0],
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

  const validateStep = (): string | null => {
    if (step === 0 && !form.fine_amount) {
      return "Fine amount is required.";
    }
    return null;
  };

  const submit = async (close: () => void) => {
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

    const { data: inserted, error: insertError } = await supabase
      .from("infractions")
      .insert({
        plate_number: plate,
        vehicle_id: vehicleId,
        driver_id: driverId,
        agent_id: agentId,
        infraction_type: form.infraction_type,
        description: form.description || null,
        location: form.location || null,
        fine_amount: form.fine_amount ? Number(form.fine_amount) : 0,
        status: form.status,
        evidence_path: evidencePath,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(friendlyError(insertError));
      setLoading(false);
      return;
    }

    if (inserted?.id) {
      await supabase.from("vehicle_tracking_events").insert({
        vehicle_id: vehicleId,
        plate_number: plate,
        event_type: "infraction",
        location: form.location || null,
        recorded_by: agentId,
        infraction_id: inserted.id,
        notes: form.infraction_type,
      });
    }

    setLoading(false);
    setSuccess("Infraction filed successfully.");
    setStep(0);
    setForm({
      infraction_type: types[0],
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

  return (
    <FormDialog
      triggerLabel={
        <>
          <FileWarning className="h-4 w-4 mr-1.5" />
          File infraction
        </>
      }
      title={`New infraction — ${plate}`}
      description="Record a violation in guided steps with optional photo evidence."
      modalClassName="max-w-xl"
    >
      {({ close }) => (
        <div>
          <StepWizard steps={STEPS} currentStep={step} onStepChange={setStep} />
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {step === 0 && (
            <div className="space-y-4 mt-4">
              <Select
                label="Infraction type"
                name="infraction_type"
                value={form.infraction_type}
                onChange={handleChange("infraction_type")}
              >
                {types.map((t) => (
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

          {step === 1 && (
            <div className="mt-4">
              <EvidenceSlot
                title="Evidence photo"
                description="Optional but recommended — clear photo of the violation or vehicle."
                accept={PHOTO_ACCEPT}
                value={evidence}
                onChange={setEvidence}
                showExpiry={false}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full text-sm"
                onClick={() => setStep(2)}
              >
                Skip photo
              </Button>
            </div>
          )}

          {step === 2 && (
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
            totalSteps={STEPS.length}
            loading={loading}
            onBack={() => {
              setError(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            onNext={() => {
              const err = validateStep();
              if (err) {
                setError(err);
                return;
              }
              setError(null);
              setStep((s) => Math.min(STEPS.length - 1, s + 1));
            }}
            onSubmit={() => submit(close)}
            submitLabel="File infraction"
          />
        </div>
      )}
    </FormDialog>
  );
}
