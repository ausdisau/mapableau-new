import { coverageCareConfig } from "@/lib/config/coverage-care";
import {
  isProposedCoverageCareHost,
  PROPOSED_COVERAGE_CARE_HOST,
} from "@/lib/tenancy/tenant-host-policy";
import { getTenantPreviewGate } from "@/lib/tenancy/tenant-preview-policy";

export const DEFAULT_COVERAGE_CARE_HOST = PROPOSED_COVERAGE_CARE_HOST;
export const COVERAGE_CARE_REQUEST_HEADER = "x-mapable-coverage-care";
export const COVERAGE_CARE_BASE_PATH = "/t/coveragecare";

const PUBLIC_FILE = /\.[^/]+$/;

export function isCoverageCareHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  _configuredHost = coverageCareConfig.host || DEFAULT_COVERAGE_CARE_HOST,
): boolean {
  return isProposedCoverageCareHost(forwardedHost, host);
}

/**
 * Labs-style rewrite gated by preview policy.
 * Proposed host alone never activates when master flag is off.
 */
export function coverageCareRewritePath(pathname: string): string | null {
  const gate = getTenantPreviewGate();
  if (!gate.hostRewriteEnabled) return null;

  if (pathname === "/") return COVERAGE_CARE_BASE_PATH;

  if (
    pathname.startsWith("/t/") ||
    pathname.startsWith("/coverage-care") ||
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
