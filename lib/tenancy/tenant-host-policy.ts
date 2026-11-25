export const PROPOSED_COVERAGE_CARE_HOST = "coveragecare.mapable.com.au";

/** Permanently reserved subdomain labels — never activate as white-label tenants. */
export const RESERVED_TENANT_HOST_LABELS = [
  "auth",
  "admin",
  "api",
  "www",
  "peer",
  "labs",
  "app",
  "login",
  "sso",
  "cdn",
  "static",
  "assets",
  "mail",
  "smtp",
  "status",
  "docs",
] as const;

export type HostResolution =
  | { kind: "proposed_tenant"; host: string; slug: "coveragecare" }
  | { kind: "reserved"; host: string; label: string }
  | { kind: "unknown"; host: string }
  | { kind: "empty" };

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

function subdomainLabel(host: string): string | null {
  const parts = host.split(".");
  if (parts.length < 3) return null;
  // e.g. coveragecare.mapable.com.au → coveragecare
  if (parts.slice(-3).join(".") === "mapable.com.au") {
    return parts[0] ?? null;
  }
  return null;
}

/**
 * Pure allow-list hostname parser. Hostname is branding context only —
 * never treat Host as authorisation.
 */
export function resolveTenantHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
  proposedHost = PROPOSED_COVERAGE_CARE_HOST,
): HostResolution {
  const resolved = normalizeHost(forwardedHost) || normalizeHost(host);
  if (!resolved) return { kind: "empty" };

  if (resolved === normalizeHost(proposedHost)) {
    return {
      kind: "proposed_tenant",
      host: resolved,
      slug: "coveragecare",
    };
  }

  const label = subdomainLabel(resolved);
  if (label && (RESERVED_TENANT_HOST_LABELS as readonly string[]).includes(label)) {
    return { kind: "reserved", host: resolved, label };
  }

  return { kind: "unknown", host: resolved };
}

export function isProposedCoverageCareHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
): boolean {
  return resolveTenantHost(forwardedHost, host).kind === "proposed_tenant";
}

export function isReservedTenantLabel(label: string): boolean {
  return (RESERVED_TENANT_HOST_LABELS as readonly string[]).includes(
    label.trim().toLowerCase(),
  );
}
