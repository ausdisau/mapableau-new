import type {
  TransportCapabilityClaim,
  TransportCapabilityId,
  TransportClaimState,
  TransportFeaturesResponse,
} from "@/types/transport-claims";
import { transportRoutingConfig } from "@/lib/config/transport-routing";

/**
 * Server-authoritative production-claim registry.
 * Promotion to production_ready requires deployed migrations, enforcement,
 * runbooks, monitoring, and passing release tests — not UI existence alone.
 */

type ClaimDefinition = Omit<TransportCapabilityClaim, "publicBucket"> & {
  publicBucket?: TransportCapabilityClaim["publicBucket"];
};

function bucketFor(
  state: TransportClaimState,
  requiresPartner?: boolean
): TransportCapabilityClaim["publicBucket"] {
  if (state === "production_ready") return "available_now";
  if (state === "partner_required" || requiresPartner) return "partner_required";
  if (state === "sandbox" || state === "pilot") return "pilot_sandbox";
  return "coming_next";
}

function resolveRoutingState(): TransportClaimState {
  if (!transportRoutingConfig.routingEnabled) return "temporarily_unavailable";
  if (transportRoutingConfig.provider === "mock") return "sandbox";
  return "pilot";
}

const STATIC_CLAIMS: ClaimDefinition[] = [
  {
    id: "public_safety_model",
    title: "Public safety model",
    summary:
      "Public explanation of exact-address restrictions, eligibility-gated dispatch, and the emergency boundary (call 000).",
    state: "production_ready",
  },
  {
    id: "provider_finder",
    title: "Provider finder",
    summary: "Entry point to find transport-related providers.",
    state: "production_ready",
  },
  {
    id: "participant_request_pilot",
    title: "Signed-in transport requests",
    summary: "Pilot routes for participants to create transport trip requests.",
    state: "pilot",
  },
  {
    id: "participant_trip_history",
    title: "Trip history",
    summary: "Signed-in participant trip list and detail for TransportTrip records.",
    state: "pilot",
  },
  {
    id: "access_profile",
    title: "Transport Access Profile",
    summary: "Dedicated access profile without diagnosis fields.",
    state: "planned",
  },
  {
    id: "quote_flow",
    title: "Provider quotes",
    summary: "Multi-quote request flow with explicit participant acceptance.",
    state: "planned",
  },
  {
    id: "driver_vehicle_eligibility",
    title: "Driver and vehicle eligibility",
    summary:
      "Fail-closed assignment and dispatch gates for credentials, vehicle fit, insurance, maintenance, capacity, prestart, and conflicts.",
    state: "pilot",
    notes:
      "Server-side eligibility exists in pilot; not promoted until production gates and runbooks pass.",
  },
  {
    id: "trip_status_updates",
    title: "Trip status updates",
    summary: "Canonical trip state machine and participant-visible status timeline.",
    state: "pilot",
  },
  {
    id: "service_records_evidence",
    title: "Service records and evidence",
    summary:
      "Operational logs and checklists by default; participant media only with consent.",
    state: "pilot",
  },
  {
    id: "participant_completion_review",
    title: "Participant completion review",
    summary: "Confirm, correct, dispute, or report after trip completion.",
    state: "pilot",
  },
  {
    id: "incidents_complaints",
    title: "Incidents and complaints",
    summary: "Incident hold, billing hold, and accessible complaint pathways.",
    state: "planned",
  },
  {
    id: "operator_dispatch",
    title: "Operator dispatch",
    summary: "Provider dispatch workspace for quote, assign, and monitor.",
    state: "pilot",
  },
  {
    id: "driver_field_app",
    title: "Driver field workspace",
    summary: "Mobile-first driver workflow on TransportTrip with offline queue.",
    state: "planned",
  },
  {
    id: "realtime_updates",
    title: "Real-time trip updates",
    summary: "Authenticated transport WebSocket rooms with polling fallback.",
    state: "planned",
  },
  {
    id: "versioned_pricing",
    title: "Versioned pricing and funding context",
    summary:
      "Pricing rule versions and honest funding labels (never unconditional NDIS Covered).",
    state: "planned",
  },
  {
    id: "care_transport_bundle",
    title: "Care plus Transport",
    summary: "Plan transport for a care appointment with explicit confirmation.",
    state: "planned",
  },
  {
    id: "public_transit_planner",
    title: "Public transit planner",
    summary: "GTFS / realtime advisory itineraries (phase two).",
    state: "partner_required",
    requiresPartner: true,
  },
];

/** Recommended public “coming next” bullets — precise, not over-claimed. */
export const TRANSPORT_PUBLIC_COMING_NEXT = [
  "Driver and vehicle eligibility checks before assignment and dispatch.",
  "Trip status updates, service records, incident handling, and participant completion review.",
  "Pluggable routing support, with route, distance, duration, and ETA outputs clearly labelled as advisory until confirmed by an operator or transport partner.",
] as const;

export const TRANSPORT_PUBLIC_AVAILABLE_NOW = [
  "Public explanation of the transport safety model.",
  "Provider finder entry point for transport-related searches.",
  "Signed-in pilot routes for transport requests and trip history.",
] as const;

function withRoutingClaim(): ClaimDefinition[] {
  return [
    ...STATIC_CLAIMS,
    {
      id: "advisory_routing",
      title: "Advisory routing",
      summary:
        "Pluggable routing with distance, duration, and ETA clearly labelled advisory until operator or partner confirmation.",
      state: resolveRoutingState(),
      advisoryOnly: true,
    },
  ];
}

export function getTransportCapabilityClaims(): TransportCapabilityClaim[] {
  return withRoutingClaim().map((claim) => ({
    ...claim,
    publicBucket: claim.publicBucket ?? bucketFor(claim.state, claim.requiresPartner),
  }));
}

export function getTransportCapability(
  id: TransportCapabilityId
): TransportCapabilityClaim | undefined {
  return getTransportCapabilityClaims().find((c) => c.id === id);
}

export function isProductionReady(id: TransportCapabilityId): boolean {
  return getTransportCapability(id)?.state === "production_ready";
}

export function buildTransportFeaturesResponse(): TransportFeaturesResponse {
  const capabilities = getTransportCapabilityClaims();
  const pilotOrSandbox: string[] = [];
  const comingNext: string[] = [...TRANSPORT_PUBLIC_COMING_NEXT];
  const partnerRequired: string[] = [];

  for (const c of capabilities) {
    if (c.publicBucket === "pilot_sandbox") {
      pilotOrSandbox.push(`${c.title}: ${c.summary}`);
    } else if (c.publicBucket === "partner_required") {
      partnerRequired.push(`${c.title}: ${c.summary}`);
    } else if (c.publicBucket === "coming_next") {
      const line = `${c.title}: ${c.summary}`;
      if (!comingNext.includes(line)) comingNext.push(line);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    capabilities,
    availableNow: [...TRANSPORT_PUBLIC_AVAILABLE_NOW],
    pilotOrSandbox,
    comingNext,
    partnerRequired,
  };
}
