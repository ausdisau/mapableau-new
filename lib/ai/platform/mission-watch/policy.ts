/**
 * Mission Watch authority — notice/reassess/explain/recommend only.
 */

export const FORBIDDEN_WATCH_OPERATIONS = [
  "assign_worker",
  "book_transport",
  "approve_payment",
  "disclose_disability",
  "change_consent",
  "contact_employer",
  "clinical_decision",
  "clinical_monitoring",
  "safeguarding_substantiation",
  "irreversible_operation",
  "execute_action",
  "send_email",
  "send_sms",
] as const;

export type ForbiddenWatchOperation = (typeof FORBIDDEN_WATCH_OPERATIONS)[number];

export function assertWatchAuthority(operation: string): {
  allowed: boolean;
  reason: string;
} {
  if (FORBIDDEN_WATCH_OPERATIONS.includes(operation as ForbiddenWatchOperation)) {
    return {
      allowed: false,
      reason: `${operation} is forbidden in Mission Watch. Operational actions require Prompt 02 Action Kernel approval.`,
    };
  }
  return { allowed: true, reason: "Watch notice / recommend permitted." };
}

export function watchMayCreateOperationalAction(): false {
  return false;
}

export function isClinicalMonitoringForbidden(watchType: string): boolean {
  return (
    watchType === "clinical_monitoring" ||
    watchType.includes("clinical") ||
    watchType.includes("vital") ||
    watchType.includes("medication")
  );
}
