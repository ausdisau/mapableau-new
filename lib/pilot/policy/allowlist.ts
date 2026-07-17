/**
 * Fail-closed allowlists: empty array means NO permission (deny all).
 */

export function isSupportItemAllowed(
  allowlist: readonly string[],
  supportItemCode: string
): boolean {
  if (allowlist.length === 0) return false;
  const code = supportItemCode.trim();
  if (!code) return false;
  return allowlist.includes(code);
}

export function isFundingRouteAllowed(
  allowlist: readonly string[],
  fundingRoute: string
): boolean {
  if (allowlist.length === 0) return false;
  const route = fundingRoute.trim();
  if (!route) return false;
  return allowlist.includes(route);
}

export function isIntegrationProfileAllowed(
  allowlist: readonly string[],
  profileId: string
): boolean {
  if (allowlist.length === 0) return false;
  const id = profileId.trim();
  if (!id) return false;
  return allowlist.includes(id);
}

export function assertSupportItemAllowed(
  allowlist: readonly string[],
  supportItemCode: string
): void {
  if (!isSupportItemAllowed(allowlist, supportItemCode)) {
    throw new Error(
      allowlist.length === 0
        ? "SUPPORT_ITEM_ALLOWLIST_EMPTY_DENY"
        : `SUPPORT_ITEM_NOT_ALLOWLISTED:${supportItemCode}`
    );
  }
}

export function assertFundingRouteAllowed(
  allowlist: readonly string[],
  fundingRoute: string
): void {
  if (!isFundingRouteAllowed(allowlist, fundingRoute)) {
    throw new Error(
      allowlist.length === 0
        ? "FUNDING_ROUTE_ALLOWLIST_EMPTY_DENY"
        : `FUNDING_ROUTE_NOT_ALLOWLISTED:${fundingRoute}`
    );
  }
}
