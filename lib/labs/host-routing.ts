export const DEFAULT_LABS_HOST = "labs.mapable.com.au";

const PUBLIC_FILE = /\.[^/]+$/;

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function isLabsHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = DEFAULT_LABS_HOST,
): boolean {
  const resolvedHost = normalizeHost(forwardedHost) || normalizeHost(host);
  return resolvedHost === normalizeHost(configuredHost);
}

export function labsRewritePath(pathname: string): string | null {
  if (pathname === "/") return "/labs";

  if (
    pathname.startsWith("/labs") ||
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

  return `/labs${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
