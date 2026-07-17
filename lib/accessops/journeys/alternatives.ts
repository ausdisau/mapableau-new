import type { JourneyRouteOption } from "../types";

export function rankJourneyAlternatives(
  options: JourneyRouteOption[],
): JourneyRouteOption[] {
  return [...options].sort(
    (a, b) => Number(a.requiresApproval) - Number(b.requiresApproval),
  );
}
