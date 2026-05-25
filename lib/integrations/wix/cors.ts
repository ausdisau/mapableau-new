import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getWixApiAllowedOrigins } from "@/lib/integrations/wix/config";

/** Browser-facing routes the Wix site may call cross-origin. */
export const WIX_CORS_API_PATH_PREFIXES = [
  "/api/search/autocomplete",
] as const;

export function isWixCorsApiPath(pathname: string): boolean {
  return WIX_CORS_API_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAllowedWixOrigin(origin: string | null): origin is string {
  if (!origin) return false;
  return getWixApiAllowedOrigins().includes(origin);
}

export function wixCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function shouldApplyWixCors(request: NextRequest): boolean {
  return isWixCorsApiPath(request.nextUrl.pathname);
}

export function wixPreflightResponse(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  if (!isAllowedWixOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: wixCorsHeaders(origin),
  });
}

export function applyWixCorsToResponse(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const origin = request.headers.get("origin");
  if (!isAllowedWixOrigin(origin)) return response;
  for (const [key, value] of Object.entries(wixCorsHeaders(origin))) {
    response.headers.set(key, value);
  }
  return response;
}
