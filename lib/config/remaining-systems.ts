export const remainingSystemsConfig = {
  privacyGovernanceEnabled:
    process.env.PRIVACY_GOVERNANCE_ENABLED !== "false",
  cyberReadinessPackEnabled:
    process.env.CYBER_READINESS_PACK_ENABLED !== "false",
  ndisIntegrationLayerEnabled:
    process.env.NDIS_INTEGRATION_LAYER_ENABLED !== "false",
  ndisAdapterType:
    (process.env.NDIS_ADAPTER_TYPE as "mock" | "aggregator" | "direct_ndia") ??
    "mock",
  passkeysEnabled: process.env.PASSKEYS_ENABLED === "true",
  enterpriseSsoEnabled: process.env.ENTERPRISE_SSO_ENABLED === "true",
  offlineModeEnabled: process.env.OFFLINE_MODE_ENABLED !== "false",
  mobilePushEnabled: process.env.MOBILE_PUSH_ENABLED === "true",
  emergencyModuleEnabled: process.env.EMERGENCY_MODULE_ENABLED !== "false",
  independenceModuleEnabled:
    process.env.INDEPENDENCE_MODULE_ENABLED !== "false",
  cloudModuleEnabled: process.env.CLOUD_MODULE_ENABLED !== "false",
  housingModuleEnabled: process.env.HOUSING_MODULE_ENABLED !== "false",
  providerToolkitEnabled: process.env.PROVIDER_TOOLKIT_ENABLED !== "false",
};
