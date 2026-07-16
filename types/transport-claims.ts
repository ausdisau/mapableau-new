export const TRANSPORT_CLAIM_STATES = [
  "planned",
  "sandbox",
  "pilot",
  "partner_required",
  "production_ready",
  "temporarily_unavailable",
] as const;

export type TransportClaimState = (typeof TRANSPORT_CLAIM_STATES)[number];

export const TRANSPORT_CAPABILITY_IDS = [
  "public_safety_model",
  "provider_finder",
  "participant_request_pilot",
  "participant_trip_history",
  "access_profile",
  "quote_flow",
  "driver_vehicle_eligibility",
  "trip_status_updates",
  "service_records_evidence",
  "participant_completion_review",
  "incidents_complaints",
  "advisory_routing",
  "operator_dispatch",
  "driver_field_app",
  "realtime_updates",
  "versioned_pricing",
  "care_transport_bundle",
  "public_transit_planner",
] as const;

export type TransportCapabilityId = (typeof TRANSPORT_CAPABILITY_IDS)[number];

export type TransportCapabilityClaim = {
  id: TransportCapabilityId;
  title: string;
  summary: string;
  state: TransportClaimState;
  /** Public bucket for marketing page grouping */
  publicBucket: "available_now" | "pilot_sandbox" | "coming_next" | "partner_required";
  requiresPartner?: boolean;
  advisoryOnly?: boolean;
  notes?: string;
};

export type TransportFeaturesResponse = {
  generatedAt: string;
  capabilities: TransportCapabilityClaim[];
  availableNow: string[];
  pilotOrSandbox: string[];
  comingNext: string[];
  partnerRequired: string[];
};
