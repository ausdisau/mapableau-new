/**
 * Care adapter — interface stub for follow-on Phase 3.
 * Do not implement a second Care accessibility profile.
 */
export type CareAccessMatchCandidate = {
  workerId: string;
  state: "compatible" | "compatible_with_adjustment" | "uncertain" | "incompatible";
  summary: string;
  missingCompetencies: string[];
  preferenceGaps: string[];
};

export type CareAccessAdapter = {
  readonly vertical: "care";
  /** Returns explainable candidates — never auto-assigns. */
  suggestCompatibleWorkers(input: {
    passportId: string;
    careRequestId: string;
  }): Promise<CareAccessMatchCandidate[]>;
};

export const CARE_ADAPTER_STATUS = {
  implemented: false,
  phase: 3,
  note: "Stub only — Care matching continues via existing matching-service until Phase 3.",
} as const;
