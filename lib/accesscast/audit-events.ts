/**
 * AccessCast audit / domain event names (safe summaries only).
 * Emitters are not wired in synthetic mode.
 */
export const ACCESSCAST_EVENTS = [
  "accesscast.generated",
  "accesscast.changed",
  "accesscast.expired",
  "accesscast.hard_requirement_blocked",
  "accesscast.fallback_identified",
  "accesscast.fallback_invalidated",
  "accesscast.confirmation_requested",
  "accesscast.confirmation_received",
  "accesscast.evidence_stale",
  "accesscast.advisory_created",
  "accesscast.advisory_expired",
  "accesscast.notification_queued",
] as const;

export type AccessCastEventName = (typeof ACCESSCAST_EVENTS)[number];
