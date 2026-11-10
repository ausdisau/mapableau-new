/**
 * Display-only adapters over care/transport recovery builders.
 * Never calls initiate, confirm, or proposeRecoveryOptions write paths.
 */
import { buildWorkerCancellationRecoveryOptions } from "@/lib/care/worker-cancellation-recovery";

import { recoveryProposalsFor, type DayActivity } from "./day-planner";

export type DayDisplayRecoveryOption = {
  id: string;
  label: string;
  detail: string;
  source: "care-builder" | "day-planner";
  requiresParticipantConfirmation: true;
  autoAssignsWorkerOrTransport: false;
  changesExternalRecords: false;
};

/**
 * Merge pure Day planner proposals with care cancellation builder output
 * for UI display. Does not mutate bookings or invoke write APIs.
 */
export function buildDisplayRecoveryOptions(input: {
  activity: DayActivity;
  careShiftId?: string;
}): DayDisplayRecoveryOption[] {
  const fromPlanner = recoveryProposalsFor(input.activity).map((option) => ({
    ...option,
    source: "day-planner" as const,
  }));

  if (input.activity.kind !== "care") {
    return fromPlanner;
  }

  const plan = buildWorkerCancellationRecoveryOptions({
    careShiftId: input.careShiftId ?? "synthetic-display-only",
    cancelledWorkerId: null,
  });

  const fromCare = plan.options.map((option) => ({
    id: option.optionKey,
    label: option.label,
    detail: option.description,
    source: "care-builder" as const,
    requiresParticipantConfirmation: true as const,
    autoAssignsWorkerOrTransport: false as const,
    changesExternalRecords: false as const,
  }));

  return [...fromPlanner, ...fromCare];
}
