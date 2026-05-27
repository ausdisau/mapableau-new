export type ShiftCreatorStreamStage =
  | "received_query"
  | "resolved_booking"
  | "parsed_shift_details"
  | "matched_worker"
  | "checked_eligibility"
  | "draft_ready"
  | "finalized";

export type ShiftCreatorStreamEvent = {
  stage: ShiftCreatorStreamStage;
  message: string;
  payload?: Record<string, unknown>;
};

export type ShiftEligibilityPreview = {
  ok: boolean;
  code?: string;
  message?: string;
};

export type ShiftCreatorDraft = {
  careBookingId: string;
  careRequestId: string;
  organisationId: string;
  bookingTitle: string;
  workerProfileId?: string;
  workerDisplayName?: string;
  startAt: string;
  endAt: string;
  location?: string;
  eligibility: ShiftEligibilityPreview;
};

export type ShiftCreatorStreamResult = {
  draft: ShiftCreatorDraft;
  warnings: string[];
  suggestedActions: string[];
  ambiguousBookings?: { id: string; title: string }[];
  availableWorkers?: { id: string; displayName: string }[];
};

export type ParsedShiftQuery = {
  workerProfileId?: string;
  workerNameHint?: string;
  startAt?: Date;
  endAt?: Date;
  location?: string;
  bookingTitleHint?: string;
  warnings: string[];
};

export type ResolvedBooking = {
  id: string;
  careRequestId: string;
  organisationId: string;
  title: string;
  status: string;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  location: string | null;
  tasks: unknown;
  score: number;
};

export type OrgWorkerOption = {
  id: string;
  displayName: string;
};
