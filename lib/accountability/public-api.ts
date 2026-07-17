import { randomUUID } from "crypto";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { accountabilityConfig } from "@/lib/config/accountability";

export function createRequestId(): string {
  return randomUUID();
}

export function publicApiHeaders(requestId: string, etag?: string): HeadersInit {
  const headers: Record<string, string> = {
    "X-Request-Id": requestId,
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  };
  if (etag) {
    headers.ETag = etag;
  }
  const allow = accountabilityConfig.corsAllowList;
  if (allow.length > 0) {
    headers["Access-Control-Allow-Origin"] = allow[0]!;
    headers.Vary = "Origin";
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }
  return headers;
}

export function enforcePublicApiRateLimit(request: Request): Response | null {
  const ip = getClientIp(request);
  const allowed = checkIpRateLimit(`accountability-public:${ip}`, {
    windowMs: 60_000,
    max: 60,
  });
  if (!allowed) {
    const requestId = createRequestId();
    return Response.json(
      { error: "Rate limit exceeded", requestId },
      { status: 429, headers: publicApiHeaders(requestId) }
    );
  }
  return null;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { data: T[]; page: number; pageSize: number; total: number; hasMore: boolean } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(Math.floor(pageSize), 100)
      : 25;
  const start = (safePage - 1) * safeSize;
  const data = items.slice(start, start + safeSize);
  return {
    data,
    page: safePage,
    pageSize: safeSize,
    total: items.length,
    hasMore: start + safeSize < items.length,
  };
}

export function weakEtag(payload: unknown): string {
  const body = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < body.length; i++) {
    hash = (hash * 31 + body.charCodeAt(i)) >>> 0;
  }
  return `W/"${hash.toString(16)}-${body.length}"`;
}
