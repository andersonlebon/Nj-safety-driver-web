"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormDialog } from "@/components/ui/FormDialog";
import { StepWizard, StepWizardFooter } from "@/components/ui/StepWizard";
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
import { BORDER_CHECKPOINTS, COUNTRIES, type CountryCode, type BorderCheckpoint } from "@/lib/countries";
import { registerBorderVehicle } from "@/app/agent/actions";
import { friendlyError } from "@/lib/errors";
import { uploadTransitIdPhoto, removeTransitIdPaths } from "@/lib/border-id-upload";
import { sameIdFile } from "@/lib/transit-id-documents";

const STEPS = [
  "Plate & country",
  "Driver & passport",
  "ID front & back",
  "Vehicle details",
];

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

const emptyEvidence = (): EvidenceSlotValue => ({ file: null, previewUrl: null });

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

export function BorderRegisterDialog({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BorderForm>(emptyForm);
  const [idFront, setIdFront] = useState<EvidenceSlotValue>(emptyEvidence);
  const [idBack, setIdBack] = useState<EvidenceSlotValue>(emptyEvidence);
  const [passportExpires, setPassportExpires] = useState("");

  const reset = () => {
    setStep(0);
    setError(null);
    setForm(emptyForm());
    setIdFront(emptyEvidence());
    setIdBack(emptyEvidence());
    setPassportExpires("");
  };

  const submit = (close: () => void) => {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const uploadedPaths: string[] = [];

      try {
        if (!idFront.file || !idBack.file) {
          setError("Upload photos of both the front and back of the passport or ID.");
          return;
        }
        if (sameIdFile(idFront.file, idBack.file)) {
          setError("Use two different photos — one for the front and one for the back.");
          return;
        }

        const frontUp = await uploadTransitIdPhoto(supabase, agentId, "front", idFront.file);
        if (!frontUp.ok) {
          setError(frontUp.error);
          return;
        }
        uploadedPaths.push(frontUp.path);

        const backUp = await uploadTransitIdPhoto(supabase, agentId, "back", idBack.file);
        if (!backUp.ok) {
          await removeTransitIdPaths(supabase, uploadedPaths);
          setError(backUp.error);
          return;
        }
        uploadedPaths.push(backUp.path);

        const expiresIso = passportExpires
          ? new Date(passportExpires).toISOString()
          : null;

        const result = await registerBorderVehicle({
          ...form,
          id_documents: {
            front: {
              file_path: frontUp.path,
              file_name: frontUp.fileName,
              expires_at: expiresIso,
            },
            back: {
              file_path: backUp.path,
              file_name: backUp.fileName,
              expires_at: expiresIso,
            },
          },
        });

        if (!result.ok) {
          await removeTransitIdPaths(supabase, uploadedPaths);
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
        await removeTransitIdPaths(supabase, uploadedPaths);
        setError(friendlyError(err));
      }
    });
  };

  return (
    <FormDialog
      triggerLabel="Register border crossing"
      title="Border vehicle registration"
      description="Register a foreign vehicle with passport/ID verification (front and back)."
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
                label="Passport / national ID number"
                value={form.transit_passport_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transit_passport_id: e.target.value }))
                }
                required
                placeholder="As printed on the document"
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
              <Alert variant="info">
                Photograph <strong>both sides</strong> of the passport or national ID.
                Admins compare front and back to confirm authenticity before approval.
              </Alert>
              <EvidenceSlot
                title="Front — photo page"
                description="Name, photo, and document number must be readable."
                required
                accept={PHOTO_ACCEPT}
                value={idFront}
                onChange={setIdFront}
                showExpiry={false}
              />
              <EvidenceSlot
                title="Back — security / barcode side"
                description="MRZ, hologram, or national ID security features."
                required
                accept={PHOTO_ACCEPT}
                value={idBack}
                onChange={setIdBack}
                showExpiry={false}
              />
              <Input
                label="Document expiry date"
                type="date"
                value={passportExpires}
                onChange={(e) => setPassportExpires(e.target.value)}
                required
              />
            </div>
          )}

          {step === 3 && (
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
              if (step === 1) {
                if (!form.transit_driver_name.trim()) {
                  setError("Driver name is required.");
                  return;
                }
                if (!form.transit_passport_id.trim()) {
                  setError("Passport or ID number is required.");
                  return;
                }
              }
              if (step === 2) {
                if (!idFront.file || !idBack.file) {
                  setError("Upload both front and back photos of the ID.");
                  return;
                }
                if (sameIdFile(idFront.file, idBack.file)) {
                  setError("Front and back must be different photos.");
                  return;
                }
                if (!passportExpires) {
                  setError("Document expiry date is required.");
                  return;
                }
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
