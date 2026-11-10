/**
 * Host routing for signal.mapable.com.au → /signal
 *
 * Mirrors Labs/Peers: same Next.js app, distinct public origin.
 * Do not attach DNS until preview + review pass.
 */

export const DEFAULT_SIGNAL_HOST = "signal.mapable.com.au";

const PUBLIC_FILE = /\.[^/]+$/;

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function isSignalHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = process.env.MAPABLE_SIGNAL_HOST ?? DEFAULT_SIGNAL_HOST,
): boolean {
  const resolvedHost = normalizeHost(forwardedHost) || normalizeHost(host);
  return resolvedHost === normalizeHost(configuredHost);
}

/**
 * Rewrite clean Signal-subdomain paths into the /signal route group.
 * Returns null when no rewrite is required (already /signal, API, static).
 */
export function signalRewritePath(pathname: string): string | null {
  if (pathname === "/") return "/signal";

  if (
    pathname.startsWith("/signal") ||
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

  return `/signal${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
