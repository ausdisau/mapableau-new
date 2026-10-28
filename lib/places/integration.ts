/**
 * MapAble Places × CripSquare prototype integration contract.
 *
 * PUBLIC DATA ONLY. Never import personal check-in, memory, disability,
 * event attendance or community-post data into the canonical AccessPlace store.
 * No runtime connection to the CripSquare backend is implied.
 */
type PlacesEnv = {
  MAPABLE_PLACES_PROTOTYPE_ENABLED?: string;
  MAPABLE_PLACES_EXPO_ORIGIN?: string;
  MAPABLE_PLACES_PREVIEW_URL?: string;
  NODE_ENV?: string;
};

export function isPlacesPrototypeEnabled(
  env: PlacesEnv = process.env,
): boolean {
  return env.MAPABLE_PLACES_PROTOTYPE_ENABLED === "true";
}

/** Reject invalid, credential-bearing, path-bearing or downgraded preview URLs. */
export function normalisePlacesPreviewOrigin(
  value: string | undefined,
  environment: string | undefined = process.env.NODE_ENV,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      return null;
    }
    if (url.protocol === "https:") return url.origin;
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(
      url.hostname.toLowerCase(),
    );
    return environment !== "production" && url.protocol === "http:" && local
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

/**
 * Read-only mobile/web connector. Permit the exact same-origin request,
 * optionally an approved Expo origin, and localhost Expo on developer machines.
 * Never issue wildcard CORS or credential-sharing headers.
 */
export function allowedPlacesOrigin(
  requestOrigin: string | null,
  serverOrigin: string,
  env: PlacesEnv = process.env,
): string | null {
  if (!requestOrigin || requestOrigin === "null") return null;
  if (requestOrigin === serverOrigin) return requestOrigin;
  const configured = normalisePlacesPreviewOrigin(
    env.MAPABLE_PLACES_EXPO_ORIGIN,
    env.NODE_ENV,
  );
  if (configured && requestOrigin === configured) return requestOrigin;
  if (env.NODE_ENV !== "production") {
    const localOrigins = new Set([
      "http://localhost:8081",
      "http://127.0.0.1:8081",
    ]);
    if (localOrigins.has(requestOrigin)) return requestOrigin;
  }
  return null;
}

export type PublicPlacesRecord = {
  id: string;
  name: string;
  category: string;
  suburb: string | null;
  source: "mapable-published-directory";
  stepFree: "unknown";
  accessibleToilet: "unknown";
};

export function toPublicPlacesRecord(place: {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
}): PublicPlacesRecord {
  // A published directory record alone cannot confirm feature-level
  // accessibility or establish personal AccessFit.
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    suburb: place.suburb ?? null,
    source: "mapable-published-directory",
    stepFree: "unknown",
    accessibleToilet: "unknown",
  };
}
