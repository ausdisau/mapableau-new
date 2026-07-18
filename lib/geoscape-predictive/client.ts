import {
  geoscapeNotConfiguredError,
  geoscapeUpstreamError,
} from "@/lib/geoscape-predictive/geoscape-predictive-api-error";
import {
  geoscapePredictiveConfig,
  isGeoscapePredictiveConfigured,
} from "@/lib/config/geoscape-predictive";

type GeoscapeFetchOptions = {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
};

const memoryCache = new Map<string, { expiresAt: number; body: unknown }>();

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
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: apiKey,
      "API-Key": apiKey,
      Accept: "application/json",
    },
    next: { revalidate: geoscapePredictiveConfig.cacheTtlSeconds },
  });

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
