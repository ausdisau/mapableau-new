import type { MobilityRoutingProfile } from "@/lib/go/contracts/route-contracts";

import type { AccessRequirements } from "../contracts";

/**
 * Maps a stored MapAble Go mobility routing profile into generic access requirements.
 * Only maps fields explicitly present on the profile — never fabricates capability limits.
 */
export function mobilityProfileToAccessRequirements(
  profile: MobilityRoutingProfile,
): AccessRequirements {
  const requirements: AccessRequirements = {};

  if (profile.minimumPreferredPathWidthMm != null) {
    requirements.minimumWidthMm = profile.minimumPreferredPathWidthMm;
  }

  if (profile.preferredMaximumSlopePercent != null) {
    requirements.maximumPreferredGradientPercent = profile.preferredMaximumSlopePercent;
  }

  if (profile.preferredMaximumCrossSlopePercent != null) {
    requirements.maximumPreferredCrossSlopePercent =
      profile.preferredMaximumCrossSlopePercent;
  }

  if (profile.stairsAllowed === false) {
    requirements.requiresStepFree = true;
  }

  if (profile.liftRequirement === true) {
    requirements.requiresLift = true;
  }

  if (profile.preferredSurfaceTypes?.length) {
    requirements.preferredSurfaces = [...profile.preferredSurfaceTypes];
  }

  if (profile.avoidedSurfaceTypes?.length) {
    requirements.avoidedSurfaces = [...profile.avoidedSurfaceTypes];
  }

  return requirements;
}

/**
 * Device types with validated physical parameters in the repository today.
 * Scooter profiles may exist but only mapped fields are used — no fabricated limits.
 */
export const SUPPORTED_MOBILITY_AID_TYPES = [
  "manual_wheelchair",
  "power_wheelchair",
  "mobility_scooter",
  "other",
] as const;

export function isSupportedMobilityAidType(
  type: MobilityRoutingProfile["mobilityAidType"],
): boolean {
  if (!type) return false;
  return (SUPPORTED_MOBILITY_AID_TYPES as readonly string[]).includes(type);
}
