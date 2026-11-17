import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import type { RouteConstraintResult } from "@/types/maji";
import type { PermittedHazardEvidence } from "@/types/tfnsw";
import type { EligibilityCheckResult } from "@/types/transport-scheduling";

const CLOSED_ROAD_PATTERN =
  /\b(road\s*)?closed\b|\broad closure\b|\bclosed to traffic\b/i;

export function hasHardMobilityRequirements(mobility: unknown): boolean {
  const reqs = parseMobilityRequirements(mobility);
  return Boolean(
    reqs.requiresWheelchairAccessible ||
      reqs.requiresRamp ||
      reqs.requiresHoist ||
      reqs.requiresLift ||
      reqs.requiresAccessEquipment
  );
}

export function isClosedRoadHazard(hazard: PermittedHazardEvidence): boolean {
  const text = [hazard.subCategory, hazard.headline, hazard.category]
    .filter(Boolean)
    .join(" ");
  return CLOSED_ROAD_PATTERN.test(text);
}

export function evaluateRouteConstraints(input: {
  mobility: unknown;
  vehicleAssigned: boolean;
  vehicleEligibility: EligibilityCheckResult | null;
  hazards: PermittedHazardEvidence[];
  estimatedArrivalAt: Date;
  commitmentAt: Date;
}): RouteConstraintResult {
  const reasons: string[] = [];
  let accessibilityPassed: boolean | null = true;
  const closedRoadMatched = input.hazards.some(isClosedRoadHazard);
  const hardMobility = hasHardMobilityRequirements(input.mobility);

  if (hardMobility && !input.vehicleAssigned) {
    accessibilityPassed = null;
    reasons.push(
      "The assigned vehicle has not been confirmed against this participant's mobility requirements."
    );
  } else if (hardMobility && input.vehicleEligibility == null) {
    accessibilityPassed = null;
    reasons.push(
      "Vehicle accessibility could not be verified, so a person needs to review this option."
    );
  } else if (input.vehicleEligibility && !input.vehicleEligibility.eligible) {
    accessibilityPassed = false;
    reasons.push(
      input.vehicleEligibility.reasons[0] ??
        "This vehicle does not meet the recorded mobility requirements."
    );
  }

  const arrivalCommitmentPassed =
    input.estimatedArrivalAt.getTime() <= input.commitmentAt.getTime();
  if (!arrivalCommitmentPassed) {
    reasons.push(
      "This option would arrive after the scheduled commitment, so it is excluded."
    );
  }

  if (closedRoadMatched) {
    reasons.push(
      "A closed-road hazard is matched near this option. A person needs to review it; the booking is unchanged."
    );
  }

  const accessibilityHardFail = accessibilityPassed === false;
  const requiresHumanReview =
    closedRoadMatched || accessibilityPassed === null;
  const passed =
    !accessibilityHardFail && arrivalCommitmentPassed && !closedRoadMatched;

  let status: RouteConstraintResult["status"] = null;
  if (accessibilityHardFail || !arrivalCommitmentPassed) {
    status = "constraint_violation";
  } else if (requiresHumanReview) {
    status = "human_review_required";
  }

  return {
    passed,
    status,
    reasons,
    accessibilityPassed,
    arrivalCommitmentPassed,
    closedRoadMatched,
    requiresHumanReview,
  };
}
