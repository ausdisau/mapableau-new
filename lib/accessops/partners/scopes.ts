export const ACCESSOPS_PARTNER_SCOPES = [
  "assets:read",
  "features:read",
  "status:read",
  "status:write",
  "incidents:read",
  "reliability:read",
  "observations:write",
  "webhooks:write",
  "open-data:read",
] as const;
export type AccessOpsPartnerScope = (typeof ACCESSOPS_PARTNER_SCOPES)[number];

export function hasPartnerScope(
  scopes: string[],
  required: AccessOpsPartnerScope,
): boolean {
  return scopes.includes(required);
}
