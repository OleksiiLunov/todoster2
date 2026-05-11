export const TODO_SESSION_MARKER_STORAGE_KEY = "todoster:browser-session:v1";
export const TODO_SESSION_TTL_MS = 30 * 60 * 1000;
export const TODO_SESSION_HEARTBEAT_MS = 30 * 1000;

export type BrowserSessionMarker = {
  startedAt: number;
  lastSeenAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBrowserSessionMarker(
  value: unknown,
): value is BrowserSessionMarker {
  return (
    isRecord(value) &&
    typeof value.startedAt === "number" &&
    typeof value.lastSeenAt === "number" &&
    Number.isFinite(value.startedAt) &&
    Number.isFinite(value.lastSeenAt) &&
    value.startedAt > 0 &&
    value.lastSeenAt >= value.startedAt
  );
}

export function parseBrowserSessionMarker(rawMarker: string) {
  try {
    const parsedMarker: unknown = JSON.parse(rawMarker);
    return isBrowserSessionMarker(parsedMarker) ? parsedMarker : null;
  } catch {
    return null;
  }
}

export function readStoredBrowserSessionMarker() {
  const rawMarker = window.localStorage.getItem(TODO_SESSION_MARKER_STORAGE_KEY);

  if (!rawMarker) {
    return null;
  }

  return parseBrowserSessionMarker(rawMarker);
}

export function isBrowserSessionActive(
  marker: BrowserSessionMarker | null,
  now: number,
) {
  return Boolean(marker && now - marker.lastSeenAt <= TODO_SESSION_TTL_MS);
}

export function writeBrowserSessionMarker(marker: BrowserSessionMarker) {
  window.localStorage.setItem(
    TODO_SESSION_MARKER_STORAGE_KEY,
    JSON.stringify(marker),
  );
}

export function touchBrowserSessionMarker() {
  const now = Date.now();
  const marker = readStoredBrowserSessionMarker();
  const markerIsActive = isBrowserSessionActive(marker, now);

  writeBrowserSessionMarker({
    startedAt: markerIsActive && marker ? marker.startedAt : now,
    lastSeenAt: now,
  });
}
