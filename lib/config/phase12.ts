export const phase12Config = {
  nationalAccountabilityPortalEnabled:
    process.env.NATIONAL_ACCOUNTABILITY_PORTAL_ENABLED !== "false",
  constitutionalSafeguardsEnabled:
    process.env.CONSTITUTIONAL_SAFEGUARDS_ENABLED !== "false",
  communityGovernanceMembershipEnabled:
    process.env.COMMUNITY_GOVERNANCE_MEMBERSHIP_ENABLED !== "false",
  transportInvestmentModellingEnabled:
    process.env.TRANSPORT_INVESTMENT_MODELLING_ENABLED !== "false",
  certifiedApiEcosystemAtScaleEnabled:
    process.env.CERTIFIED_API_ECOSYSTEM_AT_SCALE_ENABLED === "true",
  researchFederationAtScaleEnabled:
    process.env.RESEARCH_FEDERATION_AT_SCALE_ENABLED === "true",
  institutionalContinuityEnabled:
    process.env.INSTITUTIONAL_CONTINUITY_ENABLED !== "false",
  civicAuditIndexEnabled: process.env.CIVIC_AUDIT_INDEX_ENABLED !== "false",
  federatedAccountabilityEnabled:
    process.env.FEDERATED_ACCOUNTABILITY_ENABLED !== "false",
};
