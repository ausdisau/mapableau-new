/**
 * Host routing for accessimart.mapable.com.au → /marketplace
 *
 * Public programme root (option 1). Review surface via /review on the same
 * host (option 2 path) — still flag/allowlist gated at the page layer.
 */

import { ACCESSIMART_SUBDOMAIN } from "@/lib/platform/mapable-subdomain-registry";
import {
  isConfiguredHost,
  rewriteSubdomainPath,
} from "@/lib/platform/subdomain-route-adapter";

export const DEFAULT_ACCESSIMART_HOST = ACCESSIMART_SUBDOMAIN.defaultHost;

export function isAccessiMartHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = process.env.MAPABLE_ACCESSIMART_HOST ??
    DEFAULT_ACCESSIMART_HOST,
): boolean {
  return isConfiguredHost(forwardedHost, host, configuredHost);
}

export function accessiMartRewritePath(pathname: string): string | null {
  return rewriteSubdomainPath(ACCESSIMART_SUBDOMAIN, pathname);
}
