/**
 * Feature policy — which internal keys are known Wave 8 features. This is a
 * closed list. New features must be added here explicitly.
 */

export const KNOWN_FEATURE_KEYS = [
  "ndis.claim.submit",
  "ndis.claim.batch",
  "ndis.payments.reconcile",
  "care.dispatch",
  "transport.dispatch",
  "assurance.evidence.upload",
  "assurance.exceptions.manage",
  "reporting.provider_benchmarks",
  "reporting.social_impact",
  "market.provider_ranking",
  "market.sponsored_content",
  "analytics.privacy_aggregation",
  "ai.matching",
  "ai.copilot",
  "platform.federation.join",
] as const;

export type FeatureKey = (typeof KNOWN_FEATURE_KEYS)[number];

export function isKnownFeatureKey(key: string): key is FeatureKey {
  return (KNOWN_FEATURE_KEYS as readonly string[]).includes(key);
}
