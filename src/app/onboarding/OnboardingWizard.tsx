"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Camera, Car, Check, User } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import {
  EvidenceSlot,
  PHOTO_ACCEPT,
  PHOTO_OR_PDF_ACCEPT,
  type EvidenceSlotStatus,
  type EvidenceSlotValue,
} from "@/components/uploads/EvidenceSlot";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import {
  documentRequiresExpiry,
  normalizeExpiryForDocument,
  validateFutureExpiry,
} from "@/lib/document-rules";
import { normalizePlateForCountry } from "@/lib/vehicles";
import { cn } from "@/lib/utils";
import { sha256File } from "@/lib/file-hash";
import type { DocumentType } from "@/lib/types/database";
import {
  savePersonalInfo,
  completeOnboarding,
  type CompletePayload,
} from "./actions";

type PersonalInfo = {
  full_name: string;
  phone: string;
  national_id: string;
  driver_license: string;
  address: string;
  nationality_country: string;
};

type VehicleInfo = {
  plate_number: string;
  registration_country: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  insurance_status: "true" | "false";
  inspection_status: "true" | "false";
};

type SlotConfig = {
  key: string;
  docType: DocumentType;
  labelTag: string | null;
  title: string;
  description?: string;
  accept: string;
  folder: string;
  fileBase: string;
  scope: "driver" | "vehicle";
  required: boolean | "if_insured" | "if_inspected";
};

const DRIVER_SLOTS: SlotConfig[] = [
  {
    key: "identity-front",
    docType: "identity",
    labelTag: "front",
    title: "National ID — front",
    accept: PHOTO_ACCEPT,
    folder: "identity",
    fileBase: "front",
    scope: "driver",
    required: true,
  },
  {
    key: "identity-back",
    docType: "identity",
    labelTag: "back",
    title: "National ID — back",
    accept: PHOTO_ACCEPT,
    folder: "identity",
    fileBase: "back",
    scope: "driver",
    required: true,
  },
  {
    key: "license-front",
    docType: "driver_license",
    labelTag: "front",
    title: "Driver's license — front",
    accept: PHOTO_ACCEPT,
    folder: "license",
    fileBase: "front",
    scope: "driver",
    required: true,
  },
  {
    key: "license-back",
    docType: "driver_license",
    labelTag: "back",
    title: "Driver's license — back",
    accept: PHOTO_ACCEPT,
    folder: "license",
    fileBase: "back",
    scope: "driver",
    required: true,
  },
  {
    key: "portrait",
    docType: "other",
    labelTag: "portrait",
    title: "Portrait / selfie",
    description: "Helps an agent confirm your identity in person.",
    accept: PHOTO_ACCEPT,
    folder: "portrait",
    fileBase: "portrait",
    scope: "driver",
    required: false,
  },
];

const VEHICLE_SLOTS: SlotConfig[] = [
  {
    key: "vehicle-photo-front",
    docType: "vehicle_photo",
    labelTag: "front",
    title: "Vehicle photo — front",
    accept: PHOTO_ACCEPT,
    folder: "vehicles", // placeholder, replaced with vehicles/{vehicleId}
    fileBase: "photo-front",
    scope: "vehicle",
    required: true,
  },
  {
    key: "vehicle-photo-rear",
    docType: "vehicle_photo",
    labelTag: "rear",
    title: "Vehicle photo — rear / side",
    description: "Improves identification.",
    accept: PHOTO_ACCEPT,
    folder: "vehicles",
    fileBase: "photo-rear",
    scope: "vehicle",
    required: false,
  },
  {
    key: "vehicle-registration",
    docType: "vehicle_registration",
    labelTag: "carte_grise",
    title: "Vehicle registration card (carte grise)",
    accept: PHOTO_OR_PDF_ACCEPT,
    folder: "vehicles",
    fileBase: "registration",
    scope: "vehicle",
    required: true,
  },
  {
    key: "vehicle-insurance",
    docType: "insurance",
    labelTag: null,
    title: "Insurance certificate",
    description: "Required only if you marked your vehicle as insured.",
    accept: PHOTO_OR_PDF_ACCEPT,
    folder: "vehicles",
    fileBase: "insurance",
    scope: "vehicle",
    required: "if_insured",
  },
  {
    key: "vehicle-inspection",
    docType: "technical_inspection",
    labelTag: null,
    title: "Technical inspection certificate",
    description: "Required only if you marked your inspection as valid.",
    accept: PHOTO_OR_PDF_ACCEPT,
    folder: "vehicles",
    fileBase: "inspection",
    scope: "vehicle",
    required: "if_inspected",
  },
];

const STEPS = [
  { id: 1, label: "Personal information", icon: User },
  { id: 2, label: "Personal documents", icon: Camera },
  { id: 3, label: "First vehicle", icon: Car },
] as const;

type StepId = 1 | 2 | 3;

type SlotsState = Record<string, EvidenceSlotValue>;
type SlotStatusState = Record<string, EvidenceSlotStatus>;
type SlotErrorState = Record<string, string | undefined>;

function emptySlots(slots: SlotConfig[]): SlotsState {
  return Object.fromEntries(
    slots.map((s) => [s.key, { file: null, previewUrl: null }])
  );
}

function generateVehicleId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  return "jpg";
}

function isSlotRequired(slot: SlotConfig, vehicle: VehicleInfo): boolean {
  if (slot.required === true) return true;
  if (slot.required === "if_insured") return vehicle.insurance_status === "true";
  if (slot.required === "if_inspected")
    return vehicle.inspection_status === "true";
  return false;
}

type Props = {
  initialStep: StepId;
  initialProfile: PersonalInfo;
  userId: string;
};

export function OnboardingWizard({ initialStep, initialProfile, userId }: Props) {
  const [step, setStep] = useState<StepId>(initialStep);
  const [personal, setPersonal] = useState<PersonalInfo>(initialProfile);
  const [vehicle, setVehicle] = useState<VehicleInfo>({
    plate_number: "",
    registration_country: DEFAULT_COUNTRY,
    brand: "",
    model: "",
    color: "",
    year: "",
    insurance_status: "false",
    inspection_status: "false",
  });
  const [driverSlots, setDriverSlots] = useState<SlotsState>(() =>
    emptySlots(DRIVER_SLOTS)
  );
  const [vehicleSlots, setVehicleSlots] = useState<SlotsState>(() =>
    emptySlots(VEHICLE_SLOTS)
  );
  const [slotStatus, setSlotStatus] = useState<SlotStatusState>({});
  const [slotErrors, setSlotErrors] = useState<SlotErrorState>({});
  const [slotExpiries, setSlotExpiries] = useState<Record<string, string>>({});
  const [skipDocuments, setSkipDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleId] = useState<string>(() => generateVehicleId());
  const [pending, startTransition] = useTransition();

  const driverDoneCount = useMemo(
    () =>
      DRIVER_SLOTS.filter((s) => s.required).filter((s) => driverSlots[s.key]?.file)
        .length,
    [driverSlots]
  );
  const driverRequiredCount = DRIVER_SLOTS.filter((s) => s.required).length;
  const canAdvanceFromStep2 = driverDoneCount === driverRequiredCount;

  const vehicleRequiredSlots = useMemo(
    () => VEHICLE_SLOTS.filter((s) => isSlotRequired(s, vehicle)),
    [vehicle]
  );
  const vehicleDoneCount = vehicleRequiredSlots.filter(
    (s) => vehicleSlots[s.key]?.file
  ).length;
  const vehicleRequiredCount = vehicleRequiredSlots.length;

  const goTo = (target: StepId) => {
    setError(null);
    setStep(target);
  };

  const submitStep1 = (formData: FormData) => {
    setError(null);
    // Trim every text field so an empty-string-after-whitespace submission
    // can be rejected by HTML5 `required` and so server-side trimming and
    // client-side state stay in sync.
    const trimmed = {
      full_name: String(formData.get("full_name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      national_id: String(formData.get("national_id") ?? "").trim(),
      driver_license: String(formData.get("driver_license") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      nationality_country:
        String(formData.get("nationality_country") ?? DEFAULT_COUNTRY).trim() ||
        DEFAULT_COUNTRY,
    };
    const trimmedFormData = new FormData();
    for (const [k, v] of Object.entries(trimmed)) {
      trimmedFormData.set(k, v);
    }
    startTransition(async () => {
      const result = await savePersonalInfo(trimmedFormData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPersonal(trimmed);
      setStep(2);
    });
  };

  const goToStep3 = () => {
    if (!canAdvanceFromStep2) {
      setError(
        "Please upload the four required identity & license photos, or use “Skip for now” if you will upload them later."
      );
      return;
    }
    setSkipDocuments(false);
    setError(null);
    setStep(3);
  };

  const skipDocumentsForNow = () => {
    setSkipDocuments(true);
    setError(null);
    setStep(3);
  };

  const setDriverSlot = (key: string, next: EvidenceSlotValue) => {
    const slot = DRIVER_SLOTS.find((candidate) => candidate.key === key);
    setDriverSlots((prev) => ({ ...prev, [key]: next }));
    setSlotStatus((prev) => ({ ...prev, [key]: next.file ? "ready" : "idle" }));
    setSlotErrors((prev) => ({ ...prev, [key]: undefined }));
    if (slot && !documentRequiresExpiry(slot.docType)) {
      setSlotExpiries((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const setVehicleSlot = (key: string, next: EvidenceSlotValue) => {
    const slot = VEHICLE_SLOTS.find((candidate) => candidate.key === key);
    setVehicleSlots((prev) => ({ ...prev, [key]: next }));
    setSlotStatus((prev) => ({ ...prev, [key]: next.file ? "ready" : "idle" }));
    setSlotErrors((prev) => ({ ...prev, [key]: undefined }));
    if (slot && !documentRequiresExpiry(slot.docType)) {
      setSlotExpiries((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateStep3 = (): string | null => {
    const plate = normalizePlateForCountry(
      vehicle.plate_number,
      vehicle.registration_country
    );
    if (!plate || !vehicle.brand.trim() || !vehicle.model.trim()) {
      return "Plate number, brand, and model are required.";
    }
    if (vehicle.year) {
      const y = Number(vehicle.year);
      if (!Number.isFinite(y) || y < 1900 || y > 2100) {
        return "Year must be a valid 4-digit number.";
      }
    }
    return null;
  };

  const uploadOne = async (
    slot: SlotConfig,
    value: EvidenceSlotValue
  ): Promise<{ path: string; fileName: string; fileHash: string }> => {
    if (!value.file) throw new Error(`No file picked for "${slot.title}"`);
    const supabase = createClient();
    const fileHash = await sha256File(value.file);
    const ext = extensionFor(value.file);
    const folder =
      slot.scope === "vehicle" ? `vehicles/${vehicleId}` : slot.folder;
    const path = `${userId}/${folder}/${slot.fileBase}-${Date.now()}.${ext}`;
    setSlotStatus((prev) => ({ ...prev, [slot.key]: "uploading" }));
    setSlotErrors((prev) => ({ ...prev, [slot.key]: undefined }));

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, value.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: value.file.type || undefined,
      });

    if (uploadError) {
      const friendly = friendlyError(uploadError);
      setSlotStatus((prev) => ({ ...prev, [slot.key]: "error" }));
      setSlotErrors((prev) => ({
        ...prev,
        [slot.key]: friendly,
      }));
      throw new Error(`Upload failed for "${slot.title}": ${friendly}`);
    }

    setSlotStatus((prev) => ({ ...prev, [slot.key]: "uploaded" }));
    return { path, fileName: value.file.name, fileHash };
  };

  const submitFinal = () => {
    setError(null);
    const validationError = validateStep3();
    if (validationError) {
      setError(validationError);
      return;
    }
    startTransition(async () => {
      try {
        const uploadedDocs: CompletePayload["documents"] = [];

        for (const slot of DRIVER_SLOTS) {
          const value = driverSlots[slot.key];
          if (!value?.file) continue;
          const expiryError = validateFutureExpiry(
            slotExpiries[slot.key],
            slot.docType
          );
          if (expiryError) throw new Error(`${slot.title}: ${expiryError}`);
          const { path, fileName, fileHash } = await uploadOne(slot, value);
          uploadedDocs.push({
            doc_type: slot.docType,
            label: slot.labelTag,
            vehicle_id: null,
            file_path: path,
            file_name: fileName,
            file_hash: fileHash,
            expires_at: normalizeExpiryForDocument(
              slotExpiries[slot.key]
                ? new Date(slotExpiries[slot.key]).toISOString()
                : null,
              slot.docType
            ),
          });
        }

        for (const slot of VEHICLE_SLOTS) {
          const value = vehicleSlots[slot.key];
          if (!value?.file) continue;
          const expiryError = validateFutureExpiry(
            slotExpiries[slot.key],
            slot.docType
          );
          if (expiryError) throw new Error(`${slot.title}: ${expiryError}`);
          const { path, fileName, fileHash } = await uploadOne(slot, value);
          uploadedDocs.push({
            doc_type: slot.docType,
            label: slot.labelTag,
            vehicle_id: vehicleId,
            file_path: path,
            file_name: fileName,
            file_hash: fileHash,
            expires_at: normalizeExpiryForDocument(
              slotExpiries[slot.key]
                ? new Date(slotExpiries[slot.key]).toISOString()
                : null,
              slot.docType
            ),
          });
        }

        const payload: CompletePayload = {
          personal: {
            full_name: personal.full_name.trim(),
            phone: personal.phone.trim(),
            national_id: personal.national_id.trim(),
            driver_license: personal.driver_license.trim(),
            address: personal.address.trim(),
            nationality_country:
              personal.nationality_country?.trim() || DEFAULT_COUNTRY,
          },
          vehicle: {
            id: vehicleId,
            plate_number: normalizePlateForCountry(
              vehicle.plate_number,
              vehicle.registration_country
            ),
            registration_country: vehicle.registration_country || DEFAULT_COUNTRY,
            brand: vehicle.brand.trim() || null,
            model: vehicle.model.trim() || null,
            color: vehicle.color.trim() || null,
            year: vehicle.year ? Number(vehicle.year) : null,
            insurance_status: vehicle.insurance_status === "true",
            inspection_status: vehicle.inspection_status === "true",
          },
          documents: uploadedDocs,
          skip_documents: skipDocuments || uploadedDocs.length === 0,
        };

        const result = await completeOnboarding(payload);
        if (result && !result.ok) {
          setError(result.error);
        }
      } catch (err) {
        setError(friendlyError(err));
      }
    });
  };

  return (
    <Card>
      <div className="px-5 py-5 border-b border-stone-200 dark:border-slate-800">
        <h3 className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Welcome to NJ Safety Driver
        </h3>
        <p className="text-sm text-stone-600 dark:text-slate-400 mt-1">
          Activate your driver profile in three quick steps. You can edit
          everything later from your dashboard.
        </p>
        <StepIndicator current={step} />
      </div>
      <CardBody>
        {error && (
          <div className="mb-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {step === 1 && (
          <PersonalInfoStep
            defaults={personal}
            pending={pending}
            userId={userId}
            onSubmit={submitStep1}
          />
        )}

        {step === 2 && (
          <DocumentsStep
            slots={driverSlots}
            slotStatus={slotStatus}
            slotErrors={slotErrors}
            slotExpiries={slotExpiries}
            done={driverDoneCount}
            total={driverRequiredCount}
            disabled={pending}
            onChange={setDriverSlot}
            onExpiryChange={(key, value) =>
              setSlotExpiries((prev) => ({ ...prev, [key]: value }))
            }
            onBack={() => goTo(1)}
            onNext={goToStep3}
            onSkip={skipDocumentsForNow}
            canAdvance={canAdvanceFromStep2}
          />
        )}

        {step === 3 && (
          <VehicleStep
            vehicle={vehicle}
            onVehicleChange={setVehicle}
            slots={vehicleSlots}
            slotStatus={slotStatus}
            slotErrors={slotErrors}
            slotExpiries={slotExpiries}
            done={vehicleDoneCount}
            total={vehicleRequiredCount}
            pending={pending}
            skippedDocs={skipDocuments}
            onSlotChange={setVehicleSlot}
            onExpiryChange={(key, value) =>
              setSlotExpiries((prev) => ({ ...prev, [key]: value }))
            }
            onBack={() => goTo(2)}
            onSubmit={submitFinal}
          />
        )}
      </CardBody>
    </Card>
  );
}

function StepIndicator({ current }: { current: StepId }) {
  return (
    <ol className="mt-6 flex items-center gap-3">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const isDone = current > s.id;
        const isActive = current === s.id;
        return (
          <li key={s.id} className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "h-9 w-9 rounded-full grid place-items-center border-2 transition-colors shrink-0",
                isDone && "bg-brand-600 border-brand-600 text-white",
                isActive &&
                  "border-brand-600 text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30",
                !isDone &&
                  !isActive &&
                  "border-stone-300 dark:border-slate-700 text-stone-400 dark:text-slate-500"
              )}
            >
              {isDone ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p
                className={cn(
                  "text-xs uppercase tracking-wide font-medium",
                  isActive || isDone
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-stone-500 dark:text-slate-500"
                )}
              >
                Step {s.id}
              </p>
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isActive || isDone
                    ? "text-stone-900 dark:text-stone-100"
                    : "text-stone-500 dark:text-slate-500"
                )}
              >
                {s.label}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px",
                  isDone ? "bg-brand-600" : "bg-stone-200 dark:bg-slate-800"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PersonalInfoStep({
  defaults,
  pending,
  userId,
  onSubmit,
}: {
  defaults: PersonalInfo;
  pending: boolean;
  userId: string;
  onSubmit: (data: FormData) => void;
}) {
  const [fullName, setFullName] = useState(defaults.full_name);
  const [phone, setPhone] = useState(defaults.phone);
  const [nationalId, setNationalId] = useState(defaults.national_id);
  const [driverLicense, setDriverLicense] = useState(defaults.driver_license);
  const [address, setAddress] = useState(defaults.address);
  const [nationality, setNationality] = useState(
    defaults.nationality_country || DEFAULT_COUNTRY
  );

  const nationalIdWarning = useDuplicateCheck({
    field: "national_id",
    value: nationalId,
    userId,
    message: "This National ID is already registered.",
  });
  const driverLicenseWarning = useDuplicateCheck({
    field: "driver_license",
    value: driverLicense,
    userId,
    message: "This driver's license is already registered.",
  });

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full name"
          name="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Phone number"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
          placeholder="+241 ..."
        />
        <Input
          label="National ID number"
          name="national_id"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          required
        />
        <Input
          label="Driver license number"
          name="driver_license"
          value={driverLicense}
          onChange={(e) => setDriverLicense(e.target.value)}
          required
        />
        <Select
          label="Nationality"
          name="nationality_country"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          required
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </Select>
      </div>
      {(nationalIdWarning || driverLicenseWarning) && (
        <div className="space-y-2">
          {nationalIdWarning && (
            <Alert variant="warning">{nationalIdWarning}</Alert>
          )}
          {driverLicenseWarning && (
            <Alert variant="warning">{driverLicenseWarning}</Alert>
          )}
        </div>
      )}
      <Textarea
        label="Address"
        name="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        rows={3}
      />
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={pending}>
          Continue
        </Button>
      </div>
    </form>
  );
}

/**
 * Debounced lookup against `profiles` so the user gets an inline warning
 * BEFORE they click Continue — the unique_violation friendly error is a
 * good safety net, but catching this client-side feels much nicer.
 *
 * Returns the warning string when a row already exists for someone *else*,
 * or `null` otherwise. Network errors are swallowed silently: this is a
 * convenience, not a gate, and we never want it to disrupt the form.
 */
function useDuplicateCheck({
  field,
  value,
  userId,
  message,
}: {
  field: "national_id" | "driver_license";
  value: string;
  userId: string;
  message: string;
}): string | null {
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 4) {
      setWarning(null);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("profiles")
          .select("id")
          .eq(field, trimmed)
          .neq("id", userId)
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (queryError) {
          setWarning(null);
          return;
        }
        setWarning(data ? message : null);
      } catch {
        if (!cancelled) setWarning(null);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [field, message, userId, value]);

  return warning;
}

function DocumentsStep({
  slots,
  slotStatus,
  slotErrors,
  slotExpiries,
  done,
  total,
  disabled,
  onChange,
  onExpiryChange,
  onBack,
  onNext,
  onSkip,
  canAdvance,
}: {
  slots: SlotsState;
  slotStatus: SlotStatusState;
  slotErrors: SlotErrorState;
  slotExpiries: Record<string, string>;
  done: number;
  total: number;
  disabled: boolean;
  onChange: (key: string, value: EvidenceSlotValue) => void;
  onExpiryChange: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  canAdvance: boolean;
}) {
  return (
    <div className="space-y-5">
      <Alert variant="warning">
        You can upload documents now or skip and add them later from your
        dashboard. Your profile stays <strong>inactive</strong> until an
        administrator verifies your documents.
      </Alert>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Personal documents
          </h4>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            Tap a card to upload. Use good lighting and show all four corners of
            each document.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
          <Check className="h-3.5 w-3.5" />
          {done}/{total} required uploaded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DRIVER_SLOTS.map((slot) => (
          <EvidenceSlot
            key={slot.key}
            title={slot.title}
            description={slot.description}
            required={slot.required === true}
            accept={slot.accept}
            value={slots[slot.key] ?? { file: null, previewUrl: null }}
            onChange={(next) => onChange(slot.key, next)}
            status={slotStatus[slot.key] ?? "idle"}
            errorMessage={slotErrors[slot.key]}
            expiresAt={slotExpiries[slot.key]}
            onExpiresAtChange={(value) => onExpiryChange(slot.key, value)}
            showExpiry={Boolean(slots[slot.key]?.file) && documentRequiresExpiry(slot.docType)}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={disabled}
        >
          Back
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
            disabled={disabled}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={disabled || !canAdvance}
          >
            Continue with uploads
          </Button>
        </div>
      </div>
    </div>
  );
}

function VehicleStep({
  vehicle,
  onVehicleChange,
  slots,
  slotStatus,
  slotErrors,
  slotExpiries,
  done,
  total,
  pending,
  skippedDocs,
  onSlotChange,
  onExpiryChange,
  onBack,
  onSubmit,
}: {
  vehicle: VehicleInfo;
  onVehicleChange: (next: VehicleInfo) => void;
  slots: SlotsState;
  slotStatus: SlotStatusState;
  slotErrors: SlotErrorState;
  slotExpiries: Record<string, string>;
  done: number;
  total: number;
  pending: boolean;
  skippedDocs: boolean;
  onSlotChange: (key: string, value: EvidenceSlotValue) => void;
  onExpiryChange: (key: string, value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const update =
    <K extends keyof VehicleInfo>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onVehicleChange({ ...vehicle, [key]: e.target.value });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Vehicle details
        </h4>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
          You can add more vehicles later from your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label="Vehicle origin (plate country)"
          name="registration_country"
          value={vehicle.registration_country}
          onChange={update("registration_country")}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </Select>
        <Input
          label="Plate number"
          name="plate_number"
          required
          placeholder="GA-1234-AB"
          value={vehicle.plate_number}
          onChange={update("plate_number")}
        />
        <Input
          label="Brand"
          name="brand"
          required
          placeholder="Toyota"
          value={vehicle.brand}
          onChange={update("brand")}
        />
        <Input
          label="Model"
          name="model"
          required
          placeholder="Corolla"
          value={vehicle.model}
          onChange={update("model")}
        />
        <Select
          label="Color"
          name="color"
          value={vehicle.color}
          onChange={update("color")}
        >
          <option value="">Select a color</option>
          <option value="Black">Black</option>
          <option value="White">White</option>
          <option value="Silver">Silver</option>
          <option value="Gray">Gray</option>
          <option value="Red">Red</option>
          <option value="Blue">Blue</option>
          <option value="Green">Green</option>
          <option value="Yellow">Yellow</option>
          <option value="Orange">Orange</option>
          <option value="Brown">Brown</option>
          <option value="Beige">Beige</option>
          <option value="Gold">Gold</option>
          <option value="Other">Other</option>
        </Select>
        <Input
          label="Year"
          name="year"
          type="number"
          min={1900}
          max={2100}
          placeholder="2020"
          value={vehicle.year}
          onChange={update("year")}
        />
        <Select
          label="Insurance status"
          name="insurance_status"
          value={vehicle.insurance_status}
          onChange={update("insurance_status")}
        >
          <option value="false">Not insured</option>
          <option value="true">Insured</option>
        </Select>
        <Select
          label="Technical inspection"
          name="inspection_status"
          value={vehicle.inspection_status}
          onChange={update("inspection_status")}
        >
          <option value="false">Not inspected</option>
          <option value="true">Inspection valid</option>
        </Select>
      </div>

      <div className="pt-2 border-t border-stone-200 dark:border-slate-800" />

      {skippedDocs && (
        <Alert variant="warning">
          Document uploads were skipped. You can add them later under{" "}
          <strong>Documents</strong> in your dashboard, then submit for
          verification.
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Vehicle evidence {skippedDocs ? "(optional now)" : ""}
          </h4>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            Photos and certificates for this vehicle. You can upload these later
            if you prefer to finish quickly.
          </p>
        </div>
        {!skippedDocs && (
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
            <Check className="h-3.5 w-3.5" />
            {done}/{total} required uploaded
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VEHICLE_SLOTS.map((slot) => (
          <EvidenceSlot
            key={slot.key}
            title={slot.title}
            description={slot.description}
            required={!skippedDocs && isSlotRequired(slot, vehicle)}
            accept={slot.accept}
            value={slots[slot.key] ?? { file: null, previewUrl: null }}
            onChange={(next) => onSlotChange(slot.key, next)}
            status={slotStatus[slot.key] ?? "idle"}
            errorMessage={slotErrors[slot.key]}
            expiresAt={slotExpiries[slot.key]}
            onExpiresAtChange={(value) => onExpiryChange(slot.key, value)}
            showExpiry={Boolean(slots[slot.key]?.file) && documentRequiresExpiry(slot.docType)}
            disabled={pending}
          />
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={pending}
        >
          Back
        </Button>
        <Button type="button" onClick={onSubmit} loading={pending}>
          {skippedDocs
            ? "Finish setup (documents pending)"
            : "Finish & submit for verification"}
        </Button>
      </div>
    </div>
  );
}
