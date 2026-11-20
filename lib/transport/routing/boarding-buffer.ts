import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";

export function boardingBufferSecondsForMobility(mobility: unknown): number {
  const parsed = parseMobilityRequirements(mobility);
  const base = transportRoutingConfig.boardingBufferSeconds;
  if (parsed.needsExtraBoardingTime) {
    return base + transportRoutingConfig.extraBoardingBufferSeconds;
  }
  return base;
}

export function providerTravelSeconds(row: {
  travelDurationSeconds?: number | null;
  durationSeconds: number;
  boardingBufferSeconds?: number | null;
}): number {
  if (row.travelDurationSeconds != null) return row.travelDurationSeconds;
  return Math.max(0, row.durationSeconds - (row.boardingBufferSeconds ?? 0));
}
