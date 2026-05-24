import type { CareRequestStatus, CareRequestType, CareShiftStatus } from "@prisma/client";

export type CareRequestSummary = {
  id: string;
  title: string;
  requestType: CareRequestType;
  status: CareRequestStatus;
  preferredDate: string | null;
  bookingId: string | null;
  linkedTransportRequired: boolean;
};

export type CareBundleView = {
  careRequest: CareRequestSummary;
  bookingId: string | null;
  linkedTransport: {
    id: string;
    status: string;
    pickupAddress: string;
    dropoffAddress: string;
  } | null;
};

export const CARE_STATUS_LABELS: Record<CareRequestStatus, string> = {
  draft: "Draft — not sent yet",
  submitted: "Sent — waiting for review",
  awaiting_admin_review: "With MapAble for review",
  awaiting_provider_response: "Waiting for provider",
  matched: "Matched with a provider",
  confirmed: "Confirmed",
  in_progress: "Support in progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Under review",
};

export const CARE_SHIFT_STATUS_LABELS: Record<CareShiftStatus, string> = {
  scheduled: "Scheduled",
  worker_assigned: "Worker assigned",
  confirmed: "Confirmed",
  worker_en_route: "Worker on the way",
  checked_in: "Visit started",
  in_progress: "In progress",
  checked_out: "Visit finished",
  awaiting_participant_approval: "Please review this visit",
  approved: "Approved",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Under review",
};
