import type { PilotReportabilityState } from "@prisma/client";

/**
 * Human-review reportability states only — no auto notify to regulators.
 */
export const REPORTABILITY_TRANSITIONS: Record<
  PilotReportabilityState,
  readonly PilotReportabilityState[]
> = {
  not_assessed: ["under_review"],
  under_review: [
    "not_reportable",
    "potentially_reportable",
    "reportable",
  ],
  not_reportable: ["under_review", "closed"],
  potentially_reportable: ["under_review", "reportable", "not_reportable"],
  reportable: ["reported", "under_review"],
  reported: ["closed"],
  closed: [],
};

export function canTransitionReportability(
  from: PilotReportabilityState,
  to: PilotReportabilityState
): boolean {
  return REPORTABILITY_TRANSITIONS[from].includes(to);
}

export function assertReportabilityTransition(
  from: PilotReportabilityState,
  to: PilotReportabilityState
): void {
  if (!canTransitionReportability(from, to)) {
    throw new Error(`REPORTABILITY_TRANSITION_DENIED:${from}->${to}`);
  }
}
