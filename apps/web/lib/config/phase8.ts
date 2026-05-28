export const phase8Config = {
  appStoreReleaseProcessEnabled:
    process.env.APP_STORE_RELEASE_PROCESS_ENABLED !== "false",
  nationalInsightsEnabled: process.env.NATIONAL_INSIGHTS_ENABLED !== "false",
  partnerMarketplaceEnabled: process.env.PARTNER_MARKETPLACE_ENABLED === "true",
  publicApiVersioningEnabled:
    process.env.PUBLIC_API_VERSIONING_ENABLED !== "false",
  slaReportingEnabled: process.env.SLA_REPORTING_ENABLED !== "false",
  externalSecurityAuditReadinessEnabled:
    process.env.EXTERNAL_SECURITY_AUDIT_READINESS_ENABLED !== "false",
  dataTrustCouncilEnabled: process.env.DATA_TRUST_COUNCIL_ENABLED !== "false",
};
