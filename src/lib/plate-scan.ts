/**
 * Plate OCR / AI hook (Phase 2).
 * Returns null today — wire to on-device Tesseract, cloud Vision API, or edge model.
 */
export async function suggestPlateFromImage(
  _file: File
): Promise<{ plate: string; confidence: number } | null> {
  return null;
}

export const PLATE_SCAN_HINT =
  "Point the camera at the plate, then confirm or edit the number. Automatic OCR is coming in a future release.";
