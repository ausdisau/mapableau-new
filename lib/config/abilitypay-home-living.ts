function enabled(name: string) {
  return process.env[name] === "true";
}

export const abilityPayConfig = {
  enabled: enabled("MAPABLE_ABILITYPAY_ENABLED"),
  reconciliationEnabled: enabled("MAPABLE_INVOICE_RECONCILIATION_ENABLED"),
  accountingExportEnabled: enabled("MAPABLE_ACCOUNTING_EXPORT_ENABLED"),
  paymentExecutionEnabled: false,
  ndisClaimSubmissionEnabled: false,
} as const;

export const homeLivingConfig = {
  enabled: enabled("MAPABLE_HOME_LIVING_ENABLED"),
  sdaMarketplaceEnabled: enabled("MAPABLE_SDA_MARKETPLACE_ENABLED"),
  silCoordinationEnabled: enabled("MAPABLE_SIL_COORDINATION_ENABLED"),
  highIntensityGovernanceEnabled: enabled(
    "MAPABLE_HIGH_INTENSITY_GOVERNANCE_ENABLED",
  ),
  /** Public MapAble Home discovery (/home) — fail-closed. */
  discoveryEnabled: enabled("MAPABLE_HOME_DISCOVERY_ENABLED"),
  compareEnabled: enabled("MAPABLE_HOME_COMPARE_ENABLED"),
  enquiriesEnabled: enabled("MAPABLE_HOME_ENQUIRIES_ENABLED"),
  providerListingsEnabled: enabled("MAPABLE_HOME_PROVIDER_LISTINGS_ENABLED"),
  capabilityProfileEnabled: enabled(
    "MAPABLE_HOME_CAPABILITY_PROFILE_ENABLED",
  ),
  clinicalAiDecisionsEnabled: false,
  automaticSafeguardingDecisionsEnabled: false,
  restrictivePracticeAiEnabled: false,
} as const;
