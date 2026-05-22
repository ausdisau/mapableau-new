export const phase10Config = {
  apiCertificationProgramEnabled:
    process.env.API_CERTIFICATION_PROGRAM_ENABLED === "true",
  privacyPreservingAnalyticsEnabled:
    process.env.PRIVACY_PRESERVING_ANALYTICS_ENABLED !== "false",
  federatedResearchEnabled: process.env.FEDERATED_RESEARCH_ENABLED === "true",
  publicAlgorithmRegisterEnabled:
    process.env.PUBLIC_ALGORITHM_REGISTER_ENABLED !== "false",
  oversightBoardPortalEnabled:
    process.env.OVERSIGHT_BOARD_PORTAL_ENABLED !== "false",
  sustainabilityPlanEnabled:
    process.env.SUSTAINABILITY_PLAN_ENABLED !== "false",
};
