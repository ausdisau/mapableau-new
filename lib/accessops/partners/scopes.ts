export const ACCESSOPS_PARTNER_SCOPES = [
  "assets:read",
  "status:read",
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
