export type MapAbleMobileBootstrap = {
  product: "MapAble";
  tagline: string;
  claimState: "capability-declaration";
  auth: {
    sourceOfTruth: "nextauth-web";
    nativeSessionExchange: boolean;
  };
  realtime: {
    enabled: boolean;
    redisBackplaneConfigured: boolean;
  };
  modules: {
    access: { publicSearch: boolean; requiresSession: boolean };
    care: { requiresSession: boolean };
    transport: { requiresSession: boolean };
    jobs: { requiresSession: boolean };
  };
};

const DEFAULT_WEB_URL = "https://mapable.com.au";

function normaliseBaseUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export function getMapAbleApiBaseUrl(): string {
  return normaliseBaseUrl(process.env.EXPO_PUBLIC_MAPABLE_API_URL);
}

export function isMapAblePlatformConfigured(): boolean {
  return getMapAbleApiBaseUrl().length > 0;
}

export function getMapAbleWebBaseUrl(): string {
  return normaliseBaseUrl(process.env.EXPO_PUBLIC_MAPABLE_WEB_URL) || DEFAULT_WEB_URL;
}

export function mapAbleWebUrl(path = "/"): string {
  const base = getMapAbleWebBaseUrl();
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalisedPath}`;
}

function isBootstrap(value: unknown): value is MapAbleMobileBootstrap {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.product !== "MapAble" || candidate.claimState !== "capability-declaration") {
    return false;
  }

  const auth = candidate.auth as Record<string, unknown> | undefined;
  const realtime = candidate.realtime as Record<string, unknown> | undefined;
  const modules = candidate.modules as Record<string, unknown> | undefined;
  if (!auth || !realtime || !modules) return false;

  const access = modules.access as Record<string, unknown> | undefined;
  const care = modules.care as Record<string, unknown> | undefined;
  const transport = modules.transport as Record<string, unknown> | undefined;
  const jobs = modules.jobs as Record<string, unknown> | undefined;

  return (
    typeof candidate.tagline === "string" &&
    auth.sourceOfTruth === "nextauth-web" &&
    typeof auth.nativeSessionExchange === "boolean" &&
    typeof realtime.enabled === "boolean" &&
    typeof realtime.redisBackplaneConfigured === "boolean" &&
    Boolean(access) &&
    typeof access?.publicSearch === "boolean" &&
    typeof access?.requiresSession === "boolean" &&
    Boolean(care) &&
    typeof care?.requiresSession === "boolean" &&
    Boolean(transport) &&
    typeof transport?.requiresSession === "boolean" &&
    Boolean(jobs) &&
    typeof jobs?.requiresSession === "boolean"
  );
}

export class MapAblePlatformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapAblePlatformError";
  }
}

export async function loadMapAbleMobileBootstrap(): Promise<MapAbleMobileBootstrap> {
  const baseUrl = getMapAbleApiBaseUrl();
  if (!baseUrl) {
    throw new MapAblePlatformError("MapAble platform connection is not configured for this build.");
  }

  const response = await fetch(`${baseUrl}/api/mobile/bootstrap`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MapAblePlatformError("MapAble returned an unreadable mobile bootstrap response.");
  }

  if (!response.ok) {
    throw new MapAblePlatformError(`MapAble mobile bootstrap failed with status ${response.status}.`);
  }

  const body =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  if (!isBootstrap(body)) {
    throw new MapAblePlatformError("MapAble returned an unexpected mobile bootstrap response.");
  }

  return body;
}
