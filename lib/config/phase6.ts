export const phase6Config = {
  mobileProductionReadinessEnabled:
    process.env.MOBILE_PRODUCTION_READINESS_ENABLED !== "false",
  dispatchConsoleEnabled: process.env.DISPATCH_CONSOLE_ENABLED !== "false",
  providerQualityDashboardEnabled:
    process.env.PROVIDER_QUALITY_DASHBOARD_ENABLED !== "false",
  aiGovernanceEnabled: process.env.AI_GOVERNANCE_ENABLED !== "false",
  partnerSandboxEnabled: process.env.PARTNER_SANDBOX_ENABLED !== "false",
  openDataExportEnabled: process.env.OPEN_DATA_EXPORT_ENABLED === "true",
  governmentReportingEnabled:
    process.env.GOVERNMENT_REPORTING_ENABLED === "true",
  disasterRecoveryExercisesEnabled:
    process.env.DISASTER_RECOVERY_EXERCISES_ENABLED !== "false",
  communityGovernanceEnabled:
    process.env.COMMUNITY_GOVERNANCE_ENABLED !== "false",
};
