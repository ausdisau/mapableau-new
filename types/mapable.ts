export type UserRole =
  | "participant"
  | "family_member"
  | "support_coordinator"
  | "support_worker"
  | "provider_admin"
  | "transport_operator"
  | "driver"
  | "employer"
  | "plan_manager"
  | "mapable_admin";

export type CommunicationPreference =
  | "plain_language"
  | "sms"
  | "email"
  | "phone"
  | "aac"
  | "auslan"
  | "support_person"
  | "written_only";

export type MobilityAid =
  | "manual_wheelchair"
  | "power_wheelchair"
  | "mobility_scooter"
  | "walker"
  | "cane"
  | "prosthetic"
  | "assistance_animal"
  | "none"
  | "other";

export type OrganisationType =
  | "care_provider"
  | "transport_provider"
  | "plan_manager"
  | "support_coordination"
  | "employer"
  | "community_partner"
  | "mapable_internal";

export type VerificationStatus =
  | "not_started"
  | "pending_review"
  | "verified"
  | "rejected"
  | "suspended";

export type ConsentScope =
  | "profile.read"
  | "accessibility.read"
  | "booking.read"
  | "booking.manage"
  | "messages.send"
  | "billing.read"
  | "support_coordination.access"
  | "plan_manager.invoice_access"
  | "transport.accessibility_share"
  | "care.accessibility_share";

export type ConsentStatus = "active" | "expired" | "revoked" | "pending";

export type NotificationChannel =
  | "in_app"
  | "email"
  | "sms"
  | "push"
  | "voice"
  | "whatsapp";

export type NotificationCategory =
  | "booking"
  | "profile"
  | "consent"
  | "provider"
  | "billing"
  | "support"
  | "safeguarding"
  | "system";

export type BookingType = "care" | "transport" | "care_transport";

export type BookingStatus =
  | "draft"
  | "requested"
  | "awaiting_provider_acceptance"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type AuditAction =
  | "user.created"
  | "profile.viewed"
  | "profile.updated"
  | "accessibility.updated"
  | "consent.granted"
  | "consent.revoked"
  | "organisation.created"
  | "organisation.verification_changed"
  | "booking.created"
  | "booking.updated"
  | "admin.accessed_sensitive_record"
  | "phone_verification_started"
  | "phone_verification_succeeded"
  | "phone_verification_failed"
  | "communication.preferences_updated"
  | "communication.opted_out_sms"
  | "communication.opted_in_sms"
  | "communication.inbound_received"
  | "communication.inbound_cancel"
  | "communication.inbound_yes"
  | "communication.inbound_voice"
  | "notification.sent"
  | "notification.skipped_no_consent"
  | "notification.operational_override"
  | "notification.delivery_updated"
  | "dispute.created"
  | "dispute.status_updated"
  | "dispute.provider_responded"
  | "complaint.created"
  | "complaint.status_updated"
  | "complaint.escalated_to_incident"
  | "complaint.responded"
  | "complaint.internal_note";

export type PreferredContactMethod = "email" | "phone" | "sms";

export interface TransportRequirements {
  requiresWheelchairAccessibleVehicle?: boolean;
  canTransferFromWheelchair?: boolean;
  requiresRamp?: boolean;
  requiresHoist?: boolean;
  assistanceAnimalPresent?: boolean;
  needsDriverAssistanceToDoor?: boolean;
  needsExtraBoardingTime?: boolean;
  pickupNotes?: string;
  dropoffNotes?: string;
}

export interface DigitalPreferences {
  largeText?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  screenReaderUser?: boolean;
  voiceControlPreferred?: boolean;
  dyslexiaFriendlyMode?: boolean;
  simpleLanguageMode?: boolean;
}
