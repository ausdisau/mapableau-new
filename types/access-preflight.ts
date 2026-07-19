export const ACCESS_PREFLIGHT_CHECKS = [
  "step_free_entrance",
  "door_width",
  "lift_availability",
  "accessible_toilet",
  "changing_places",
  "accessible_parking_dropoff",
  "surface_gradient_kerb",
  "quiet_low_sensory",
  "lighting_noise",
  "assistance_animal",
  "equipment_charging",
  "support_person",
  "accessible_communication",
  "emergency_evacuation",
  "alternative_route",
] as const;

export type AccessPreflightCheckId = (typeof ACCESS_PREFLIGHT_CHECKS)[number];

export type AccessFactState =
  | "confirmed"
  | "unavailable"
  | "unknown"
  | "not_applicable";

export interface AccessFactVerification {
  source?: string;
  verificationStatus?: string;
  lastCheckedAt?: string;
  notes?: string;
  confidence?: "low" | "medium" | "high" | "unknown";
}

export interface AccessPreflightFact extends AccessFactVerification {
  id: AccessPreflightCheckId;
  label: string;
  state: AccessFactState;
  critical?: boolean;
}

export interface AccessPreflightResult {
  placeName: string;
  placeId?: string;
  facts: AccessPreflightFact[];
  unresolvedCritical: AccessPreflightFact[];
  nextActions: string[];
}

export const ACCESS_PREFLIGHT_LABELS: Record<AccessPreflightCheckId, string> = {
  step_free_entrance: "Step-free entrance",
  door_width: "Door width",
  lift_availability: "Lift availability and dimensions",
  accessible_toilet: "Accessible toilet",
  changing_places: "Changing Places facility",
  accessible_parking_dropoff: "Accessible parking and drop-off",
  surface_gradient_kerb: "Surface, gradient and kerb-ramp information",
  quiet_low_sensory: "Quiet or low-sensory space",
  lighting_noise: "Lighting and noise conditions",
  assistance_animal: "Assistance-animal access",
  equipment_charging: "Equipment charging",
  support_person: "Support-person access",
  accessible_communication: "Accessible communication",
  emergency_evacuation: "Emergency evacuation arrangements",
  alternative_route: "Alternative route or backup arrangement",
};
