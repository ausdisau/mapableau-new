/**
 * Jobs adapter — interface stub for follow-on Phase 4.
 * Occupational fit must remain separate from access compatibility.
 * Never auto-reject on access mismatch. Never score employability from disability.
 */
export type JobsAccessCompatibilityView = {
  roleFitSeparate: true;
  accessState: "compatible" | "compatible_with_adjustment" | "uncertain" | "incompatible";
  workplaceFindings: Array<{ conceptId: string; result: string; explanation: string }>;
  disclosureRequired: boolean;
};

export type JobsAccessAdapter = {
  readonly vertical: "jobs";
  evaluateWorkplaceAccess(input: {
    passportId: string;
    workplaceId: string;
  }): Promise<JobsAccessCompatibilityView>;
};

export const JOBS_ADAPTER_STATUS = {
  implemented: false,
  phase: 4,
  note: "Stub only — use existing jobs disclosure preview until Phase 4.",
} as const;
