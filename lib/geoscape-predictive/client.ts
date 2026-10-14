import {
  geoscapePredictiveConfig,
  isGeoscapePredictiveConfigured,
} from "@/lib/config/geoscape-predictive";
import {
  geoscapeNotConfiguredError,
  geoscapeUpstreamError,
} from "@/lib/geoscape-predictive/geoscape-predictive-api-error";

type GeoscapeFetchOptions = {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  /** AbortSignal for request cancellation. */
  signal?: AbortSignal;
};

const memoryCache = new Map<string, { expiresAt: number; body: unknown }>();
const DEFAULT_TIMEOUT_MS = 8_000;

function buildUrl(path: string, query?: GeoscapeFetchOptions["query"]): string {
  const base = geoscapePredictiveConfig.baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function geoscapePredictiveGetJson<T>(
  options: GeoscapeFetchOptions,
): Promise<T> {
  if (!isGeoscapePredictiveConfigured()) {
    throw geoscapeNotConfiguredError();
  }

  const url = buildUrl(options.path, options.query);
  const ttlMs = geoscapePredictiveConfig.cacheTtlSeconds * 1000;
  const cached = memoryCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.body as T;
  }

  const apiKey = geoscapePredictiveConfig.apiKey!.trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onOuterAbort);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: apiKey,
        "API-Key": apiKey,
        Accept: "application/json",
      },
      signal: controller.signal,
      next: { revalidate: geoscapePredictiveConfig.cacheTtlSeconds },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw geoscapeUpstreamError(504, "Geoscape request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onOuterAbort);
  }

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const parsed = JSON.parse(text) as {
        error?: { description?: string; code?: string };
        message?: string | string[];
      };
      if (typeof parsed.error?.description === "string") {
        detail = parsed.error.description;
      } else if (typeof parsed.message === "string") {
        detail = parsed.message;
      } else if (Array.isArray(parsed.message)) {
        detail = parsed.message.join("; ");
      }
    } catch {
      detail = text.slice(0, 200) || undefined;
    }
    if (res.status === 429) {
      throw geoscapeUpstreamError(429, detail ?? "Geoscape rate limit exceeded");
    }
    throw geoscapeUpstreamError(res.status, detail);
  }

  let body: T;
  try {
    body = JSON.parse(text) as T;
  } catch {
    throw geoscapeUpstreamError(res.status, "Invalid JSON from Geoscape");
  }

  memoryCache.set(url, { expiresAt: Date.now() + ttlMs, body });
  return body;
}

/** Clears in-memory cache (for tests). */
export function clearGeoscapePredictiveClientCache(): void {
  memoryCache.clear();
}
