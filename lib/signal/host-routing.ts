/**
 * Host routing for signal.mapable.com.au → /signal
 */

import { SIGNAL_SUBDOMAIN } from "@/lib/platform/mapable-subdomain-registry";
import {
  isConfiguredHost,
  rewriteSubdomainPath,
} from "@/lib/platform/subdomain-route-adapter";

export const DEFAULT_SIGNAL_HOST = SIGNAL_SUBDOMAIN.defaultHost;

export function isSignalHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost = process.env.MAPABLE_SIGNAL_HOST ?? DEFAULT_SIGNAL_HOST,
): boolean {
  return isConfiguredHost(forwardedHost, host, configuredHost);
}

export function signalRewritePath(pathname: string): string | null {
  return rewriteSubdomainPath(SIGNAL_SUBDOMAIN, pathname);
}
