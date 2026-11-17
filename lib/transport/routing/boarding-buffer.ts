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
