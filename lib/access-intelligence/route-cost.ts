import { routeCostWeights } from "./configuration";
import type { AccessPassport, AccessRequirement, RouteEdge } from "./schemas";

export type RouteCostBreakdown = {
  total: number;
  distance: number;
  gradientPenalty: number;
  narrowPathPenalty: number;
  surfacePenalty: number;
  sensoryPenalty: number;
  uncertaintyPenalty: number;
  temporaryConditionPenalty: number;
};

function preferredMinWidth(passport: AccessPassport): number | null {
  const req = passport.requirements.find(
    (r) =>
      (r.featureType === "clear_door_width_mm" ||
        r.featureType === "corridor_width_mm" ||
        r.featureType === "lift_door_width_mm") &&
      r.operator === "minimum",
  );
  return req ? Number(req.value) : null;
}

function maxGradient(passport: AccessPassport): number | null {
  const req = passport.requirements.find(
    (r) => r.featureType === "gradient_ratio" && r.operator === "maximum",
  );
  return req ? Number(req.value) : null;
}

function wantsQuiet(passport: AccessPassport): boolean {
  return passport.requirements.some(
    (r) =>
      r.featureType === "quiet_waiting_area" ||
      r.featureType === "low_glare_lighting",
  );
}

/**
 * Route cost for an eligible edge.
 * Higher cost = less preferred. Uncertainty and temporary barriers weigh heavily.
 */
export function calculateRouteCost(
  edge: RouteEdge,
  passport: AccessPassport,
): RouteCostBreakdown {
  const w = routeCostWeights;
  const distance = edge.distanceMetres * w.distance;

  let gradientPenalty = 0;
  if (edge.gradientRatio != null && edge.gradientRatio > 0.05) {
    gradientPenalty = edge.gradientRatio * w.gradientPenalty * 100;
  }

  let narrowPathPenalty = 0;
  const minWidth = preferredMinWidth(passport);
  if (edge.widthMm != null && minWidth != null) {
    const slack = edge.widthMm - minWidth;
    if (slack < 50) narrowPathPenalty = w.narrowPathPenalty;
    else if (slack < 150) narrowPathPenalty = w.narrowPathPenalty * 0.4;
  }

  let surfacePenalty = 0;
  if (edge.surface && /gravel|uneven|cobble/i.test(edge.surface)) {
    surfacePenalty = w.surfacePenalty;
  }

  let sensoryPenalty = 0;
  if (wantsQuiet(passport) && edge.noiseLevel === "high") {
    sensoryPenalty = w.sensoryPenalty;
  }

  const uncertaintyPenalty =
    (1 - edge.evidenceConfidence) * w.uncertaintyPenalty;

  const temporaryConditionPenalty = edge.temporaryBarrier
    ? w.temporaryConditionPenalty
    : 0;

  const total =
    distance +
    gradientPenalty +
    narrowPathPenalty +
    surfacePenalty +
    sensoryPenalty +
    uncertaintyPenalty +
    temporaryConditionPenalty;

  return {
    total,
    distance,
    gradientPenalty,
    narrowPathPenalty,
    surfacePenalty,
    sensoryPenalty,
    uncertaintyPenalty,
    temporaryConditionPenalty,
  };
}

export function hardRequirementRejectionReasons(
  edge: RouteEdge,
  passport: AccessPassport,
  opts?: { liftOutage?: boolean },
): string[] {
  const reasons: string[] = [];
  const stepFree = passport.requirements.find(
    (r) => r.featureType === "step_free" && r.importance === "required",
  );
  if (stepFree && edge.steps > 0) {
    reasons.push("Edge has steps but step-free access is required.");
  }

  const widthReqs = passport.requirements.filter(
    (r) =>
      r.importance === "required" &&
      r.operator === "minimum" &&
      (r.featureType === "clear_door_width_mm" ||
        r.featureType === "corridor_width_mm" ||
        r.featureType === "lift_door_width_mm"),
  ) as AccessRequirement[];

  for (const req of widthReqs) {
    if (edge.widthMm != null && edge.widthMm < Number(req.value)) {
      reasons.push(
        `Width ${edge.widthMm} mm is below required minimum ${req.value} mm.`,
      );
    }
  }

  const maxGrad = maxGradient(passport);
  const gradReq = passport.requirements.find(
    (r) => r.featureType === "gradient_ratio" && r.importance === "required",
  );
  if (
    gradReq &&
    maxGrad != null &&
    edge.gradientRatio != null &&
    edge.gradientRatio > maxGrad
  ) {
    reasons.push(
      `Gradient ${edge.gradientRatio} exceeds maximum ${maxGrad}.`,
    );
  }

  const liftRequired = passport.requirements.some(
    (r) => r.featureType === "lift" && r.importance === "required",
  );
  if (liftRequired && edge.liftAvailable === false) {
    reasons.push("Lift is required but this edge has no available lift.");
  }
  if (opts?.liftOutage && edge.liftAvailable === true) {
    reasons.push("Lift has an active outage.");
  }

  if (edge.temporaryBarrier) {
    reasons.push("Temporary barrier blocks this edge.");
  }

  const badSurface = passport.requirements.find(
    (r) =>
      r.featureType === "surface_type" &&
      r.importance === "required" &&
      r.operator === "equals",
  );
  if (
    badSurface &&
    edge.surface &&
    String(edge.surface).toLowerCase() === String(badSurface.value).toLowerCase() &&
    // passport states unusable surface via notes or value "unusable:*"
    String(badSurface.value).toLowerCase().startsWith("unusable")
  ) {
    reasons.push(`Surface ${edge.surface} is marked unusable by passport.`);
  }

  // Explicit unusable surface list via includes operator
  const unusable = passport.requirements.find(
    (r) =>
      r.featureType === "surface_type" &&
      r.importance === "required" &&
      r.operator === "includes",
  );
  if (
    unusable &&
    edge.surface &&
    String(unusable.value)
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .includes(edge.surface.toLowerCase())
  ) {
    reasons.push(`Surface ${edge.surface} is marked unusable by passport.`);
  }

  return reasons;
}
