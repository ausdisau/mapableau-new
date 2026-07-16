/**
 * Wave 5 quality gates for Access Intelligence expansion pilots.
 * Deterministic checklist — paid plans must never alter scores/confidence.
 */

export type QualityGateId =
  | "canonical_place_binding"
  | "flags_default_off_for_live"
  | "reliability_unknown_not_absent"
  | "regression_release_pack"
  | "journey_approval_gated"
  | "guide_fact_bound"
  | "mapper_no_confidence_from_points"
  | "widget_list_alternative"
  | "regional_small_cell"
  | "no_paid_plan_score_bias"
  | "playwright_smoke";

export type QualityGateResult = {
  id: QualityGateId;
  passed: boolean;
  detail: string;
};

export function evaluateExpansionQualityGates(input: {
  canonicalPlaceBinding: boolean;
  liveAdaptersDefaultOff: boolean;
  expiredEvidenceTreatedAsUnknown: boolean;
  regressionPackPresent: boolean;
  recoveryRequiresApproval: boolean;
  guideFactsBound: boolean;
  contributionPointsAffectConfidence: boolean;
  widgetHasListAlternative: boolean;
  smallCellSuppression: boolean;
  paidPlanChangesConfidence: boolean;
  playwrightSmokeGreen: boolean;
}): { passed: boolean; gates: QualityGateResult[] } {
  const gates: QualityGateResult[] = [
    {
      id: "canonical_place_binding",
      passed: input.canonicalPlaceBinding,
      detail: "AI surfaces bind to AccessPlace identity",
    },
    {
      id: "flags_default_off_for_live",
      passed: input.liveAdaptersDefaultOff,
      detail: "Live BMS/messaging adapters default off",
    },
    {
      id: "reliability_unknown_not_absent",
      passed: input.expiredEvidenceTreatedAsUnknown,
      detail: "Expired evidence becomes unknown, not absent",
    },
    {
      id: "regression_release_pack",
      passed: input.regressionPackPresent,
      detail: "Release evidence pack available",
    },
    {
      id: "journey_approval_gated",
      passed: input.recoveryRequiresApproval,
      detail: "Guardian recovery requires approval before rebook/disclose",
    },
    {
      id: "guide_fact_bound",
      passed: input.guideFactsBound,
      detail: "Guide facts require evidence bindings",
    },
    {
      id: "mapper_no_confidence_from_points",
      passed: !input.contributionPointsAffectConfidence,
      detail: "Mapper points/badges never enter confidence",
    },
    {
      id: "widget_list_alternative",
      passed: input.widgetHasListAlternative,
      detail: "Widget always ships accessible list alternative",
    },
    {
      id: "regional_small_cell",
      passed: input.smallCellSuppression,
      detail: "Regional tower applies small-cell suppression",
    },
    {
      id: "no_paid_plan_score_bias",
      passed: !input.paidPlanChangesConfidence,
      detail: "Paid plans never alter confidence or access scores",
    },
    {
      id: "playwright_smoke",
      passed: input.playwrightSmokeGreen,
      detail: "Playwright smoke baseline green for hub surfaces",
    },
  ];

  return { passed: gates.every((g) => g.passed), gates };
}
