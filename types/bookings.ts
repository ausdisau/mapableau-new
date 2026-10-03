import type {
  BookingAssigneeRole,
  BookingServiceLogStatus,
  BookingStatus,
  BookingType,
} from "@prisma/client";

export type BookingModule =
  | "care"
  | "transport"
  | "telehealth"
  | "marketplace"
  | "foods"
  | "employment"
  | "support_coordination";

export const BOOKING_MODULES: BookingModule[] = [
  "care",
  "transport",
  "telehealth",
  "marketplace",
  "foods",
  "employment",
  "support_coordination",
];

export const BOOKING_STATUSES: BookingStatus[] = [
  "draft",
  "requested",
  "provider_review",
  "more_information_requested",
  "accepted",
  "assigned",
  "participant_confirmed",
  "in_progress",
  "completed",
  "service_log_pending",
  "service_log_submitted",
  "participant_review",
  "closed",
  "cancelled",
  "declined",
  "disputed",
  "awaiting_provider_acceptance",
  "confirmed",
];

export type BookingErrorCode =
  | "BOOKING_NOT_FOUND"
  | "BOOKING_ACCESS_DENIED"
  | "BOOKING_INVALID_STATUS_TRANSITION"
  | "BOOKING_PROVIDER_NOT_ELIGIBLE"
  | "BOOKING_ASSIGNEE_NOT_ELIGIBLE"
  | "BOOKING_CONSENT_REQUIRED"
  | "BOOKING_VALIDATION_FAILED";

export type BookingAction =
  | "view"
  | "update"
  | "cancel"
  | "confirm"
  | "dispute"
  | "accept"
  | "decline"
  | "request_more_info"
  | "assign"
  | "start"
  | "complete"
  | "create_service_log"
  | "create_invoice"
  | "view_events";

export interface BookingPermissions {
  canView: boolean;
  canUpdate: boolean;
  allowedActions: BookingAction[];
}

export interface BookingApiErrorBody {
  error: string;
  code: BookingErrorCode;
  details?: unknown;
}

export interface BookingListFilters {
  status?: BookingStatus;
  module?: BookingModule | BookingType;
  organisationId?: string;
  participantId?: string;
}

export type { BookingAssigneeRole, BookingServiceLogStatus, BookingStatus, BookingType };
