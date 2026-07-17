function envFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const wave13FeatureFlags = {
  governanceEnabled: envFlag("WAVE13_PUBLIC_INTEREST_GOVERNANCE_ENABLED", true),
  transparencyPublicPagesEnabled: envFlag(
    "WAVE13_TRANSPARENCY_PUBLIC_PAGES_ENABLED",
    true,
  ),
  autoPublishRegisterEnabled: envFlag(
    "WAVE13_AUTO_PUBLISH_REGISTER_ENABLED",
    false,
  ),
  independentReviewRequired: envFlag(
    "WAVE13_INDEPENDENT_REVIEW_REQUIRED",
    true,
  ),
  publicRegisterAppendOnly: envFlag("WAVE13_PUBLIC_REGISTER_APPEND_ONLY", true),
};
