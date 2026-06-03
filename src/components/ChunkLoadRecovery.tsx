"use client";

import { useEffect } from "react";
import {
  CHUNK_RELOAD_KEY,
  isRecoverableClientError,
  reloadOnceForChunkError,
} from "@/lib/chunk-load-error";

/**
 * After a Vercel deploy, cached HTML can reference removed JS chunks.
 * Reload once so the browser fetches the current build.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const clearGuard = () => {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        // ignore
      }
    };

    const timer = window.setTimeout(clearGuard, 15_000);

    const onRejection = (event: PromiseRejectionEvent) => {
      if (isRecoverableClientError(event.reason)) {
        reloadOnceForChunkError();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (
        isRecoverableClientError(event.message) ||
        isRecoverableClientError(event.error)
      ) {
        reloadOnceForChunkError();
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
