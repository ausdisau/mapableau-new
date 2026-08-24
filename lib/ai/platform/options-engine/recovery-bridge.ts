import type { MapAbleRecoveryAlternative } from "@/lib/ai/platform/recovery/types";
import { generateOptions } from "./engine";
import type { OptionCandidate, OptionsDomain, OptionsSession } from "./types";

export function optionsForRecoveryAlternative(input: {
  alternative: MapAbleRecoveryAlternative; tenantId: string; participantId: string; actorId: string;
  missionId: string; domain: OptionsDomain; candidates: OptionCandidate[]; requirements?: OptionsSession["requirements"];
}): OptionsSession | null {
  if (input.candidates.length === 0) return null;
  return generateOptions({
    tenantId: input.tenantId, participantId: input.participantId, actorId: input.actorId, domain: input.domain,
    missionId: input.missionId, requirements: input.requirements ?? [], candidates: input.candidates, requestModelExplanation: false,
  });
}

export function inferDomainFromRecoveryLabel(label: string): OptionsDomain | null {
  const lower = label.toLowerCase();
  if (lower.includes("transport")) return "transport";
  if (lower.includes("support") || lower.includes("care") || lower.includes("worker")) return "care";
  if (lower.includes("access") || lower.includes("workplace")) return "access";
  if (lower.includes("job") || lower.includes("employ")) return "jobs";
  return null;
}
