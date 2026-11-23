export const DEFAULT_PROVIDERCLOUD_HOST = "cloud.mapable.com.au";

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

  return null;
}

export function isProviderCloudSupplierPath(pathname: string): boolean {
  return (
    pathname === "/api/grocery/supplier" ||
    pathname.startsWith("/api/grocery/supplier/")
  );
}
