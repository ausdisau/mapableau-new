export const assuranceConfig = {
  evaluationEnabled: process.env.ASSURANCE_EVALUATION_ENABLED !== "false",
  /** Prefer RegulatoryDateConfig table; env values are config keys, not NDIA endpoints. */
  regulatoryDateKeys: {
    july2026:
      process.env.REGULATORY_DATE_2026_07_01 ?? "ndis_wave6_milestone_2026_07_01",
    october2026:
      process.env.REGULATORY_DATE_2026_10_01 ?? "ndis_wave6_milestone_2026_10_01",
    january2027:
      process.env.REGULATORY_DATE_2027_01_01 ?? "ndis_wave6_milestone_2027_01_01",
  },
} as const;
