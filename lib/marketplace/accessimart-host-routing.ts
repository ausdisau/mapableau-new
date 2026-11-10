/**
 * Host routing for accessimart.mapable.com.au → /marketplace
 *
 * Public programme surface only. Does not enable AccessiMart review commerce,
 * MAPABLE_ACCESSIMART_REVIEW_ENABLED, or transactional shop routes.
 */

export const DEFAULT_ACCESSIMART_HOST = "accessimart.mapable.com.au";

const PUBLIC_FILE = /\.[^/]+$/;

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function isAccessiMartHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = process.env.MAPABLE_ACCESSIMART_HOST ??
    DEFAULT_ACCESSIMART_HOST,
): boolean {
  const resolvedHost = normalizeHost(forwardedHost) || normalizeHost(host);
  return resolvedHost === normalizeHost(configuredHost);
}

/**
 * Rewrite AccessiMart-subdomain paths into the public Marketplace programme.
 * Review and shop paths keep their explicit prefixes when already present.
 */
export function accessiMartRewritePath(pathname: string): string | null {
  if (pathname === "/") return "/marketplace";

  if (
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return null;
  }

  return `/marketplace${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
