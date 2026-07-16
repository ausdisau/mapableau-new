import type {
  LiveFeedStatus,
  LiveStatusAdapter,
  LiveStatusObservation,
  LiveStatusQuery,
} from "@/lib/access-intelligence/live/types";

type HttpAdapterOptions = {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
};

const LIVE_FEED_STATUSES: ReadonlySet<string> = new Set([
  "operational",
  "degraded",
  "unavailable",
  "unknown",
  "resolved",
]);

/**
 * Typed HTTP BMS adapter. Expects JSON:
 * { observations: LiveStatusObservation[] } or LiveStatusObservation[]
 * Never throws — network/parse failures return [] so callers fall back to last-known.
 */
export class HttpBmsLiveStatusAdapter implements LiveStatusAdapter {
  readonly id: string;
  readonly kind = "bms_http" as const;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options: HttpAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 4000;
    this.id = `bms-http:${this.baseUrl}`;
  }

  async fetchObservations(query: LiveStatusQuery): Promise<LiveStatusObservation[]> {
    const url = new URL(`${this.baseUrl}/live-status`);
    url.searchParams.set("placeId", query.placeId);
    if (query.subjectKind) url.searchParams.set("subjectKind", query.subjectKind);
    if (query.subjectId) url.searchParams.set("subjectId", query.subjectId);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) return [];

      const body: unknown = await response.json();
      return normalizeObservations(body, query.placeId);
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}

function normalizeObservations(body: unknown, placeId: string): LiveStatusObservation[] {
  const raw = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { observations?: unknown }).observations)
      ? (body as { observations: unknown[] }).observations
      : [];

  const out: LiveStatusObservation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const status = row.status;
    const subjectKind = row.subjectKind;
    const subjectId = row.subjectId;
    const summary = row.summary;
    if (
      typeof subjectId !== "string" ||
      typeof summary !== "string" ||
      (subjectKind !== "feature" &&
        subjectKind !== "element" &&
        subjectKind !== "segment" &&
        subjectKind !== "place") ||
      typeof status !== "string" ||
      !LIVE_FEED_STATUSES.has(status)
    ) {
      continue;
    }

    out.push({
      placeId: typeof row.placeId === "string" ? row.placeId : placeId,
      subjectKind,
      subjectId,
      status: status as LiveFeedStatus,
      summary,
      observedAt:
        typeof row.observedAt === "string" ? row.observedAt : new Date().toISOString(),
      sourceKind: "bms_http",
      sourceId: typeof row.sourceId === "string" ? row.sourceId : "bms-http",
      confidence: typeof row.confidence === "number" ? row.confidence : 0.7,
      payload:
        row.payload && typeof row.payload === "object"
          ? (row.payload as Record<string, unknown>)
          : undefined,
    });
  }
  return out;
}
