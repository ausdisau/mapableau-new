/**
 * MapAble programme subdomain registry (host → internal path).
 *
 * Peers (`peer.mapable.com.au`) and Labs keep dedicated handlers.
 * DNS / Vercel domain attach is deferred — see
 * docs/architecture/mapable-subdomain-dns-cloudflare-vercel-neon.md
 */

import {
  type SubdomainRouteAdapter,
  isAdapterHost,
  rewriteSubdomainPath,
} from "@/lib/platform/subdomain-route-adapter";

export const ACCESSIMART_SUBDOMAIN: SubdomainRouteAdapter = {
  id: "accessimart",
  defaultHost: "accessimart.mapable.com.au",
  envHostKey: "MAPABLE_ACCESSIMART_HOST",
  pathPrefix: "/marketplace",
  // Option 2 surface without changing the safe programme root (option 1).
  specialPaths: {
    "/review": "/marketplace/accessimart-review",
    "/accessimart-review": "/marketplace/accessimart-review",
  },
};

export const MARKETPLACE_SUBDOMAIN: SubdomainRouteAdapter = {
  id: "marketplace",
  defaultHost: "marketplace.mapable.com.au",
  envHostKey: "MAPABLE_MARKETPLACE_HOST",
  pathPrefix: "/marketplace",
};

export const ECOSYSTEM_SUBDOMAIN: SubdomainRouteAdapter = {
  id: "ecosystem",
  defaultHost: "ecosystem.mapable.com.au",
  envHostKey: "MAPABLE_ECOSYSTEM_HOST",
  pathPrefix: "/ecosystem",
};

export const CARE_SUBDOMAIN: SubdomainRouteAdapter = {
  id: "care",
  defaultHost: "care.mapable.com.au",
  envHostKey: "MAPABLE_CARE_HOST",
  pathPrefix: "/care",
};

export const TRANSPORT_SUBDOMAIN: SubdomainRouteAdapter = {
  id: "transport",
  defaultHost: "transport.mapable.com.au",
  envHostKey: "MAPABLE_TRANSPORT_HOST",
  pathPrefix: "/transport",
};

export const EMPLOYMENT_SUBDOMAIN: SubdomainRouteAdapter = {
  id: "employment",
  defaultHost: "employment.mapable.com.au",
  envHostKey: "MAPABLE_EMPLOYMENT_HOST",
  pathPrefix: "/employment",
};

export const SIGNAL_SUBDOMAIN: SubdomainRouteAdapter = {
  id: "signal",
  defaultHost: "signal.mapable.com.au",
  envHostKey: "MAPABLE_SIGNAL_HOST",
  pathPrefix: "/signal",
};

/** Programme subdomains handled by the shared middleware loop. */
export const MAPABLE_PROGRAMME_SUBDOMAINS: readonly SubdomainRouteAdapter[] = [
  ACCESSIMART_SUBDOMAIN,
  MARKETPLACE_SUBDOMAIN,
  ECOSYSTEM_SUBDOMAIN,
  CARE_SUBDOMAIN,
  TRANSPORT_SUBDOMAIN,
  EMPLOYMENT_SUBDOMAIN,
  SIGNAL_SUBDOMAIN,
] as const;

export type SubdomainRewriteMatch = {
  readonly adapter: SubdomainRouteAdapter;
  readonly rewritePath: string;
};

/**
 * Return the first matching programme-subdomain rewrite for this request host.
 * Order is registry order; AccessiMart is listed before Marketplace so both
 * hosts remain distinct even though they share `/marketplace` as pathPrefix.
 */
export function matchProgrammeSubdomainRewrite(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  pathname: string,
  env: Record<string, string | undefined> = process.env,
): SubdomainRewriteMatch | null {
  for (const adapter of MAPABLE_PROGRAMME_SUBDOMAINS) {
    if (!isAdapterHost(adapter, forwardedHost, host, env)) continue;
    const rewritePath = rewriteSubdomainPath(adapter, pathname);
    if (!rewritePath) return null;
    return { adapter, rewritePath };
  }
  return null;
}

export function listProgrammeSubdomainHosts(
  env: Record<string, string | undefined> = process.env,
): readonly { id: string; host: string; pathPrefix: string }[] {
  return MAPABLE_PROGRAMME_SUBDOMAINS.map((adapter) => ({
    id: adapter.id,
    host: env[adapter.envHostKey] ?? adapter.defaultHost,
    pathPrefix: adapter.pathPrefix,
  }));
}
