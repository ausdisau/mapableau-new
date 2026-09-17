import type { GaisDemandContextLabel } from "@/lib/gais/demand/contracts";

export const DEMAND_PARTICIPANT_LAYER_LABEL = "Regional support context";
export const DEMAND_PARTICIPANT_DISCLAIMER =
  "Regional context only. It does not measure your individual needs, service availability or eligibility.";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateDemandStrategyIndex(
  participantCount: number | null,
  yoyGrowthPercent: number | null,
): number | null {
  if (participantCount == null || participantCount < 0) return null;

  const scale = Math.min(100, participantCount / 75);
  if (yoyGrowthPercent == null) return Number(scale.toFixed(2));

  const growth = clamp(((yoyGrowthPercent + 5) / 25) * 100, 0, 100);
  return Number((0.7 * scale + 0.3 * growth).toFixed(2));
}

export function classifyDemandContext(
  participantCount: number | null,
  yoyGrowthPercent: number | null,
): GaisDemandContextLabel {
  if (participantCount == null || participantCount < 1500) return "smaller";
  if (participantCount < 6000) return "established";
  if ((yoyGrowthPercent ?? 0) >= 5) return "large_and_growing";
  return "large";
}
