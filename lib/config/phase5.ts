export const phase5Config = {
  aiMatchingEnabled: process.env.AI_MATCHING_ENABLED === "true",
  aiMatchingProvider: process.env.AI_MATCHING_PROVIDER ?? "disabled",
  aiMatchingRequireHumanReview:
    process.env.AI_MATCHING_REQUIRE_HUMAN_REVIEW !== "false",
  fairnessChecksEnabled: process.env.FAIRNESS_CHECKS_ENABLED !== "false",
  providerVerificationAdvancedEnabled:
    process.env.PROVIDER_VERIFICATION_ADVANCED_ENABLED !== "false",
  ndisPricingImportEnabled:
    process.env.NDIS_PRICING_IMPORT_ENABLED !== "false",
  ndisClaimSubmissionEnabled:
    process.env.NDIS_CLAIM_SUBMISSION_ENABLED === "true",
  xeroEnabled: process.env.XERO_ENABLED === "true",
  stripeEnabled: process.env.STRIPE_ENABLED === "true",
  mobileContractsEnabled: process.env.MOBILE_CONTRACTS_ENABLED !== "false",
  routeOptimisationEnabled: process.env.ROUTE_OPTIMISATION_ENABLED === "true",
  routeProvider: process.env.ROUTE_PROVIDER ?? "disabled",
  developerApiEnabled: process.env.DEVELOPER_API_ENABLED === "true",
  apiRateLimitingEnabled: process.env.API_RATE_LIMITING_ENABLED !== "false",
  reportingEnabled: process.env.REPORTING_ENABLED !== "false",
  smallCellSuppressionThreshold: Number(
    process.env.SMALL_CELL_SUPPRESSION_THRESHOLD ?? "5"
  ),
  complianceEvidenceEnabled:
    process.env.COMPLIANCE_EVIDENCE_ENABLED !== "false",
  securityReadinessEnabled:
    process.env.SECURITY_READINESS_ENABLED !== "false",
  ndiaReadinessEnabled: process.env.NDIA_READINESS_ENABLED !== "false",
  ndiaRealSubmissionEnabled:
    process.env.NDIA_REAL_SUBMISSION_ENABLED === "true",
};

export function integrationDisabledMessage(name: string) {
  return {
    configured: false,
    message: `${name} is not configured. Enable via environment variables.`,
  };
}
