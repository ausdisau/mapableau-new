import { createHash } from "crypto";

export function opaqueJourneyIndexId(journeyId: string): string {
  return createHash("sha256").update(journeyId).digest("hex");
}

export function indexAffectedJourney(
  journeyId: string,
  assetIds: string[],
): { opaqueJourneyId: string; assetIds: string[] } {
  return { opaqueJourneyId: opaqueJourneyIndexId(journeyId), assetIds };
}
