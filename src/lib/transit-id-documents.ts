import type { DocumentType } from "@/lib/types/database";

/** Document type for border transit passport / national ID photos. */
export const TRANSIT_ID_DOC_TYPE: DocumentType = "passport";

export const TRANSIT_ID_LABEL_FRONT = "front";
export const TRANSIT_ID_LABEL_BACK = "back";

export type TransitIdDocRow = {
  label: string | null;
  file_path: string;
  file_name: string | null;
  verification_status?: string | null;
};

export type TransitIdDocUrls = {
  front: string | null;
  back: string | null;
};

export type TransitIdAuthenticity = {
  complete: boolean;
  frontOnFile: boolean;
  backOnFile: boolean;
  warnings: string[];
  readyForAdminReview: boolean;
};

export function assessTransitIdAuthenticity(
  docs: TransitIdDocRow[]
): TransitIdAuthenticity {
  const front = docs.find((d) => d.label === TRANSIT_ID_LABEL_FRONT);
  const back = docs.find((d) => d.label === TRANSIT_ID_LABEL_BACK);
  const warnings: string[] = [];

  if (!front?.file_path) {
    warnings.push("Missing photo of the ID front (photo page).");
  }
  if (!back?.file_path) {
    warnings.push("Missing photo of the ID back (barcode / security side).");
  }
  if (
    front?.file_path &&
    back?.file_path &&
    front.file_path === back.file_path
  ) {
    warnings.push("Front and back appear to be the same file — recapture both sides.");
  }

  const frontOnFile = Boolean(front?.file_path);
  const backOnFile = Boolean(back?.file_path);
  const complete = frontOnFile && backOnFile && front!.file_path !== back!.file_path;

  return {
    complete,
    frontOnFile,
    backOnFile,
    warnings,
    readyForAdminReview: complete,
  };
}

export function sameIdFile(a: File | null, b: File | null): boolean {
  if (!a || !b) return false;
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}
