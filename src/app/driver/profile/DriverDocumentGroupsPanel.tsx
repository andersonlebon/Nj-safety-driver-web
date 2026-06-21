"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { DocumentGroupUpload } from "@/components/uploads/DocumentGroupUpload";
import type { EvidenceSlotStatus, EvidenceSlotValue } from "@/components/uploads/EvidenceSlot";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import {
  DRIVER_DOCUMENT_GROUPS,
  VEHICLE_DOCUMENT_GROUPS,
  isDocumentGroupRequired,
  type DocumentGroupDates,
  type DocumentGroupDefinition,
} from "@/lib/document-definitions";
import { matchDocumentToAttachment } from "@/lib/document-group-matching";
import { saveDocumentAttachment } from "@/lib/document-groups-client";
import {
  normalizeExpiryForDocument,
  normalizeIssuedForDocument,
} from "@/lib/document-rules";
import { sha256File } from "@/lib/file-hash";
import { formatDocumentDate } from "@/lib/documents-display";
import { useI18n } from "@/i18n/context";
import type { Database, DocumentType } from "@/lib/types/database";
import { SubmitForReviewButton } from "../documents/SubmitForReviewButton";

type ExistingDocument = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "doc_type" | "label" | "file_path" | "file_name" | "file_hash" | "vehicle_id" | "group_id"
>;

type ExistingGroup = Pick<
  Database["public"]["Tables"]["document_groups"]["Row"],
  "id" | "doc_type" | "issued_at" | "expires_at" | "vehicle_id"
>;

type VehicleRow = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number" | "insurance_status" | "inspection_status"
>;

type GroupAttachmentsState = Record<string, Record<string, EvidenceSlotValue>>;
type GroupStatusState = Record<string, Record<string, EvidenceSlotStatus>>;
type GroupErrorState = Record<string, Record<string, string | undefined>>;
type GroupDatesState = Record<string, DocumentGroupDates>;

type UploadedMeta = {
  path: string;
  fileName: string;
  fileHash: string;
  documentId: string;
};

type GroupUploadedMetaState = Record<
  string,
  Record<string, UploadedMeta | undefined>
>;

type Props = {
  ownerId: string;
  documents: ExistingDocument[];
  documentGroups: ExistingGroup[];
  signedUrls: Record<string, string>;
  vehicles: VehicleRow[];
};

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

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  return "jpg";
}

function vehicleForRequiredChecks(vehicle: VehicleRow) {
  return {
    insurance_status: vehicle.insurance_status ? "true" : "false",
    inspection_status: vehicle.inspection_status ? "true" : "false",
  } as const;
}

function buildInitialState(
  documents: ExistingDocument[],
  documentGroups: ExistingGroup[],
  signedUrls: Record<string, string>
) {
  const driverGroups = emptyGroupAttachments(DRIVER_DOCUMENT_GROUPS);
  const driverDates = emptyGroupDates(DRIVER_DOCUMENT_GROUPS);
  const driverUploadedMeta: GroupUploadedMetaState = {};
  const driverGroupStatus: GroupStatusState = {};

  const vehicleGroupsById: Record<string, GroupAttachmentsState> = {};
  const vehicleDatesById: Record<string, GroupDatesState> = {};
  const vehicleUploadedMetaById: Record<string, GroupUploadedMetaState> = {};
  const vehicleGroupStatusById: Record<string, GroupStatusState> = {};

  const groupIds: Record<string, string> = {};

  for (const group of documentGroups) {
    const scopeKey = group.vehicle_id
      ? `vehicle:${group.vehicle_id}:${group.doc_type}`
      : `driver:${group.doc_type}`;
    groupIds[scopeKey] = group.id;

    const dates = {
      issuedAt: formatDocumentDate(group.issued_at) ?? "",
      expiresAt: formatDocumentDate(group.expires_at) ?? "",
    };

    if (group.vehicle_id) {
      if (!vehicleDatesById[group.vehicle_id]) {
        vehicleDatesById[group.vehicle_id] = emptyGroupDates(VEHICLE_DOCUMENT_GROUPS);
      }
      const def = VEHICLE_DOCUMENT_GROUPS.find((item) => item.docType === group.doc_type);
      if (def) vehicleDatesById[group.vehicle_id][def.key] = dates;
    } else {
      const def = DRIVER_DOCUMENT_GROUPS.find((item) => item.docType === group.doc_type);
      if (def) driverDates[def.key] = dates;
      if (group.doc_type === "other") {
        driverDates.portrait = dates;
      }
    }
  }

  for (const doc of documents) {
    const match = matchDocumentToAttachment(doc);
    if (!match) continue;

    const { group, attachmentKey } = match;
    const previewUrl = signedUrls[doc.file_path] || null;
    const slotValue: EvidenceSlotValue = { file: null, previewUrl };

    if (doc.vehicle_id) {
      if (!vehicleGroupsById[doc.vehicle_id]) {
        vehicleGroupsById[doc.vehicle_id] = emptyGroupAttachments(VEHICLE_DOCUMENT_GROUPS);
        vehicleUploadedMetaById[doc.vehicle_id] = {};
        vehicleGroupStatusById[doc.vehicle_id] = {};
      }
      vehicleGroupsById[doc.vehicle_id][group.key] = {
        ...vehicleGroupsById[doc.vehicle_id][group.key],
        [attachmentKey]: slotValue,
      };
      vehicleUploadedMetaById[doc.vehicle_id][group.key] = {
        ...vehicleUploadedMetaById[doc.vehicle_id][group.key],
        [attachmentKey]: {
          path: doc.file_path,
          fileName: doc.file_name ?? doc.file_path.split("/").pop() ?? "document",
          fileHash: doc.file_hash ?? "",
          documentId: doc.id,
        },
      };
      vehicleGroupStatusById[doc.vehicle_id][group.key] = {
        ...vehicleGroupStatusById[doc.vehicle_id][group.key],
        [attachmentKey]: "uploaded",
      };
    } else {
      driverGroups[group.key] = {
        ...driverGroups[group.key],
        [attachmentKey]: slotValue,
      };
      driverUploadedMeta[group.key] = {
        ...driverUploadedMeta[group.key],
        [attachmentKey]: {
          path: doc.file_path,
          fileName: doc.file_name ?? doc.file_path.split("/").pop() ?? "document",
          fileHash: doc.file_hash ?? "",
          documentId: doc.id,
        },
      };
      driverGroupStatus[group.key] = {
        ...driverGroupStatus[group.key],
        [attachmentKey]: "uploaded",
      };
    }
  }

  return {
    driverGroups,
    driverDates,
    driverUploadedMeta,
    driverGroupStatus,
    vehicleGroupsById,
    vehicleDatesById,
    vehicleUploadedMetaById,
    vehicleGroupStatusById,
    groupIds,
  };
}

export function DriverDocumentGroupsPanel({
  ownerId,
  documents,
  documentGroups,
  signedUrls,
  vehicles,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const initial = useMemo(
    () => buildInitialState(documents, documentGroups, signedUrls),
    [documents, documentGroups, signedUrls]
  );

  const [driverGroups, setDriverGroups] = useState(initial.driverGroups);
  const [driverDates, setDriverDates] = useState(initial.driverDates);
  const [driverUploadedMeta, setDriverUploadedMeta] = useState(initial.driverUploadedMeta);
  const [driverGroupStatus, setDriverGroupStatus] = useState(initial.driverGroupStatus);
  const [vehicleGroupsById, setVehicleGroupsById] = useState(initial.vehicleGroupsById);
  const [vehicleDatesById, setVehicleDatesById] = useState(initial.vehicleDatesById);
  const [vehicleUploadedMetaById, setVehicleUploadedMetaById] = useState(
    initial.vehicleUploadedMetaById
  );
  const [vehicleGroupStatusById, setVehicleGroupStatusById] = useState(
    initial.vehicleGroupStatusById
  );
  const [groupIds, setGroupIds] = useState(initial.groupIds);
  const [groupErrors, setGroupErrors] = useState<GroupErrorState>({});

  const requiredDriverGroups = useMemo(
    () => DRIVER_DOCUMENT_GROUPS.filter((group) => group.required === true),
    []
  );

  const driverDoneCount = useMemo(() => {
    return requiredDriverGroups.filter((group) =>
      group.attachments
        .filter((item) => item.required)
        .every(
          (item) =>
            driverGroupStatus[group.key]?.[item.key] === "uploaded" &&
            Boolean(
              driverGroups[group.key]?.[item.key]?.file ||
                driverGroups[group.key]?.[item.key]?.previewUrl
            )
        )
    ).length;
  }, [driverGroupStatus, driverGroups, requiredDriverGroups]);

  const hasUploadsInProgress = useMemo(() => {
    const allStatuses = [
      ...Object.values(driverGroupStatus),
      ...Object.values(vehicleGroupStatusById).flatMap((item) => Object.values(item)),
    ];
    return allStatuses.some((statuses) =>
      Object.values(statuses ?? {}).some((status) => status === "uploading")
    );
  }, [driverGroupStatus, vehicleGroupStatusById]);

  const removeStoragePath = async (path: string | undefined) => {
    if (!path) return;
    const supabase = createClient();
    await supabase.storage.from("documents").remove([path]);
  };

  const deleteDocument = async (meta: UploadedMeta | undefined) => {
    if (!meta?.documentId) return;
    const supabase = createClient();
    await removeStoragePath(meta.path);
    await supabase.from("documents").delete().eq("id", meta.documentId);
  };

  const groupScopeKey = (
    scope: "driver" | "vehicle",
    docType: DocumentType,
    vehicleId: string | null
  ) =>
    scope === "driver"
      ? `driver:${docType}`
      : `vehicle:${vehicleId}:${docType}`;

  const updateGroupDatesInDb = async (
    group: DocumentGroupDefinition,
    dates: DocumentGroupDates,
    vehicleId: string | null
  ) => {
    const scope = group.scope;
    const key = groupScopeKey(scope, group.docType, vehicleId);
    const groupId = groupIds[key];
    if (!groupId) return;

    const supabase = createClient();
    await supabase
      .from("document_groups")
      .update({
        issued_at: normalizeIssuedForDocument(
          dates.issuedAt ? new Date(dates.issuedAt).toISOString() : null,
          group.docType
        ),
        expires_at: normalizeExpiryForDocument(
          dates.expiresAt ? new Date(dates.expiresAt).toISOString() : null,
          group.docType
        ),
      })
      .eq("id", groupId);
  };

  const errorKey = (vehicleId: string | null, groupKey: string) =>
    vehicleId ? `${vehicleId}:${groupKey}` : groupKey;

  const collectUploadedHashes = (
    exclude?: {
      vehicleId: string | null;
      groupKey: string;
      attachmentKey: string;
    }
  ) => {
    const hashes: string[] = [];

    const appendMeta = (
      metaByGroup: GroupUploadedMetaState,
      scopedVehicleId: string | null
    ) => {
      for (const [groupKey, attachments] of Object.entries(metaByGroup)) {
        for (const [attachmentKey, meta] of Object.entries(attachments ?? {})) {
          if (!meta?.fileHash) continue;
          if (
            exclude &&
            exclude.vehicleId === scopedVehicleId &&
            exclude.groupKey === groupKey &&
            exclude.attachmentKey === attachmentKey
          ) {
            continue;
          }
          hashes.push(meta.fileHash);
        }
      }
    };

    appendMeta(driverUploadedMeta, null);
    for (const [vehicleKey, metaByGroup] of Object.entries(vehicleUploadedMetaById)) {
      appendMeta(metaByGroup, vehicleKey);
    }

    return hashes;
  };

  const handleAttachmentChange = (
    scope: "driver" | "vehicle",
    vehicleId: string | null,
    groupKey: string,
    attachmentKey: string,
    next: EvidenceSlotValue
  ) => {
    const groupDefinitions =
      scope === "driver" ? DRIVER_DOCUMENT_GROUPS : VEHICLE_DOCUMENT_GROUPS;
    const group = groupDefinitions.find((item) => item.key === groupKey);
    if (!group) return;

    const setGroups =
      scope === "driver"
        ? setDriverGroups
        : (updater: (prev: GroupAttachmentsState) => GroupAttachmentsState) => {
            if (!vehicleId) return;
            setVehicleGroupsById((prev) => ({
              ...prev,
              [vehicleId]: updater(
                prev[vehicleId] ?? emptyGroupAttachments(VEHICLE_DOCUMENT_GROUPS)
              ),
            }));
          };

    const setUploadedMeta =
      scope === "driver"
        ? setDriverUploadedMeta
        : (updater: (prev: GroupUploadedMetaState) => GroupUploadedMetaState) => {
            if (!vehicleId) return;
            setVehicleUploadedMetaById((prev) => ({
              ...prev,
              [vehicleId]: updater(prev[vehicleId] ?? {}),
            }));
          };

    const setStatus =
      scope === "driver"
        ? setDriverGroupStatus
        : (updater: (prev: GroupStatusState) => GroupStatusState) => {
            if (!vehicleId) return;
            setVehicleGroupStatusById((prev) => ({
              ...prev,
              [vehicleId]: updater(prev[vehicleId] ?? {}),
            }));
          };

    const uploadedMeta =
      scope === "driver"
        ? driverUploadedMeta
        : vehicleUploadedMetaById[vehicleId ?? ""] ?? {};
    const previousMeta = uploadedMeta[groupKey]?.[attachmentKey];
    const dates =
      scope === "driver"
        ? driverDates[groupKey]
        : vehicleDatesById[vehicleId ?? ""]?.[groupKey];

    setGroups((prev) => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], [attachmentKey]: next },
    }));
    setGroupErrors((prev) => ({
      ...prev,
      [errorKey(vehicleId, groupKey)]: {
        ...prev[errorKey(vehicleId, groupKey)],
        [attachmentKey]: undefined,
      },
    }));

    if (!next.file) {
      void (async () => {
        await deleteDocument(previousMeta);
        setUploadedMeta((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey], [attachmentKey]: undefined },
        }));
        setStatus((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey], [attachmentKey]: "idle" },
        }));
        router.refresh();
      })();
      return;
    }

    setStatus((prev) => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], [attachmentKey]: "uploading" },
    }));

    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Not signed in.");

        const fileHash = await sha256File(next.file!);
        const duplicateHashes = collectUploadedHashes({
          vehicleId,
          groupKey,
          attachmentKey,
        });
        if (duplicateHashes.includes(fileHash)) {
          throw new Error(t("onboarding.duplicateImage"));
        }

        if (previousMeta) {
          await deleteDocument(previousMeta);
        }

        const attachment = group.attachments.find((item) => item.key === attachmentKey);
        if (!attachment) throw new Error("Unknown attachment.");

        const ext = extensionFor(next.file!);
        const folder =
          scope === "vehicle" && vehicleId
            ? `vehicles/${vehicleId}`
            : group.folder;
        const path = `${authUser.id}/${folder}/${attachment.fileBase}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, next.file!, {
            cacheControl: "3600",
            upsert: false,
            contentType: next.file!.type || undefined,
          });

        if (uploadError) throw uploadError;

        const saveResult = await saveDocumentAttachment({
          supabase,
          ownerId,
          vehicleId: scope === "vehicle" ? vehicleId : null,
          docType: group.docType,
          label: attachment.label,
          issuedAt: dates?.issuedAt ? new Date(dates.issuedAt).toISOString() : null,
          expiresAt: dates?.expiresAt ? new Date(dates.expiresAt).toISOString() : null,
          filePath: path,
          fileName: next.file!.name,
          fileHash,
        });

        if (!saveResult.ok) {
          await removeStoragePath(path);
          throw new Error(saveResult.error);
        }

        const { data: savedDoc } = await supabase
          .from("documents")
          .select("id")
          .eq("owner_id", ownerId)
          .eq("file_path", path)
          .maybeSingle();

        let groupQuery = supabase
          .from("document_groups")
          .select("id")
          .eq("owner_id", ownerId)
          .eq("doc_type", group.docType);

        groupQuery =
          scope === "vehicle" && vehicleId
            ? groupQuery.eq("vehicle_id", vehicleId)
            : groupQuery.is("vehicle_id", null);

        const { data: savedGroup } = await groupQuery.maybeSingle();

        if (savedGroup?.id) {
          setGroupIds((prev) => ({
            ...prev,
            [groupScopeKey(scope, group.docType, vehicleId)]: savedGroup.id,
          }));
        }

        setUploadedMeta((prev) => ({
          ...prev,
          [groupKey]: {
            ...prev[groupKey],
            [attachmentKey]: {
              path,
              fileName: next.file!.name,
              fileHash,
              documentId: savedDoc?.id ?? "",
            },
          },
        }));
        setStatus((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey], [attachmentKey]: "uploaded" },
        }));
        router.refresh();
      } catch (err) {
        setStatus((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey], [attachmentKey]: "error" },
        }));
        setGroupErrors((prev) => ({
          ...prev,
          [errorKey(vehicleId, groupKey)]: {
            ...prev[errorKey(vehicleId, groupKey)],
            [attachmentKey]: friendlyError(err),
          },
        }));
      }
    })();
  };

  const handleDriverDatesChange = (groupKey: string, dates: DocumentGroupDates) => {
    setDriverDates((prev) => ({ ...prev, [groupKey]: dates }));
    const group = DRIVER_DOCUMENT_GROUPS.find((item) => item.key === groupKey);
    if (group) void updateGroupDatesInDb(group, dates, null);
  };

  const handleVehicleDatesChange = (
    vehicleId: string,
    groupKey: string,
    dates: DocumentGroupDates
  ) => {
    setVehicleDatesById((prev) => ({
      ...prev,
      [vehicleId]: {
        ...(prev[vehicleId] ?? emptyGroupDates(VEHICLE_DOCUMENT_GROUPS)),
        [groupKey]: dates,
      },
    }));
    const group = VEHICLE_DOCUMENT_GROUPS.find((item) => item.key === groupKey);
    if (group) void updateGroupDatesInDb(group, dates, vehicleId);
  };

  return (
    <section id="files" className="scroll-mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Documents
          </h2>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
            Upload identity, license, vehicle photos, and certificates. Set
            expiration dates so we can remind you before they expire.
          </p>
        </div>
        <div className="shrink-0">
          <SubmitForReviewButton />
        </div>
      </div>

      <Alert variant="warning">{t("onboarding.documentsWarning")}</Alert>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {t("onboarding.documentsTitle")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              {t("onboarding.documentsHint")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
            <Check className="h-3.5 w-3.5" />
            {t("onboarding.requiredComplete", {
              done: driverDoneCount,
              total: requiredDriverGroups.length,
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DRIVER_DOCUMENT_GROUPS.map((group) => (
            <DocumentGroupUpload
              key={group.key}
              group={group}
              required={group.required === true}
              attachments={driverGroups[group.key] ?? {}}
              statuses={driverGroupStatus[group.key]}
              errors={groupErrors[group.key]}
              dates={driverDates[group.key]}
              onAttachmentChange={(attachmentKey, value) =>
                handleAttachmentChange("driver", null, group.key, attachmentKey, value)
              }
              onDatesChange={(nextDates) => handleDriverDatesChange(group.key, nextDates)}
              disabled={hasUploadsInProgress}
            />
          ))}
        </div>
      </div>

      {vehicles.length > 0 && (
        <div className="space-y-6 pt-2 border-t border-stone-200 dark:border-slate-800">
          {vehicles.map((vehicle) => {
            const vehicleCtx = vehicleForRequiredChecks(vehicle);
            const requiredVehicleGroups = VEHICLE_DOCUMENT_GROUPS.filter((group) =>
              isDocumentGroupRequired(group, vehicleCtx)
            );
            const groups = vehicleGroupsById[vehicle.id] ?? emptyGroupAttachments(VEHICLE_DOCUMENT_GROUPS);
            const dates =
              vehicleDatesById[vehicle.id] ?? emptyGroupDates(VEHICLE_DOCUMENT_GROUPS);
            const statuses = vehicleGroupStatusById[vehicle.id] ?? {};
            const doneCount = requiredVehicleGroups.filter((group) =>
              group.attachments
                .filter((item) => item.required)
                .every(
                  (item) =>
                    statuses[group.key]?.[item.key] === "uploaded" &&
                    Boolean(
                      groups[group.key]?.[item.key]?.file ||
                        groups[group.key]?.[item.key]?.previewUrl
                    )
                )
            ).length;

            return (
              <div key={vehicle.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {t("onboarding.vehicleEvidence")} — {vehicle.plate_number}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      {t("onboarding.vehicleEvidenceHint")}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                    <Check className="h-3.5 w-3.5" />
                    {t("onboarding.requiredComplete", {
                      done: doneCount,
                      total: requiredVehicleGroups.length,
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VEHICLE_DOCUMENT_GROUPS.map((group) => (
                    <DocumentGroupUpload
                      key={`${vehicle.id}-${group.key}`}
                      group={group}
                      required={isDocumentGroupRequired(group, vehicleCtx)}
                      attachments={groups[group.key] ?? {}}
                      statuses={statuses[group.key]}
                      errors={groupErrors[`${vehicle.id}:${group.key}`]}
                      dates={dates[group.key]}
                      onAttachmentChange={(attachmentKey, value) =>
                        handleAttachmentChange(
                          "vehicle",
                          vehicle.id,
                          group.key,
                          attachmentKey,
                          value
                        )
                      }
                      onDatesChange={(nextDates) =>
                        handleVehicleDatesChange(vehicle.id, group.key, nextDates)
                      }
                      disabled={hasUploadsInProgress}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
