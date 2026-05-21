export const phase9Config = {
  publicApiPartnerProgramEnabled:
    process.env.PUBLIC_API_PARTNER_PROGRAM_ENABLED === "true",
  personalDataVaultEnabled:
    process.env.PERSONAL_DATA_VAULT_ENABLED !== "false",
  researchSafeRoomEnabled: process.env.RESEARCH_SAFE_ROOM_ENABLED === "true",
  publicDecisionRegisterEnabled:
    process.env.PUBLIC_DECISION_REGISTER_ENABLED !== "false",
  internationalisationEnabled:
    process.env.INTERNATIONALISATION_ENABLED !== "false",
  longitudinalImpactEnabled:
    process.env.LONGITUDINAL_IMPACT_ENABLED !== "false",
};
