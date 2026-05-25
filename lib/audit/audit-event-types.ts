export const AUTH_AUDIT_EVENTS = [
  "user.created",
  "auth.login",
  "auth.logout",
  "onboarding.role_selected",
  "profile.role_assigned",
] as const;

export const CONSENT_AUDIT_EVENTS = ["consent.granted", "consent.revoked"] as const;

export const ACCESS_AUDIT_EVENTS = [
  "admin.accessed_sensitive_record",
  "access.denied",
] as const;

export type AuthAuditEvent = (typeof AUTH_AUDIT_EVENTS)[number];
export type ConsentAuditEvent = (typeof CONSENT_AUDIT_EVENTS)[number];
