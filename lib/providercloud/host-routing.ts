export const DEFAULT_PROVIDERCLOUD_HOST = "cloud.mapable.com.au";

const PUBLIC_FILE = /\.[^/]+$/;

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function isProviderCloudHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = DEFAULT_PROVIDERCLOUD_HOST,
): boolean {
  const resolvedHost = normalizeHost(forwardedHost) || normalizeHost(host);
  return resolvedHost === normalizeHost(configuredHost);
}

/**
 * Only the cloud host root is rewritten into the ProviderCloud surface.
 * Login, APIs, and the existing /provider console pass through so the same
 * Vercel project can serve cloud.mapable.com.au without a second app.
 */
export function providerCloudRewritePath(pathname: string): string | null {
  if (pathname === "/") return "/providercloud";

  if (
    pathname.startsWith("/providercloud") ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname.startsWith("/provider") ||
    pathname.startsWith("/provider-ops") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return null;
  }

  return `/providercloud${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function isProviderCloudSupplierPath(pathname: string): boolean {
  return (
    pathname === "/api/grocery/supplier" ||
    pathname.startsWith("/api/grocery/supplier/")
  );
}
