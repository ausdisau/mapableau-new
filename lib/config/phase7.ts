export const phase7Config = {
  multiTenantPartnerAdminEnabled:
    process.env.MULTI_TENANT_PARTNER_ADMIN_ENABLED !== "false",
  publicBetaEnabled: process.env.PUBLIC_BETA_ENABLED === "true",
  enterpriseProviderConsoleEnabled:
    process.env.ENTERPRISE_PROVIDER_CONSOLE_ENABLED !== "false",
  governmentPartnerPortalEnabled:
    process.env.GOVERNMENT_PARTNER_PORTAL_ENABLED === "true",
  socialImpactMeasurementEnabled:
    process.env.SOCIAL_IMPACT_MEASUREMENT_ENABLED !== "false",
  ndiaPilotEnabled: process.env.NDIA_PILOT_ENABLED === "true",
  paymentReconciliationEnabled: true,
  operatorDispatchEnabled: true,
  publicTransparencyEnabled: true,
};
