/** Content types allowed for explicit offline cache (never default for sensitive data). */

export const OFFLINE_SAFE_CONTENT_TYPES = [
  "app_shell",
  "public_provider_categories",
  "public_help",
  "easy_read_rights",
  "schedule_summary_explicit",
  "form_draft",
] as const;

export type OfflineSafeContentType =
  (typeof OFFLINE_SAFE_CONTENT_TYPES)[number];

/** Must never be cached without explicit user policy + future encryption. */
export const OFFLINE_DENIED_CONTENT_TYPES = [
  "ndis_plan",
  "invoice",
  "payment_details",
  "clinical_notes",
  "incident_record",
  "complaint_record",
  "private_message",
  "home_address_exact",
  "participant_document",
] as const;

export type OfflineDeniedContentType =
  (typeof OFFLINE_DENIED_CONTENT_TYPES)[number];

export const OFFLINE_DRAFT_TYPES = [
  "support_ticket",
  "service_log",
  "transport_issue",
  "message",
  "incident_shell",
  "telehealth_intake",
] as const;

export type OfflineDraftType = (typeof OFFLINE_DRAFT_TYPES)[number];

export function canCacheContentType(type: string): boolean {
  if (
    (OFFLINE_DENIED_CONTENT_TYPES as readonly string[]).includes(type)
  ) {
    return false;
  }
  return (OFFLINE_SAFE_CONTENT_TYPES as readonly string[]).includes(type);
}

export function isSensitiveApiPath(pathname: string): boolean {
  const denied = [
    "/api/invoices",
    "/api/incidents",
    "/api/messages",
    "/dashboard/documents",
    "/data-vault",
  ];
  return denied.some((p) => pathname.startsWith(p));
}
