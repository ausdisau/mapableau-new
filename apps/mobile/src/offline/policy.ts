
export type OfflineDataClass =
  | "today_schedule_minimal"
  | "confirmed_shift_summary"
  | "confirmed_trip_summary"
  | "communication_passport_selected"
  | "emergency_communication_card"
  | "mission_summary_cached"
  | "human_help_contacts"
  | "downloaded_accessible_instructions"
  | "full_clinical_history"
  | "full_ndis_plan"
  | "unrestricted_incident_history"
  | "full_payment_details"
  | "unrelated_participant_records"
  | "provider_exports"
  | "admin_data";

const ALLOWED: ReadonlySet<OfflineDataClass> = new Set([
  "today_schedule_minimal",
  "confirmed_shift_summary",
  "confirmed_trip_summary",
  "communication_passport_selected",
  "emergency_communication_card",
  "mission_summary_cached",
  "human_help_contacts",
  "downloaded_accessible_instructions",
]);

export function mayCacheOffline(dataClass: OfflineDataClass): boolean {
  return ALLOWED.has(dataClass);
}

export type QueuedMutation = {
  id: string;
  idempotencyKey: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: "queued" | "syncing" | "conflict" | "failed" | "completed";
};

/** Offline queue is never authority — server must revalidate before execution. */
export function offlineDoesNotGrantAuthority(): true {
  return true;
}
