/**
 * Feature flag for accessibility reviews v1 (accessibility_reviews_v1).
 * Server and client: prefer NEXT_PUBLIC_ for browser bundles.
 */
export const accessibilityReviewsConfig = {
  enabled:
    process.env.ACCESSIBILITY_REVIEWS_V1_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_ACCESSIBILITY_REVIEWS_V1_ENABLED === "true",
  flagKey: "accessibility_reviews_v1",
} as const;

export const accessibilityReviewsV1Enabled =
  accessibilityReviewsConfig.enabled;
