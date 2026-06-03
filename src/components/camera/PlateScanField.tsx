"use client";

import { useState, useTransition } from "react";
import { ScanLine } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { PLATE_SCAN_HINT, suggestPlateFromImage } from "@/lib/plate-scan";

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
  label = "Plate number",
  required,
  name = "plate_number",
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onCapture = (file: File, url: string) => {
    setPreviewUrl(url);
    startTransition(async () => {
      const result = await suggestPlateFromImage(file);
      if (result?.plate) {
        onChange(result.plate);
        setHint(`Suggested plate (${Math.round(result.confidence * 100)}% confidence) — please verify.`);
      } else {
        setHint(PLATE_SCAN_HINT);
      }
    });
  };

  return (
    <div className="space-y-3">
      <Input
        label={label}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. AB-123-CD or foreign plate"
        required={required}
      />
      <CameraCapture
        label="Scan plate with camera"
        previewUrl={previewUrl}
        onCapture={onCapture}
        onClear={() => {
          setPreviewUrl(null);
          setHint(null);
        }}
      />
      {pending && (
        <p className="text-xs text-stone-500 dark:text-slate-400">Analyzing photo…</p>
      )}
      {hint && <Alert variant="info">{hint}</Alert>}
      <Button
        type="button"
        variant="secondary"
        className="w-full text-sm"
        disabled={!value.trim()}
        onClick={() => setHint("Plate ready — continue or search.")}
      >
        <ScanLine className="h-4 w-4 mr-1.5" />
        Confirm plate
      </Button>
    </div>
  );
}
