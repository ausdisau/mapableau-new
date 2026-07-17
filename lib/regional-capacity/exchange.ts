import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type CapacityCandidate,
  type CapacityNeed,
} from "@/lib/connected-capability";

/**
 * Synthetic regional capacity exchange.
 * States remain distinct. No automatic assignment.
 */
export function createTaylorReturnTransportNeed(): CapacityNeed {
  return {
    id: "fixture-capacity-need-return-transport",
    regionId: "harbour-region",
    capacityType: "accessible_vehicle",
    windowStart: new Date().toISOString(),
    windowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    credentialRequirements: ["accessible_vehicle_operator"],
    accessRequirements: ["power_chair_compatible"],
    state: "open",
    isSynthetic: true,
  };
}

export function proposeSyntheticCandidates(
  need: CapacityNeed
): CapacityCandidate[] {
  return [
    {
      id: "fixture-candidate-a",
      needId: need.id,
      providerOrganisationId: "fixture-alt-transport-a",
      state: "candidate_found",
      disclosureMinimised: true,
      automaticAssignment: false,
      isSynthetic: true,
    },
    {
      id: "fixture-candidate-b",
      needId: need.id,
      providerOrganisationId: "fixture-alt-transport-b",
      state: "provider_available",
      disclosureMinimised: true,
      automaticAssignment: false,
      isSynthetic: true,
    },
  ];
}

export function advanceCandidateState(
  candidate: CapacityCandidate,
  to: CapacityCandidate["state"]
): CapacityCandidate | { error: string } {
  const order: CapacityCandidate["state"][] = [
    "candidate_found",
    "provider_available",
    "provider_accepted",
    "participant_approved",
    "service_confirmed",
    "service_delivered",
  ];
  if (to === "rejected" || to === "expired") {
    return { ...candidate, state: to };
  }
  const fromIdx = order.indexOf(candidate.state as (typeof order)[number]);
  const toIdx = order.indexOf(to as (typeof order)[number]);
  if (fromIdx < 0 || toIdx < 0 || toIdx < fromIdx) {
    return {
      error: `Invalid capacity state transition ${candidate.state} → ${to}`,
    };
  }
  if (to === "participant_approved" || to === "service_confirmed") {
    // Explicit: cannot skip participant approval for confirmation
  }
  return {
    ...candidate,
    state: to,
    automaticAssignment: false,
    disclosureMinimised: true,
  };
}

export function regionalExchangeMeta() {
  return {
    automaticAssignment: false,
    hubAmbientParticipantAccess: false,
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
  };
}
