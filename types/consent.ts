export type PlatformConsentScope =
  | "view_profile"
  | "view_bookings"
  | "view_documents"
  | "view_invoices"
  | "view_messages"
  | "view_service_logs"
  | "view_outcomes"
  | "approve_invoices"
  | "manage_bookings"
  | "emergency_access";

export type ConsentGrantStatus = "active" | "expired" | "revoked" | "pending";

export interface ConsentGrant {
  id: string;
  subjectProfileId: string;
  grantedToProfileId?: string | null;
  grantedToOrganisationId?: string | null;
  scope: PlatformConsentScope;
  purpose: string;
  status: ConsentGrantStatus;
  expiryDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ConsentEventType =
  | "granted"
  | "revoked"
  | "expired"
  | "scope_changed"
  | "emergency_used";

export interface ConsentEvent {
  id: string;
  consentGrantId: string;
  eventType: ConsentEventType;
  actorProfileId?: string | null;
  createdAt: Date;
}
