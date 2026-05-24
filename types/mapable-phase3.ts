export type CareRequestType =
  | "personal_care"
  | "domestic_assistance"
  | "community_access"
  | "appointment_support"
  | "employment_support"
  | "meal_preparation"
  | "therapy_assistance"
  | "skill_building"
  | "overnight_support"
  | "other";

export type CareRequestStatus =
  | "draft"
  | "submitted"
  | "awaiting_admin_review"
  | "awaiting_provider_response"
  | "matched"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type CareShiftStatus =
  | "scheduled"
  | "worker_assigned"
  | "confirmed"
  | "worker_en_route"
  | "checked_in"
  | "in_progress"
  | "checked_out"
  | "awaiting_participant_approval"
  | "approved"
  | "completed"
  | "cancelled"
  | "disputed";

export type TransportBookingStatus =
  | "draft"
  | "quote_requested"
  | "quoted"
  | "participant_confirmed"
  | "provider_accepted"
  | "driver_assigned"
  | "vehicle_dispatched"
  | "arrived_at_pickup"
  | "passenger_onboard"
  | "arrived_at_destination"
  | "completed"
  | "invoiced"
  | "paid"
  | "cancelled"
  | "late_risk"
  | "no_show"
  | "access_issue"
  | "incident_reported"
  | "disputed";

export type CalendarEventType =
  | "care_request"
  | "care_shift"
  | "transport_booking"
  | "job_application"
  | "job_interview"
  | "support_ticket_followup"
  | "admin_task";
