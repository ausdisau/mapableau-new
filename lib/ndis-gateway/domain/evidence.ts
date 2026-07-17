/** Reference to delivery evidence backing a claim line (Wave 4 expands validation). */
export type EvidenceRef = {
  kind:
    | "booking"
    | "care_shift"
    | "timesheet"
    | "service_delivery_event"
    | "participant_confirmation"
    | "documented_exception"
    | "other";
  sourceId: string;
  recordedAt?: string | null;
  notes?: string | null;
};
