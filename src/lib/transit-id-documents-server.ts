import { createClient } from "@/lib/supabase/server";
import { signDocumentPaths } from "@/lib/storage-urls";
import {
  TRANSIT_ID_DOC_TYPE,
  TRANSIT_ID_LABEL_BACK,
  TRANSIT_ID_LABEL_FRONT,
  type TransitIdDocRow,
  type TransitIdDocUrls,
} from "@/lib/transit-id-documents";

export async function loadTransitIdDocsForVehicle(
  vehicleId: string
): Promise<{ documents: TransitIdDocRow[]; urls: TransitIdDocUrls }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("documents")
    .select("label, file_path, file_name, verification_status")
    .eq("vehicle_id", vehicleId)
    .eq("doc_type", TRANSIT_ID_DOC_TYPE);

  const documents = (data ?? []) as TransitIdDocRow[];
  const frontPath =
    documents.find((d) => d.label === TRANSIT_ID_LABEL_FRONT)?.file_path ?? null;
  const backPath =
    documents.find((d) => d.label === TRANSIT_ID_LABEL_BACK)?.file_path ?? null;

  const signed = await signDocumentPaths(
    [frontPath, backPath].filter((p): p is string => Boolean(p))
  );

  return {
    documents,
    urls: {
      front: frontPath ? signed[frontPath] ?? null : null,
      back: backPath ? signed[backPath] ?? null : null,
    },
  };
}
