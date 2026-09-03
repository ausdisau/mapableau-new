import type { AccessRequirementProfile } from "@/lib/access/experience/types";

/**
 * Controlled handoff from Access → MapAble Go / Navigate.
 * Only routing-relevant mobility requirements are passed — never diagnosis or health data.
 */
export type AccessRouteHandoffInput = {
  destinationPlaceId: string;
  destinationName?: string;
  requirements: AccessRequirementProfile;
  journeyOverrideActive?: boolean;
};

export type AccessRouteHandoffQuery = {
  destinationPlaceId: string;
  destinationName?: string;
  stepFreeRequired?: "1";
  maxGradientPercent?: string;
  minPathWidthMm?: string;
  journeyOverride?: "1";
  sandbox: "1";
};

export function buildAccessToGoHandoff(
  input: AccessRouteHandoffInput,
): AccessRouteHandoffQuery {
  const query: AccessRouteHandoffQuery = {
    destinationPlaceId: input.destinationPlaceId,
    sandbox: "1",
  };

  if (input.destinationName) {
    query.destinationName = input.destinationName;
  }

  const req = input.requirements;
  if (req.stepFreeRequired || req.wheelchairUser || req.powerchairUser) {
    query.stepFreeRequired = "1";
  }
  if (req.maximumPreferredGradientPercent != null) {
    query.maxGradientPercent = String(req.maximumPreferredGradientPercent);
  }
  if (req.minimumPathWidthMm != null) {
    query.minPathWidthMm = String(req.minimumPathWidthMm);
  }
  if (input.journeyOverrideActive) {
    query.journeyOverride = "1";
  }

  return query;
}

export function accessToGoHref(input: AccessRouteHandoffInput): string {
  const query = buildAccessToGoHandoff(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) params.set(key, value);
  }
  return `/go?${params.toString()}`;
}

/** Copy constraints — never claim live national accessible routing. */
export const ACCESS_GO_HANDOFF_SANDBOX_NOTICE =
  "MapAble Go route planning uses a pilot sandbox graph. It is not live national accessibility routing, and routes are not guaranteed accessible.";
