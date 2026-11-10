/**
 * Shared Labs/Peers-style host → path-prefix rewrite helpers.
 * DNS attach remains deferred until human review.
 */

const PUBLIC_FILE = /\.[^/]+$/;

export function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function resolveRequestHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
): string {
  return normalizeHost(forwardedHost) || normalizeHost(host);
}

export function isConfiguredHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  configuredHost: string,
): boolean {
  return resolveRequestHost(forwardedHost, host) === normalizeHost(configuredHost);
}

export type SubdomainRouteAdapter = {
  readonly id: string;
  readonly defaultHost: string;
  readonly envHostKey: string;
  /** Internal Next.js path prefix, e.g. `/care`. */
  readonly pathPrefix: string;
  /**
   * Optional exact public paths on the subdomain that map to a specific
   * internal path (e.g. `/review` → `/marketplace/accessimart-review`).
   */
  readonly specialPaths?: Readonly<Record<string, string>>;
};

export function configuredHostFor(
  adapter: SubdomainRouteAdapter,
  env: Record<string, string | undefined> = process.env,
): string {
  return env[adapter.envHostKey] ?? adapter.defaultHost;
}

export function isAdapterHost(
  adapter: SubdomainRouteAdapter,
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): boolean {
  return isConfiguredHost(
    forwardedHost,
    host,
    configuredHostFor(adapter, env),
  );
}

function shouldSkipRewrite(pathname: string, pathPrefix: string): boolean {
  return (
    pathname === pathPrefix ||
    pathname.startsWith(`${pathPrefix}/`) ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE.test(pathname)
  );
}

/**
 * Rewrite a clean subdomain path into the adapter's path prefix.
 * Returns null when no rewrite is required.
 */
export function rewriteSubdomainPath(
  adapter: SubdomainRouteAdapter,
  pathname: string,
): string | null {
  const special = adapter.specialPaths?.[pathname];
  if (special) return special;

  if (pathname === "/") return adapter.pathPrefix;

  if (shouldSkipRewrite(pathname, adapter.pathPrefix)) {
    return null;
  }

  return `${adapter.pathPrefix}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
