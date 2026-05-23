const TRANSITIONS: Record<string, string[]> = {
  scheduled: ["worker_assigned", "cancelled"],
  worker_assigned: ["confirmed", "cancelled"],
  confirmed: ["worker_en_route", "cancelled"],
  worker_en_route: ["checked_in", "cancelled"],
  checked_in: ["in_progress", "cancelled"],
  in_progress: ["checked_out", "cancelled"],
  checked_out: ["awaiting_participant_approval", "cancelled"],
  awaiting_participant_approval: ["approved", "disputed"],
  approved: ["completed"],
  completed: [],
  cancelled: [],
  disputed: [],
};

export function assertCareShiftTransition(from: string, to: string) {
  const allowed = TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new Error(`INVALID_CARE_SHIFT_TRANSITION:${from}->${to}`);
  }
}
