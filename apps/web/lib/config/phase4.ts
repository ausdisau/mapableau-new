export const phase4Config = {
  transportLiveLocationEnabled:
    process.env.TRANSPORT_LIVE_LOCATION_ENABLED === "true",
  transportManualTrackingEnabled:
    process.env.TRANSPORT_MANUAL_TRACKING_ENABLED !== "false",
  matchingEngineEnabled: process.env.MATCHING_ENGINE_ENABLED !== "false",
  matchingAllowAdminOverride:
    process.env.MATCHING_ALLOW_ADMIN_OVERRIDE !== "false",
  ndisSupportItemImportEnabled:
    process.env.NDIS_SUPPORT_ITEM_IMPORT_ENABLED !== "false",
  ndisAutoClaimingEnabled: process.env.NDIS_AUTO_CLAIMING_ENABLED === "true",
  smartContractRunnerEnabled:
    process.env.SMART_CONTRACT_RUNNER_ENABLED !== "false",
  contractsRequireAdminForChanges:
    process.env.CONTRACTS_REQUIRE_ADMIN_FOR_CHANGES !== "false",
  incidentReportingEnabled: process.env.INCIDENT_REPORTING_ENABLED !== "false",
  incidentExternalReportingEnabled:
    process.env.INCIDENT_EXTERNAL_REPORTING_ENABLED === "true",
  adminAnalyticsEnabled: process.env.ADMIN_ANALYTICS_ENABLED !== "false",
  serviceAgreementRequiredForRepeat:
    process.env.SERVICE_AGREEMENT_REQUIRED_FOR_REPEAT === "true",
};
