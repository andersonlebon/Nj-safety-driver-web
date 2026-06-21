"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EvidenceSlotValue } from "@/components/uploads/EvidenceSlot";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import {
  DRIVER_DOCUMENT_GROUPS,
  VEHICLE_DOCUMENT_GROUPS,
  isDocumentGroupRequired,
  type DocumentGroupDates,
  type DocumentGroupDefinition,
} from "@/lib/document-definitions";
import {
  translateDocumentGroupDescription,
  translateDocumentGroupTitle,
} from "@/lib/document-i18n";
import { saveDocumentAttachment } from "@/lib/document-groups-client";
import {
  normalizeExpiryForDocument,
  normalizeIssuedForDocument,
} from "@/lib/document-rules";
import { sha256File } from "@/lib/file-hash";
import {
  buildDocumentUploadState,
  errorKey,
  extensionFor,
  groupScopeKey,
  groupUploadProgress,
  isGroupUploadComplete,
  type DocumentListItem,
  type DocumentListSection,
  type DocumentUploadTarget,
  type ExistingDocument,
  type ExistingGroup,
  type GroupAttachmentsState,
  type GroupDatesState,
  type GroupErrorState,
  type GroupStatusState,
  type GroupUploadedMetaState,
  type UploadedMeta,
  type VehicleRow,
  emptyGroupAttachments,
  emptyGroupDates,
  uploadTargetId,
  vehicleForRequiredChecks,
} from "@/lib/document-group-upload-state";
import { useI18n } from "@/i18n/context";

type Props = {
  ownerId: string;
  documents: ExistingDocument[];
  documentGroups: ExistingGroup[];
  signedUrls: Record<string, string>;
  vehicles: VehicleRow[];
};

export function usePersistedDocumentGroupUpload({
  ownerId,
  documents,
  documentGroups,
  signedUrls,
  vehicles,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const initial = useMemo(
    () => buildDocumentUploadState(documents, documentGroups, signedUrls),
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
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

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

  const updateGroupDatesInDb = async (
    group: DocumentGroupDefinition,
    dates: DocumentGroupDates,
    vehicleId: string | null
  ) => {
    const key = groupScopeKey(group.scope, group.docType, vehicleId);
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

  const collectUploadedHashes = (exclude?: {
    vehicleId: string | null;
    groupKey: string;
    attachmentKey: string;
  }) => {
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
            [groupScopeKey(group.scope, group.docType, vehicleId)]: savedGroup.id,
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

  const buildListItem = (
    target: Omit<DocumentUploadTarget, "id">
  ): DocumentListItem => {
    const attachments =
      target.scope === "driver"
        ? driverGroups[target.groupKey]
        : vehicleGroupsById[target.vehicleId ?? ""]?.[target.groupKey];
    const dates =
      target.scope === "driver"
        ? driverDates[target.groupKey]
        : vehicleDatesById[target.vehicleId ?? ""]?.[target.groupKey];
    const statuses =
      target.scope === "driver"
        ? driverGroupStatus[target.groupKey]
        : vehicleGroupStatusById[target.vehicleId ?? ""]?.[target.groupKey];
    const progress = groupUploadProgress(
      target.group,
      target.required,
      attachments,
      statuses
    );

    return {
      ...target,
      id: uploadTargetId(target.vehicleId, target.groupKey),
      title: translateDocumentGroupTitle(target.group, t),
      description: translateDocumentGroupDescription(target.group, t) || undefined,
      isComplete: isGroupUploadComplete(
        target.group,
        target.required,
        attachments,
        dates,
        statuses
      ),
      ...progress,
    };
  };

  const listSections = useMemo((): DocumentListSection[] => {
    const personalItems = DRIVER_DOCUMENT_GROUPS.map((group) =>
      buildListItem({
        scope: "driver",
        groupKey: group.key,
        vehicleId: null,
        group,
        required: group.required === true,
      })
    );

    const sections: DocumentListSection[] = [
      {
        id: "personal",
        title: t("documents.personalSection"),
        items: personalItems,
      },
    ];

    for (const vehicle of vehicles) {
      const vehicleCtx = vehicleForRequiredChecks(vehicle);
      const vehicleGroups = VEHICLE_DOCUMENT_GROUPS.filter((group) =>
        isDocumentGroupRequired(group, vehicleCtx)
      );
      if (vehicleGroups.length === 0) continue;

      sections.push({
        id: vehicle.id,
        title: t("documents.vehicleSection", { plate: vehicle.plate_number }),
        items: vehicleGroups.map((group) =>
          buildListItem({
            scope: "vehicle",
            groupKey: group.key,
            vehicleId: vehicle.id,
            group,
            required: true,
          })
        ),
      });
    }

    return sections;
  }, [
    driverDates,
    driverGroupStatus,
    driverGroups,
    t,
    vehicleDatesById,
    vehicleGroupStatusById,
    vehicleGroupsById,
    vehicles,
  ]);

  const activeTarget = useMemo(() => {
    if (!activeTargetId) return null;
    for (const section of listSections) {
      const item = section.items.find((entry) => entry.id === activeTargetId);
      if (item) return item;
    }
    return null;
  }, [activeTargetId, listSections]);

  const activeUploadProps = useMemo(() => {
    if (!activeTarget) return null;

    if (activeTarget.scope === "driver") {
      return {
        group: activeTarget.group,
        required: activeTarget.required,
        attachments: driverGroups[activeTarget.groupKey] ?? {},
        statuses: driverGroupStatus[activeTarget.groupKey],
        errors: groupErrors[activeTarget.groupKey],
        dates: driverDates[activeTarget.groupKey],
        onAttachmentChange: (attachmentKey: string, value: EvidenceSlotValue) =>
          handleAttachmentChange("driver", null, activeTarget.groupKey, attachmentKey, value),
        onDatesChange: (dates: DocumentGroupDates) =>
          handleDriverDatesChange(activeTarget.groupKey, dates),
      };
    }

    const vehicleId = activeTarget.vehicleId!;
    return {
      group: activeTarget.group,
      required: activeTarget.required,
      attachments:
        vehicleGroupsById[vehicleId]?.[activeTarget.groupKey] ?? {},
      statuses: vehicleGroupStatusById[vehicleId]?.[activeTarget.groupKey],
      errors: groupErrors[errorKey(vehicleId, activeTarget.groupKey)],
      dates: vehicleDatesById[vehicleId]?.[activeTarget.groupKey],
      onAttachmentChange: (attachmentKey: string, value: EvidenceSlotValue) =>
        handleAttachmentChange(
          "vehicle",
          vehicleId,
          activeTarget.groupKey,
          attachmentKey,
          value
        ),
      onDatesChange: (dates: DocumentGroupDates) =>
        handleVehicleDatesChange(vehicleId, activeTarget.groupKey, dates),
    };
  }, [
    activeTarget,
    driverDates,
    driverGroupStatus,
    driverGroups,
    groupErrors,
    vehicleDatesById,
    vehicleGroupStatusById,
    vehicleGroupsById,
  ]);

  const requiredComplete = useMemo(() => {
    const requiredItems = listSections.flatMap((section) =>
      section.items.filter((item) => item.required)
    );
    const done = requiredItems.filter((item) => item.isComplete).length;
    return { done, total: requiredItems.length };
  }, [listSections]);

  return {
    listSections,
    activeTarget,
    activeUploadProps,
    openUpload: setActiveTargetId,
    closeUpload: () => setActiveTargetId(null),
    hasUploadsInProgress,
    requiredComplete,
  };
}
