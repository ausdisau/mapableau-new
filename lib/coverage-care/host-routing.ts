import { coverageCareConfig } from "@/lib/config/coverage-care";

export const DEFAULT_COVERAGE_CARE_HOST = "coveragecare.mapable.com.au";
export const COVERAGE_CARE_REQUEST_HEADER = "x-mapable-coverage-care";
export const COVERAGE_CARE_BASE_PATH = "/coverage-care";

const PUBLIC_FILE = /\.[^/]+$/;

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function isCoverageCareHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = coverageCareConfig.host || DEFAULT_COVERAGE_CARE_HOST,
): boolean {
  const resolvedHost = normalizeHost(forwardedHost) || normalizeHost(host);
  return resolvedHost === normalizeHost(configuredHost);
}

/**
 * Labs-style rewrite: public paths on the Coverage Care host map under
 * `/coverage-care`. API, robots, sitemap, and static files are never rewritten
 * so apex SEO/CSP behaviour stays intact.
 */
export function coverageCareRewritePath(pathname: string): string | null {
  if (pathname === "/") return COVERAGE_CARE_BASE_PATH;

  if (
    pathname.startsWith(COVERAGE_CARE_BASE_PATH) ||
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

  return `${COVERAGE_CARE_BASE_PATH}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
