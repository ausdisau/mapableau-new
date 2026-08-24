import type { HardConstraint, OptionCandidate } from "../types";
export function transportDomainNotes(): string[] {
  return ["Transport options are candidates only — nothing is booked or confirmed automatically.","Where wheelchair or hoist access is required, verified suitability is a hard constraint.","Choosing an option prepares a draft request for your approval (Action Kernel)."];
}
export function enrichTransportCandidate(candidate: OptionCandidate): OptionCandidate {
  return { ...candidate, domain: "transport", metadata: { ...(candidate.metadata ?? {}), domainBoundary: "transport_candidate_not_confirmation" } };
}
export function transportWheelchairRequirement(): HardConstraint {
  return { kind: "verified_vehicle_suitability", label: "Wheelchair-accessible vehicle (verified)", value: "wheelchair", required: true };
}
export function toTransportOptionCandidate(input: {
  id: string; tenantId: string; displayName: string; operatorName: string; wheelchairAccessible: boolean;
  hoistAvailable?: boolean; verified: boolean; serviceAreas?: string[]; availabilityWindows?: string[];
  distanceKm?: number | null; knownCostAud?: number | null;
}): OptionCandidate {
  const features: string[] = [];
  if (input.wheelchairAccessible) features.push("wheelchair");
  if (input.hoistAvailable) features.push("hoist");
  return enrichTransportCandidate({
    id: input.id, domain: "transport", tenantId: input.tenantId, displayName: input.displayName, providerLabel: input.operatorName,
    features, credentials: [], serviceAreas: input.serviceAreas ?? [], availabilityWindows: input.availabilityWindows ?? [], exclusions: [],
    evidence: [{ id: `${input.id}-vehicle`, label: "Vehicle accessibility suitability", state: input.verified ? "verified" : "unverified", source: "transport_vehicle_features" }],
    verificationState: input.verified ? "verified" : "unverified", distanceKm: input.distanceKm ?? null, knownCostAud: input.knownCostAud ?? null,
    continuityScore: null, preferenceTags: [],
    vehicleSuitability: { wheelchairAccessible: input.wheelchairAccessible, hoistAvailable: input.hoistAvailable ?? false, verified: input.verified },
  });
}
