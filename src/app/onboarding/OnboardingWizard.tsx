"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Camera, Car, Check, User } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import type { EvidenceSlotStatus, EvidenceSlotValue } from "@/components/uploads/EvidenceSlot";
import { DocumentGroupUpload } from "@/components/uploads/DocumentGroupUpload";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import {
  validateDocumentDates,
  normalizeExpiryForDocument,
  normalizeIssuedForDocument,
} from "@/lib/document-rules";
import {
  DRIVER_DOCUMENT_GROUPS,
  VEHICLE_DOCUMENT_GROUPS,
  isDocumentGroupRequired,
  type DocumentGroupDates,
  type DocumentGroupDefinition,
} from "@/lib/document-definitions";
import { normalizePlateForCountry } from "@/lib/vehicles";
import { cn } from "@/lib/utils";
import { sha256File } from "@/lib/file-hash";
import { useI18n } from "@/i18n/context";
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

type GroupAttachmentsState = Record<string, Record<string, EvidenceSlotValue>>;
type GroupStatusState = Record<string, Record<string, EvidenceSlotStatus>>;
type GroupErrorState = Record<string, Record<string, string | undefined>>;
type GroupDatesState = Record<string, DocumentGroupDates>;

type GroupUploadedMetaState = Record<
  string,
  Record<string, { path: string; fileName: string; fileHash: string } | undefined>
>;

function emptyGroupAttachments(
  groups: readonly DocumentGroupDefinition[]
): GroupAttachmentsState {
  return Object.fromEntries(
    groups.map((group) => [
      group.key,
      Object.fromEntries(
        group.attachments.map((attachment) => [
          attachment.key,
          { file: null, previewUrl: null },
        ])
      ),
    ])
  );
}

function emptyGroupDates(
  groups: readonly DocumentGroupDefinition[]
): GroupDatesState {
  return Object.fromEntries(
    groups.map((group) => [group.key, { issuedAt: "", expiresAt: "" }])
  );
}

const STEP_DEFS = [
  { id: 1 as StepId, labelKey: "onboarding.steps.personal", icon: User },
  { id: 2 as StepId, labelKey: "onboarding.steps.documents", icon: Camera },
  { id: 3 as StepId, labelKey: "onboarding.steps.vehicle", icon: Car },
] as const;

type StepId = 1 | 2 | 3;

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

function groupHasRequiredUploads(
  group: DocumentGroupDefinition,
  attachments: Record<string, EvidenceSlotValue> | undefined,
  statuses: Record<string, EvidenceSlotStatus> | undefined
): boolean {
  return group.attachments
    .filter((item) => item.required)
    .every(
      (item) =>
        statuses?.[item.key] === "uploaded" &&
        Boolean(attachments?.[item.key]?.file)
    );
}

function groupIsComplete(
  group: DocumentGroupDefinition,
  attachments: Record<string, EvidenceSlotValue> | undefined,
  dates: DocumentGroupDates | undefined,
  statuses: Record<string, EvidenceSlotStatus> | undefined
): boolean {
  if (!groupHasRequiredUploads(group, attachments, statuses)) return false;
  const dateError = validateDocumentDates(
    group.docType,
    dates?.issuedAt,
    dates?.expiresAt
  );
  return !dateError;
}

type Props = {
  initialStep: StepId;
  initialProfile: PersonalInfo;
  userId: string;
};

export function OnboardingWizard({ initialStep, initialProfile, userId }: Props) {
  const { t } = useI18n();
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
  const [driverGroups, setDriverGroups] = useState<GroupAttachmentsState>(() =>
    emptyGroupAttachments(DRIVER_DOCUMENT_GROUPS)
  );
  const [vehicleGroups, setVehicleGroups] = useState<GroupAttachmentsState>(() =>
    emptyGroupAttachments(VEHICLE_DOCUMENT_GROUPS)
  );
  const [groupStatus, setGroupStatus] = useState<GroupStatusState>({});
  const [groupErrors, setGroupErrors] = useState<GroupErrorState>({});
  const [driverDates, setDriverDates] = useState<GroupDatesState>(() =>
    emptyGroupDates(DRIVER_DOCUMENT_GROUPS)
  );
  const [vehicleDates, setVehicleDates] = useState<GroupDatesState>(() =>
    emptyGroupDates(VEHICLE_DOCUMENT_GROUPS)
  );
  const [driverUploadedMeta, setDriverUploadedMeta] = useState<GroupUploadedMetaState>({});
  const [vehicleUploadedMeta, setVehicleUploadedMeta] = useState<GroupUploadedMetaState>({});
  const [skipDocuments, setSkipDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleId] = useState<string>(() => generateVehicleId());
  const [pending, startTransition] = useTransition();

  const requiredDriverGroups = useMemo(
    () => DRIVER_DOCUMENT_GROUPS.filter((group) => group.required === true),
    []
  );
  const driverDoneCount = useMemo(
    () =>
      requiredDriverGroups.filter((group) =>
        groupIsComplete(
          group,
          driverGroups[group.key],
          driverDates[group.key],
          groupStatus[group.key]
        )
      ).length,
    [driverDates, driverGroups, groupStatus, requiredDriverGroups]
  );
  const driverRequiredCount = requiredDriverGroups.length;
  const canAdvanceFromStep2 = driverDoneCount === driverRequiredCount;
  const hasUploadsInProgress = useMemo(() => {
    return Object.values(groupStatus).some((statuses) =>
      Object.values(statuses ?? {}).some((status) => status === "uploading")
    );
  }, [groupStatus]);

  const vehicleRequiredGroups = useMemo(
    () => VEHICLE_DOCUMENT_GROUPS.filter((group) => isDocumentGroupRequired(group, vehicle)),
    [vehicle]
  );
  const vehicleDoneCount = useMemo(
    () =>
      vehicleRequiredGroups.filter((group) =>
        groupIsComplete(
          group,
          vehicleGroups[group.key],
          vehicleDates[group.key],
          groupStatus[group.key]
        )
      ).length,
    [groupStatus, vehicleDates, vehicleGroups, vehicleRequiredGroups]
  );
  const vehicleRequiredCount = vehicleRequiredGroups.length;

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
    if (hasUploadsInProgress) {
      setError(t("onboarding.waitUploadContinue"));
      return;
    }
    if (!canAdvanceFromStep2) {
      setError(t("onboarding.completeRequiredDocs"));
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

  const removeStoragePath = async (path: string | undefined) => {
    if (!path) return;
    const supabase = createClient();
    await supabase.storage.from("documents").remove([path]);
  };

  const collectUploadedHashes = (
    exclude?: { groupKey: string; attachmentKey: string; scope: "driver" | "vehicle" }
  ) => {
    const hashes: string[] = [];
    const append = (
      scope: "driver" | "vehicle",
      metaByGroup: GroupUploadedMetaState
    ) => {
      for (const [groupKey, attachments] of Object.entries(metaByGroup)) {
        for (const [attachmentKey, meta] of Object.entries(attachments ?? {})) {
          if (!meta?.fileHash) continue;
          if (
            exclude &&
            exclude.scope === scope &&
            exclude.groupKey === groupKey &&
            exclude.attachmentKey === attachmentKey
          ) {
            continue;
          }
          hashes.push(meta.fileHash);
        }
      }
    };
    append("driver", driverUploadedMeta);
    append("vehicle", vehicleUploadedMeta);
    return hashes;
  };

  const handleAttachmentChange = (
    scope: "driver" | "vehicle",
    groupKey: string,
    attachmentKey: string,
    next: EvidenceSlotValue
  ) => {
    const groupDefinitions =
      scope === "driver" ? DRIVER_DOCUMENT_GROUPS : VEHICLE_DOCUMENT_GROUPS;
    const group = groupDefinitions.find((item) => item.key === groupKey);
    if (!group) return;

    const setGroups = scope === "driver" ? setDriverGroups : setVehicleGroups;
    const setUploadedMeta =
      scope === "driver" ? setDriverUploadedMeta : setVehicleUploadedMeta;
    const uploadedMeta =
      scope === "driver" ? driverUploadedMeta : vehicleUploadedMeta;
    const previousMeta = uploadedMeta[groupKey]?.[attachmentKey];

    setGroups((prev) => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], [attachmentKey]: next },
    }));
    setGroupErrors((prev) => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], [attachmentKey]: undefined },
    }));

    if (!next.file) {
      void removeStoragePath(previousMeta?.path);
      setUploadedMeta((prev) => ({
        ...prev,
        [groupKey]: { ...prev[groupKey], [attachmentKey]: undefined },
      }));
      setGroupStatus((prev) => ({
        ...prev,
        [groupKey]: { ...prev[groupKey], [attachmentKey]: "idle" },
      }));
      return;
    }

    setGroupStatus((prev) => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], [attachmentKey]: "uploading" },
    }));

    void (async () => {
      try {
        if (previousMeta?.path) {
          await removeStoragePath(previousMeta.path);
        }

        const fileHash = await sha256File(next.file!);
        const duplicateHashes = collectUploadedHashes({
          scope,
          groupKey,
          attachmentKey,
        });
        if (duplicateHashes.includes(fileHash)) {
          throw new Error(t("onboarding.duplicateImage"));
        }

        const uploaded = await uploadAttachment(group, attachmentKey, next);
        setUploadedMeta((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey], [attachmentKey]: uploaded },
        }));
        setGroupStatus((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey], [attachmentKey]: "uploaded" },
        }));
      } catch (err) {
        setGroupStatus((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey], [attachmentKey]: "error" },
        }));
        setGroupErrors((prev) => ({
          ...prev,
          [groupKey]: {
            ...prev[groupKey],
            [attachmentKey]: friendlyError(err),
          },
        }));
      }
    })();
  };

  const setDriverAttachment = (
    groupKey: string,
    attachmentKey: string,
    next: EvidenceSlotValue
  ) => {
    handleAttachmentChange("driver", groupKey, attachmentKey, next);
  };

  const setVehicleAttachment = (
    groupKey: string,
    attachmentKey: string,
    next: EvidenceSlotValue
  ) => {
    handleAttachmentChange("vehicle", groupKey, attachmentKey, next);
  };

  const validateStep3 = (): string | null => {
    const plate = normalizePlateForCountry(
      vehicle.plate_number,
      vehicle.registration_country
    );
    if (!plate || !vehicle.brand.trim() || !vehicle.model.trim()) {
      return t("onboarding.plateRequired");
    }
    if (vehicle.year) {
      const y = Number(vehicle.year);
      if (!Number.isFinite(y) || y < 1900 || y > 2100) {
        return t("onboarding.yearInvalid");
      }
    }
    return null;
  };

  const uploadAttachment = async (
    group: DocumentGroupDefinition,
    attachmentKey: string,
    value: EvidenceSlotValue
  ): Promise<{ path: string; fileName: string; fileHash: string }> => {
    const attachment = group.attachments.find((item) => item.key === attachmentKey);
    if (!value.file || !attachment) {
      throw new Error(`No file picked for "${group.title} — ${attachmentKey}"`);
    }

    const supabase = createClient();
    const fileHash = await sha256File(value.file);
    const ext = extensionFor(value.file);
    const folder =
      group.scope === "vehicle" ? `vehicles/${vehicleId}` : group.folder;
    const path = `${userId}/${folder}/${attachment.fileBase}-${Date.now()}.${ext}`;

    setGroupStatus((prev) => ({
      ...prev,
      [group.key]: { ...prev[group.key], [attachmentKey]: "uploading" },
    }));
    setGroupErrors((prev) => ({
      ...prev,
      [group.key]: { ...prev[group.key], [attachmentKey]: undefined },
    }));

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, value.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: value.file.type || undefined,
      });

    if (uploadError) {
      const friendly = friendlyError(uploadError);
      setGroupStatus((prev) => ({
        ...prev,
        [group.key]: { ...prev[group.key], [attachmentKey]: "error" },
      }));
      setGroupErrors((prev) => ({
        ...prev,
        [group.key]: { ...prev[group.key], [attachmentKey]: friendly },
      }));
      throw new Error(`Upload failed for "${group.title}": ${friendly}`);
    }

    setGroupStatus((prev) => ({
      ...prev,
      [group.key]: { ...prev[group.key], [attachmentKey]: "uploaded" },
    }));
    return { path, fileName: value.file.name, fileHash };
  };

  const buildUploadedGroups = (
    groups: readonly DocumentGroupDefinition[],
    datesByGroup: GroupDatesState,
    uploadedMetaByGroup: GroupUploadedMetaState,
    scopeVehicleId: string | null
  ): CompletePayload["document_groups"] => {
    const uploadedGroups: CompletePayload["document_groups"] = [];

    for (const group of groups) {
      const dates = datesByGroup[group.key];
      const uploadedMeta = uploadedMetaByGroup[group.key] ?? {};
      const hasAnyUpload = group.attachments.some((item) =>
        Boolean(uploadedMeta[item.key]?.path)
      );
      if (!hasAnyUpload) continue;

      const dateError = validateDocumentDates(
        group.docType,
        dates?.issuedAt,
        dates?.expiresAt
      );
      if (dateError) {
        throw new Error(`${group.title}: ${dateError}`);
      }

      const uploadedAttachments: CompletePayload["document_groups"][number]["attachments"] =
        [];

      for (const attachment of group.attachments) {
        const meta = uploadedMeta[attachment.key];
        if (!meta) continue;
        uploadedAttachments.push({
          label: attachment.label,
          file_path: meta.path,
          file_name: meta.fileName,
          file_hash: meta.fileHash,
        });
      }

      if (uploadedAttachments.length === 0) continue;

      uploadedGroups.push({
        doc_type: group.docType,
        vehicle_id: scopeVehicleId,
        issued_at: normalizeIssuedForDocument(
          dates?.issuedAt ? new Date(dates.issuedAt).toISOString() : null,
          group.docType
        ),
        expires_at: normalizeExpiryForDocument(
          dates?.expiresAt ? new Date(dates.expiresAt).toISOString() : null,
          group.docType
        ),
        attachments: uploadedAttachments,
      });
    }

    return uploadedGroups;
  };

  const submitFinal = () => {
    setError(null);
    if (hasUploadsInProgress) {
      setError(t("onboarding.waitUploadSubmit"));
      return;
    }
    const validationError = validateStep3();
    if (validationError) {
      setError(validationError);
      return;
    }
    startTransition(async () => {
      try {
        const driverUploads = buildUploadedGroups(
          DRIVER_DOCUMENT_GROUPS,
          driverDates,
          driverUploadedMeta,
          null
        );
        const vehicleUploads = buildUploadedGroups(
          VEHICLE_DOCUMENT_GROUPS,
          vehicleDates,
          vehicleUploadedMeta,
          vehicleId
        );
        const uploadedGroups = [...driverUploads, ...vehicleUploads];

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
          document_groups: uploadedGroups,
          skip_documents: skipDocuments || uploadedGroups.length === 0,
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
          {t("onboarding.welcomeTitle")}
        </h3>
        <p className="text-sm text-stone-600 dark:text-slate-400 mt-1">
          {t("onboarding.welcomeSubtitle")}
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
            groups={driverGroups}
            dates={driverDates}
            statuses={groupStatus}
            errors={groupErrors}
            done={driverDoneCount}
            total={driverRequiredCount}
            disabled={pending}
            uploadsInProgress={hasUploadsInProgress}
            onAttachmentChange={setDriverAttachment}
            onDatesChange={(groupKey, nextDates) =>
              setDriverDates((prev) => ({ ...prev, [groupKey]: nextDates }))
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
            groups={vehicleGroups}
            dates={vehicleDates}
            statuses={groupStatus}
            errors={groupErrors}
            done={vehicleDoneCount}
            total={vehicleRequiredCount}
            pending={pending}
            skippedDocs={skipDocuments}
            uploadsInProgress={hasUploadsInProgress}
            onAttachmentChange={setVehicleAttachment}
            onDatesChange={(groupKey, nextDates) =>
              setVehicleDates((prev) => ({ ...prev, [groupKey]: nextDates }))
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
  const { t } = useI18n();

  return (
    <ol className="mt-6 flex items-center gap-3">
      {STEP_DEFS.map((s, idx) => {
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
                {t("onboarding.stepLabel", { id: s.id })}
              </p>
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isActive || isDone
                    ? "text-stone-900 dark:text-stone-100"
                    : "text-stone-500 dark:text-slate-500"
                )}
              >
                {t(s.labelKey)}
              </p>
            </div>
            {idx < STEP_DEFS.length - 1 && (
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
  const { t } = useI18n();
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
    message: t("onboarding.nationalIdDuplicate"),
  });
  const driverLicenseWarning = useDuplicateCheck({
    field: "driver_license",
    value: driverLicense,
    userId,
    message: t("onboarding.licenseDuplicate"),
  });

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t("onboarding.fields.fullName")}
          name="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label={t("onboarding.fields.phone")}
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
          placeholder="+241 ..."
        />
        <Input
          label={t("onboarding.fields.nationalId")}
          name="national_id"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          required
        />
        <Input
          label={t("onboarding.fields.driverLicense")}
          name="driver_license"
          value={driverLicense}
          onChange={(e) => setDriverLicense(e.target.value)}
          required
        />
        <Select
          label={t("onboarding.fields.nationality")}
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
        label={t("onboarding.fields.address")}
        name="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        rows={3}
      />
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={pending}>
          {t("common.continue")}
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
  groups,
  dates,
  statuses,
  errors,
  done,
  total,
  disabled,
  uploadsInProgress,
  onAttachmentChange,
  onDatesChange,
  onBack,
  onNext,
  onSkip,
  canAdvance,
}: {
  groups: GroupAttachmentsState;
  dates: GroupDatesState;
  statuses: GroupStatusState;
  errors: GroupErrorState;
  done: number;
  total: number;
  disabled: boolean;
  uploadsInProgress: boolean;
  onAttachmentChange: (
    groupKey: string,
    attachmentKey: string,
    value: EvidenceSlotValue
  ) => void;
  onDatesChange: (groupKey: string, value: DocumentGroupDates) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  canAdvance: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <Alert variant="warning">{t("onboarding.documentsWarning")}</Alert>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {t("onboarding.documentsTitle")}
          </h4>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            {t("onboarding.documentsHint")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
          <Check className="h-3.5 w-3.5" />
          {t("onboarding.requiredComplete", { done, total })}
        </span>
      </div>

      <div className="max-h-[min(52vh,28rem)] overflow-y-auto overscroll-y-contain pr-1 -mr-1 space-y-3 scroll-smooth">
        {DRIVER_DOCUMENT_GROUPS.map((group) => (
          <DocumentGroupUpload
            key={group.key}
            group={group}
            required={group.required === true}
            attachments={groups[group.key] ?? {}}
            statuses={statuses[group.key]}
            errors={errors[group.key]}
            dates={dates[group.key]}
            onAttachmentChange={(attachmentKey, value) =>
              onAttachmentChange(group.key, attachmentKey, value)
            }
            onDatesChange={(nextDates) => onDatesChange(group.key, nextDates)}
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
          {t("common.back")}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
            disabled={disabled}
          >
            {t("common.skipForNow")}
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={disabled || uploadsInProgress || !canAdvance}
          >
            {uploadsInProgress
              ? t("common.uploading")
              : t("onboarding.continueWithUploads")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VehicleStep({
  vehicle,
  onVehicleChange,
  groups,
  dates,
  statuses,
  errors,
  done,
  total,
  pending,
  skippedDocs,
  uploadsInProgress,
  onAttachmentChange,
  onDatesChange,
  onBack,
  onSubmit,
}: {
  vehicle: VehicleInfo;
  onVehicleChange: (next: VehicleInfo) => void;
  groups: GroupAttachmentsState;
  dates: GroupDatesState;
  statuses: GroupStatusState;
  errors: GroupErrorState;
  done: number;
  total: number;
  pending: boolean;
  skippedDocs: boolean;
  uploadsInProgress: boolean;
  onAttachmentChange: (
    groupKey: string,
    attachmentKey: string,
    value: EvidenceSlotValue
  ) => void;
  onDatesChange: (groupKey: string, value: DocumentGroupDates) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  const update =
    <K extends keyof VehicleInfo>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onVehicleChange({ ...vehicle, [key]: e.target.value });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {t("onboarding.vehicleDetails")}
        </h4>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
          {t("onboarding.vehicleDetailsHint")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label={t("onboarding.fields.vehicleOrigin")}
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
          label={t("onboarding.fields.plateNumber")}
          name="plate_number"
          required
          placeholder="GA-1234-AB"
          value={vehicle.plate_number}
          onChange={update("plate_number")}
        />
        <Input
          label={t("onboarding.fields.brand")}
          name="brand"
          required
          placeholder="Toyota"
          value={vehicle.brand}
          onChange={update("brand")}
        />
        <Input
          label={t("onboarding.fields.model")}
          name="model"
          required
          placeholder="Corolla"
          value={vehicle.model}
          onChange={update("model")}
        />
        <Select
          label={t("onboarding.fields.color")}
          name="color"
          value={vehicle.color}
          onChange={update("color")}
        >
          <option value="">{t("onboarding.fields.selectColor")}</option>
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
          label={t("onboarding.fields.year")}
          name="year"
          type="number"
          min={1900}
          max={2100}
          placeholder="2020"
          value={vehicle.year}
          onChange={update("year")}
        />
        <Select
          label={t("onboarding.fields.insuranceStatus")}
          name="insurance_status"
          value={vehicle.insurance_status}
          onChange={update("insurance_status")}
        >
          <option value="false">{t("onboarding.fields.notInsured")}</option>
          <option value="true">{t("onboarding.fields.insured")}</option>
        </Select>
        <Select
          label={t("onboarding.fields.inspectionStatus")}
          name="inspection_status"
          value={vehicle.inspection_status}
          onChange={update("inspection_status")}
        >
          <option value="false">{t("onboarding.fields.notInspected")}</option>
          <option value="true">{t("onboarding.fields.inspectionValid")}</option>
        </Select>
      </div>

      <div className="pt-2 border-t border-stone-200 dark:border-slate-800" />

      {skippedDocs && (
        <Alert variant="warning">{t("onboarding.skippedDocsWarning")}</Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {skippedDocs
              ? t("onboarding.vehicleEvidenceOptional")
              : t("onboarding.vehicleEvidence")}
          </h4>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            {t("onboarding.vehicleEvidenceHint")}
          </p>
        </div>
        {!skippedDocs && (
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
            <Check className="h-3.5 w-3.5" />
            {t("onboarding.requiredComplete", { done, total })}
          </span>
        )}
      </div>

      <div className="max-h-[min(52vh,28rem)] overflow-y-auto overscroll-y-contain pr-1 -mr-1 space-y-3 scroll-smooth">
        {VEHICLE_DOCUMENT_GROUPS.map((group) => (
          <DocumentGroupUpload
            key={group.key}
            group={group}
            required={!skippedDocs && isDocumentGroupRequired(group, vehicle)}
            attachments={groups[group.key] ?? {}}
            statuses={statuses[group.key]}
            errors={errors[group.key]}
            dates={dates[group.key]}
            onAttachmentChange={(attachmentKey, value) =>
              onAttachmentChange(group.key, attachmentKey, value)
            }
            onDatesChange={(nextDates) => onDatesChange(group.key, nextDates)}
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
          {t("common.back")}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          loading={pending}
          disabled={uploadsInProgress}
        >
          {uploadsInProgress
            ? t("common.uploading")
            : skippedDocs
              ? t("onboarding.finishPending")
              : t("onboarding.finishSubmit")}
        </Button>
      </div>
    </div>
  );
}
