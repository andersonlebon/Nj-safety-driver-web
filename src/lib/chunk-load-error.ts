export const CHUNK_RELOAD_KEY = "njs-chunk-reload";

/** Transient network / RSC fetch failures (e.g. ERR_NETWORK_CHANGED). */
export function isNetworkFetchError(reason: unknown): boolean {
  if (reason == null) return false;

  const text =
    typeof reason === "string"
      ? reason
      : reason instanceof Error
        ? `${reason.name} ${reason.message}`
        : typeof reason === "object" && "message" in reason
          ? String((reason as { message: unknown }).message)
          : String(reason);

  const lower = text.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("err_network_changed") ||
    lower.includes("load failed")
  );
}

export function isRecoverableClientError(reason: unknown): boolean {
  return isChunkLoadError(reason) || isNetworkFetchError(reason);
}

/** True when a failed dynamic import / stale Next.js chunk is the cause. */
export function isChunkLoadError(reason: unknown): boolean {
  if (reason == null) return false;

  const text =
    typeof reason === "string"
      ? reason
      : reason instanceof Error
        ? `${reason.name} ${reason.message}`
        : typeof reason === "object" && "message" in reason
          ? String((reason as { message: unknown }).message)
          : String(reason);

  return (
    text.includes("Loading chunk") ||
    text.includes("ChunkLoadError") ||
    text.includes("Failed to fetch dynamically imported module") ||
    text.includes("Importing a module script failed")
  );
}

/** Full reload once per tab session (stale bundle or flaky network). */
export function reloadOnceForChunkError(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    // sessionStorage unavailable — still reload
  }

  window.location.reload();
  return true;
}
