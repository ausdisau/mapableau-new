import { createHmac } from "node:crypto";

import { ptvConfig, isPtvConfigured } from "@/lib/config/ptv";
import { TransportApiError } from "@/lib/transport/transport-api-error";

type PtvFetchOptions = {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
};

const memoryCache = new Map<string, { expiresAt: number; body: unknown }>();

function buildSignedPath(path: string, query?: PtvFetchOptions["query"]): string {
  const devId = ptvConfig.devId!;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams();
  params.set("devid", devId);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
  }
  const pathAndQuery = `${normalizedPath}?${params.toString()}`;
  const signature = createHmac("sha1", ptvConfig.apiKey!)
    .update(pathAndQuery)
    .digest("hex")
    .toUpperCase();
  return `${pathAndQuery}&signature=${signature}`;
}

export function buildPtvSignature(path: string, devId: string, apiKey: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathAndQuery = `${normalizedPath}?devid=${devId}`;
  return createHmac("sha1", apiKey).update(pathAndQuery).digest("hex").toUpperCase();
}

export function ptvNotConfiguredError() {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    "PTV Timetable API is not configured. Set PTV_DEV_ID and PTV_API_KEY on the server."
  );
}

function ptvUpstreamError(status: number, detail?: string) {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    detail ?? `PTV API returned status ${status}. Please try again later.`,
    { upstreamStatus: status }
  );
}

export async function ptvGetJson<T>(options: PtvFetchOptions): Promise<T> {
  if (!isPtvConfigured()) throw ptvNotConfiguredError();

  const signedPath = buildSignedPath(options.path, options.query);
  const url = `${ptvConfig.baseUrl}${signedPath}`;
  const ttlMs = ptvConfig.cacheTtlSeconds * 1000;
  const cached = memoryCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.body as T;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: ptvConfig.cacheTtlSeconds },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw ptvUpstreamError(res.status, text.slice(0, 200) || undefined);
  }

  const body = (await res.json()) as T;
  memoryCache.set(url, { expiresAt: Date.now() + ttlMs, body });
  return body;
}

export function clearPtvClientCache(): void {
  memoryCache.clear();
}
