"use client";

import { useState, useTransition } from "react";
import { ScanLine } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { suggestPlateFromImage } from "@/lib/plate-scan";
import { useI18n } from "@/i18n/context";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  name?: string;
};

export function PlateScanField({
  value,
  onChange,
  label,
  required,
  name = "plate_number",
}: Props) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("staff.search.plateScan.plateNumber");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onCapture = (file: File, url: string) => {
    setPreviewUrl(url);
    startTransition(async () => {
      const result = await suggestPlateFromImage(file);
      if (result?.plate) {
        onChange(result.plate);
        setHint(
          t("staff.search.plateScan.suggestedPlateHint", {
            confidence: Math.round(result.confidence * 100),
          })
        );
      } else {
        setHint(t("staff.search.plateScan.ocrComingHint"));
      }
    });
  };

  return (
    <div className="space-y-3">
      <Input
        label={resolvedLabel}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("staff.search.plateScan.platePlaceholder")}
        required={required}
      />
      <CameraCapture
        label={t("staff.search.plateScan.scanWithCamera")}
        previewUrl={previewUrl}
        onCapture={onCapture}
        onClear={() => {
          setPreviewUrl(null);
          setHint(null);
        }}
      />
      {pending && (
        <p className="text-xs text-stone-500 dark:text-slate-400">
          {t("staff.search.plateScan.analyzing")}
        </p>
      )}
      {hint && <Alert variant="info">{hint}</Alert>}
      <Button
        type="button"
        variant="secondary"
        className="w-full text-sm"
        disabled={!value.trim()}
        onClick={() => setHint(t("staff.search.plateScan.plateReadyHint"))}
      >
        <ScanLine className="h-4 w-4 mr-1.5" />
        {t("staff.search.plateScan.confirmPlate")}
      </Button>
    </div>
  );
}
