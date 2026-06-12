"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  onCapture: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  previewUrl?: string | null;
  label?: string;
  facingMode?: "environment" | "user";
  className?: string;
};

export function CameraCapture({
  onCapture,
  onClear,
  previewUrl,
  label = "Take photo",
  facingMode = "environment",
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not supported in this browser. Enter details manually.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "CameraError";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings, then retry."
          : "Camera is unavailable or already in use. Close other camera apps and retry, or enter details manually."
      );
      console.warn("Camera startup failed", err);
    } finally {
      setStarting(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(blob);
        onCapture(file, url);
        stop();
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {previewUrl && !active ? (
        <div className="relative rounded-lg overflow-hidden border border-stone-200 dark:border-slate-700 aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Capture preview" className="h-full w-full object-cover" />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : active ? (
        <div className="relative rounded-lg overflow-hidden border border-stone-200 dark:border-slate-700 aspect-video bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          <div className="absolute bottom-2 left-2 right-2 flex gap-2">
            <Button type="button" className="flex-1 text-sm" onClick={capture}>
              Capture
            </Button>
            <Button type="button" variant="secondary" onClick={stop}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {!active && !previewUrl && (
        <Button
          type="button"
          variant="secondary"
          className="w-full text-sm"
          onClick={start}
          loading={starting}
        >
          <Camera className="h-4 w-4 mr-1.5" />
          {starting ? "Starting camera..." : label}
        </Button>
      )}

      {previewUrl && !active && (
        <Button type="button" variant="secondary" className="w-full text-sm" onClick={start}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Retake photo
        </Button>
      )}

      {error && (
        <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
      )}
    </div>
  );
}
