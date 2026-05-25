import type { BookingStatus, CareRequestStatus } from "@prisma/client";

export type CareRequestSummary = {
  id: string;
  bookingId: string | null;
  title: string;
  status: CareRequestStatus;
  bookingStatus?: BookingStatus;
  linkedTransportRequired: boolean;
};

export const CARE_STATUS_LABELS: Record<CareRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  awaiting_admin_review: "Awaiting review",
  awaiting_provider_response: "Awaiting provider response",
  matched: "Matched",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};
