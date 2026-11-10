/**
 * Provider Center on business.mapable.com.au — Meta Business Suite–style host.
 * Same Vercel project; middleware rewrites clean paths into /provider/*.
 */

export const DEFAULT_BUSINESS_HOST = "business.mapable.com.au";

/** Request header set when middleware rewrites a business-host request. */
export const BUSINESS_HOST_REQUEST_HEADER = "x-mapable-business-host";

const PUBLIC_FILE = /\.[^/]+$/;

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function resolveBusinessHost(
  configuredHost = process.env.MAPABLE_BUSINESS_HOST ?? DEFAULT_BUSINESS_HOST,
): string {
  return normalizeHost(configuredHost) || DEFAULT_BUSINESS_HOST;
}

export function isBusinessHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = resolveBusinessHost(),
): boolean {
  const resolvedHost = normalizeHost(forwardedHost) || normalizeHost(host);
  return resolvedHost === normalizeHost(configuredHost);
}

/**
 * Map a public business-host path to the internal /provider App Router path.
 * Returns null when no rewrite is needed (API, static, already /provider).
 */
export function businessRewritePath(pathname: string): string | null {
  if (pathname === "/") return "/provider";

  if (
    pathname === "/provider" ||
    pathname.startsWith("/provider/") ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/login") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return null;
  }

  return `/provider${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/**
 * Strip /provider prefix for canonical clean URLs on the business host.
 * Returns the public path, or null when the path should not be redirected.
 */
export function businessStripProviderPrefix(pathname: string): string | null {
  if (pathname === "/provider") return "/";
  if (pathname.startsWith("/provider/")) {
    const stripped = pathname.slice("/provider".length);
    return stripped || "/";
  }
  return null;
}

/**
 * Build a nav href that is clean on the business host and prefixed on apex.
 */
export function providerCenterPath(
  subpath: string,
  onBusinessHost: boolean,
): string {
  const normalized =
    subpath === "" || subpath === "/"
      ? ""
      : subpath.startsWith("/")
        ? subpath
        : `/${subpath}`;

  if (onBusinessHost) return normalized || "/";
  return normalized ? `/provider${normalized}` : "/provider";
}
