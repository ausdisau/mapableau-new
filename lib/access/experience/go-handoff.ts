/**
 * Access Experience → MapAble Go handoff.
 * Passes destination + routing-relevant mobility constraints only.
 * Never includes health/diagnosis payloads.
 */

import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import type { MobilityRoutingProfile } from "@/lib/go/contracts/route-contracts";

export const GO_SANDBOX_DISCLAIMER =
  "MapAble Go uses a pilot sandbox graph — not live national path evidence. Routes are advisory; they are not guaranteed accessible or safe.";

/** Map active access requirements → Go mobility routing profile (routing-relevant only). */
export function requirementsToMobilityRoutingProfile(
  requirements: AccessRequirementProfile,
): MobilityRoutingProfile {
  const power = requirements.powerchairUser;
  const manual = requirements.wheelchairUser;

  return {
    mobilityAidType: power
      ? "power_wheelchair"
      : manual
        ? "manual_wheelchair"
        : "other",
    minimumPreferredPathWidthMm:
      requirements.minimumPathWidthMm ?? (power ? 1200 : manual ? 900 : undefined),
    preferredMaximumSlopePercent:
      requirements.maximumPreferredGradientPercent ?? undefined,
    curbRampRequired: Boolean(requirements.kerbRampRequired),
    stairsAllowed: !(
      requirements.stepFreeRequired ||
      requirements.wheelchairUser ||
      requirements.powerchairUser
    ),
    liftRequirement: Boolean(requirements.liftRequired),
    accessibleToiletPreference: Boolean(requirements.accessibleToiletRequired),
    unknownSegmentPolicy: "allow_with_warning",
    lowConfidencePolicy: "allow_with_warning",
  };
}

/**
 * Build `/go` query for destination handoff.
 * Caller should let the participant review preferences before planning.
 */
export function buildGoHandoffHref(params: {
  destinationPlaceId: string;
  requirements: AccessRequirementProfile;
}): string {
  const profile = requirementsToMobilityRoutingProfile(params.requirements);
  const qs = new URLSearchParams();
  qs.set("destinationPlaceId", params.destinationPlaceId);
  qs.set("sandbox", "1");
  qs.set("reviewPreferences", "1");

  if (profile.mobilityAidType) qs.set("mobilityAidType", profile.mobilityAidType);
  if (profile.minimumPreferredPathWidthMm != null) {
    qs.set(
      "minimumPreferredPathWidthMm",
      String(profile.minimumPreferredPathWidthMm),
    );
  }
  if (profile.preferredMaximumSlopePercent != null) {
    qs.set(
      "preferredMaximumSlopePercent",
      String(profile.preferredMaximumSlopePercent),
    );
  }
  if (profile.curbRampRequired) qs.set("curbRampRequired", "1");
  if (profile.liftRequirement) qs.set("liftRequirement", "1");
  if (profile.accessibleToiletPreference) {
    qs.set("accessibleToiletPreference", "1");
  }
  if (profile.stairsAllowed === false) qs.set("stairsAllowed", "0");

  return `/go?${qs.toString()}`;
}

/** True when URL indicates sandbox / review-required Go entry. */
export function isSandboxGoHandoff(searchParams: URLSearchParams): boolean {
  return (
    searchParams.get("sandbox") === "1" ||
    searchParams.get("reviewPreferences") === "1"
  );
}
