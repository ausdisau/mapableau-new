import type { AccessCapability, AccessAdjustment, AccessRequirement } from "@/lib/access/infrastructure/types";
import {
  evaluateCompatibility,
  summariseCompatibilityForParticipant,
  type CompatibilityEvaluationResult,
} from "@/lib/access/infrastructure/engine";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";

export type TransportSegmentLabel =
  | "vehicle"
  | "pickup"
  | "route"
  | "destination";

export type TransportSegmentAssessment = {
  segment: TransportSegmentLabel;
  state: CompatibilityEvaluationResult["state"];
  summary: string;
  findings: CompatibilityEvaluationResult["findings"];
};

export type TransportCompatibilityReport = {
  overall: CompatibilityEvaluationResult["state"];
  participantSummary: string;
  segments: TransportSegmentAssessment[];
  decisionOwner: "PARTICIPANT";
  productionClaim: "none";
  limitations: string[];
};

export type VehicleCapabilityProjectionInput = {
  vehicleId: string;
  /** Evidence-backed flags — prefer measurements over accessible=true. */
  accessibleVehicle?: boolean | null;
  boardingAssistance?: boolean | null;
  remainInWheelchair?: boolean | null;
  doorClearWidthMm?: number | null;
  mobilityDeviceWeightLimitKg?: number | null;
  restraintAvailable?: boolean | null;
  evidenceStatus?: AccessCapability["status"];
  evidenceObservationId?: string;
  disputed?: boolean;
  reviewDue?: string | null;
};

export type PlaceSegmentProjectionInput = {
  placeId: string;
  segment: "pickup" | "destination";
  stepFree?: boolean | null;
  accessibleDropoff?: boolean | null;
  evidenceStatus?: AccessCapability["status"];
  evidenceObservationId?: string;
};

/** Project vehicle evidence into AccessCapability shapes (in-memory). */
export function projectVehicleCapabilities(
  input: VehicleCapabilityProjectionInput,
): AccessCapability[] {
  const status = input.evidenceStatus ?? "unknown";
  const obsId = input.evidenceObservationId ?? `synthetic-obs-${input.vehicleId}`;
  const caps: AccessCapability[] = [];

  const push = (
    ontologyConceptId: string,
    attribute: string,
    value: string | number | boolean,
    unit?: string,
  ) => {
    caps.push({
      id: `cap-${input.vehicleId}-${attribute}`,
      entityType: "vehicle",
      entityId: input.vehicleId,
      ontologyConceptId,
      attribute,
      value,
      unit,
      evidenceObservationId: obsId,
      status,
    });
  };

  if (input.accessibleVehicle != null) {
    push("transport.accessible_vehicle", "accessible_vehicle", input.accessibleVehicle);
  }
  if (input.boardingAssistance != null) {
    push("transport.boarding_assistance", "boarding_assistance", input.boardingAssistance);
  }
  if (input.remainInWheelchair != null) {
    push("transport.remain_in_wheelchair", "remain_in_wheelchair", input.remainInWheelchair);
  }
  if (input.doorClearWidthMm != null) {
    push(
      "mobility_movement.minimum_clear_width_mm",
      "door_clear_width_mm",
      input.doorClearWidthMm,
      "mm",
    );
  }
  if (input.restraintAvailable != null) {
    push("transport.accessible_vehicle", "restraint_available", input.restraintAvailable);
  }

  return caps.map((c) => ({
    ...c,
    // Attach freshness metadata for engine via status only; callers may wrap.
  }));
}

export function projectPlaceSegmentCapabilities(
  input: PlaceSegmentProjectionInput,
): AccessCapability[] {
  const status = input.evidenceStatus ?? "unknown";
  const obsId = input.evidenceObservationId ?? `synthetic-obs-${input.placeId}`;
  const caps: AccessCapability[] = [];
  if (input.stepFree != null) {
    caps.push({
      id: `cap-${input.placeId}-step_free`,
      entityType: "place",
      entityId: input.placeId,
      placeId: input.placeId,
      ontologyConceptId: "mobility_movement.step_free",
      attribute: "step_free",
      value: input.stepFree,
      evidenceObservationId: obsId,
      status,
    });
  }
  if (input.accessibleDropoff != null) {
    caps.push({
      id: `cap-${input.placeId}-dropoff`,
      entityType: "place",
      entityId: input.placeId,
      placeId: input.placeId,
      ontologyConceptId: "transport.accessible_dropoff",
      attribute: "accessible_dropoff",
      value: input.accessibleDropoff,
      evidenceObservationId: obsId,
      status,
    });
  }
  return caps;
}

function withObservationMeta(
  caps: AccessCapability[],
  meta?: { disputed?: boolean; reviewDue?: string | null; status?: AccessCapability["status"] },
) {
  return caps.map((c) => ({
    ...c,
    status: meta?.status ?? c.status,
    observationStatus: meta?.status ?? c.status,
    disputed: meta?.disputed,
    reviewDue: meta?.reviewDue,
  }));
}

/**
 * Segment-aware transport compatibility — does not collapse to one unexplained icon.
 * Flag-gated for live wiring; pure function usable in tests without flags.
 */
export function assessTransportCompatibility(params: {
  passportId: string;
  requirements: AccessRequirement[];
  vehicle: VehicleCapabilityProjectionInput;
  pickup?: PlaceSegmentProjectionInput | null;
  destination?: PlaceSegmentProjectionInput | null;
  adjustments?: AccessAdjustment[];
}): TransportCompatibilityReport {
  const vehicleCaps = withObservationMeta(projectVehicleCapabilities(params.vehicle), {
    disputed: params.vehicle.disputed,
    reviewDue: params.vehicle.reviewDue,
    status: params.vehicle.evidenceStatus,
  });

  const vehicleResult = evaluateCompatibility({
    passportId: params.passportId,
    requirements: params.requirements.filter(
      (r) =>
        r.domain === "transport" ||
        r.ontologyConceptId.startsWith("transport.") ||
        r.ontologyConceptId.includes("clear_width") ||
        r.ontologyConceptId.includes("step_free"),
    ),
    entityType: "vehicle",
    entityId: params.vehicle.vehicleId,
    capabilities: vehicleCaps,
    adjustments: params.adjustments ?? [],
    contextTags: ["TRANSPORT"],
  });

  const segments: TransportSegmentAssessment[] = [
    {
      segment: "vehicle",
      state: vehicleResult.state,
      summary: summariseCompatibilityForParticipant(vehicleResult),
      findings: vehicleResult.findings,
    },
  ];

  if (params.pickup) {
    const pickupCaps = withObservationMeta(
      projectPlaceSegmentCapabilities(params.pickup),
      { status: params.pickup.evidenceStatus },
    );
    const pickupReqs = params.requirements.filter(
      (r) =>
        r.ontologyConceptId === "mobility_movement.step_free" ||
        r.ontologyConceptId === "transport.accessible_dropoff",
    );
    const pickupResult = evaluateCompatibility({
      passportId: params.passportId,
      requirements: pickupReqs,
      entityType: "place",
      entityId: params.pickup.placeId,
      capabilities: pickupCaps,
      adjustments: [],
      contextTags: ["TRANSPORT", "PICKUP"],
    });
    segments.push({
      segment: "pickup",
      state: pickupResult.state,
      summary: summariseCompatibilityForParticipant(pickupResult),
      findings: pickupResult.findings,
    });
  } else {
    segments.push({
      segment: "pickup",
      state: "uncertain",
      summary: "Pickup access not evaluated — evidence not provided.",
      findings: [],
    });
  }

  segments.push({
    segment: "route",
    state: "uncertain",
    summary: "Route barriers not verified in this slice — treated as unknown.",
    findings: [],
  });

  if (params.destination) {
    const destCaps = withObservationMeta(
      projectPlaceSegmentCapabilities(params.destination),
      { status: params.destination.evidenceStatus },
    );
    const destReqs = params.requirements.filter(
      (r) =>
        r.ontologyConceptId === "mobility_movement.step_free" ||
        r.ontologyConceptId === "transport.accessible_dropoff" ||
        r.ontologyConceptId === "self_care_continence.accessible_toilet",
    );
    const destResult = evaluateCompatibility({
      passportId: params.passportId,
      requirements: destReqs,
      entityType: "place",
      entityId: params.destination.placeId,
      capabilities: destCaps,
      adjustments: [],
      contextTags: ["TRANSPORT", "DESTINATION"],
    });
    segments.push({
      segment: "destination",
      state: destResult.state,
      summary: summariseCompatibilityForParticipant(destResult),
      findings: destResult.findings,
    });
  } else {
    segments.push({
      segment: "destination",
      state: "uncertain",
      summary: "Destination access not evaluated — evidence not provided.",
      findings: [],
    });
  }

  const states = segments.map((s) => s.state);
  let overall: CompatibilityEvaluationResult["state"] = "compatible";
  if (states.includes("incompatible")) overall = "incompatible";
  else if (states.includes("uncertain")) overall = "uncertain";
  else if (states.includes("compatible_with_adjustment")) {
    overall = "compatible_with_adjustment";
  }

  const overallResult: CompatibilityEvaluationResult = {
    ...vehicleResult,
    state: overall,
    limitations: [
      ...vehicleResult.limitations,
      "Segment assessments are independent — do not collapse into a single accessibility icon.",
      "MapAble does not guarantee live vehicle verification or partner booking in this slice.",
    ],
  };

  return {
    overall,
    participantSummary: summariseCompatibilityForParticipant(overallResult),
    segments,
    decisionOwner: "PARTICIPANT",
    productionClaim: "none",
    limitations: overallResult.limitations,
  };
}

/** Live wiring guard — returns null when transport compatibility flag is off. */
export function assessTransportCompatibilityIfEnabled(
  params: Parameters<typeof assessTransportCompatibility>[0],
): TransportCompatibilityReport | null {
  if (
    !accessInfrastructureFlags.enabled ||
    !accessInfrastructureFlags.transportCompatibility
  ) {
    return null;
  }
  return assessTransportCompatibility(params);
}

/**
 * Replacement search: nearest *sufficiently compatible* vehicle — not nearest available.
 * Interface only in this slice; does not claim live dispatch.
 */
export function filterSufficientlyCompatibleVehicles<T extends { vehicleId: string }>(
  candidates: T[],
  assess: (vehicleId: string) => CompatibilityEvaluationResult["state"],
): T[] {
  return candidates.filter((c) => {
    const state = assess(c.vehicleId);
    return state === "compatible" || state === "compatible_with_adjustment";
  });
}
