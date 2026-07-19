/**
 * Access Independence feature gates.
 * Provider barrier inbox is fail-closed until reports carry organisationId.
 * Canonical place→organisation ownership is not yet modelled — see docs/qa.
 */
export const accessIndependenceConfig = {
  /**
   * When false, provider inbox returns empty / 404 for unassigned scope.
   * Org-bound reports still require membership + permission.
   */
  providerBarrierInboxEnabled:
    process.env.ACCESS_INDEPENDENCE_PROVIDER_BARRIER_INBOX !== "false",
  /** Max anonymous barrier submissions per IP per window. */
  anonymousBarrierMaxPerWindow: 5,
  anonymousBarrierWindowMs: 60 * 60 * 1000,
  /** Magic-link request throttles. */
  magicLinkMaxPerIpWindow: 10,
  magicLinkMaxPerEmailWindow: 5,
  magicLinkWindowMs: 15 * 60 * 1000,
  magicLinkTtlSeconds: 15 * 60,
  /** Local draft max serialized bytes. */
  localDraftMaxBytes: 8_000,
};

export function isProviderBarrierInboxEnabled(): boolean {
  return accessIndependenceConfig.providerBarrierInboxEnabled;
}
