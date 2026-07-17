import type { AiModelProfileRecord } from "@/lib/ai-platform/models/inventory";
import { isModelUsable } from "@/lib/ai-platform/models/inventory";

export interface RoutingRequest {
  candidateSlugs: string[];
  requireToolSupport: boolean;
}

export interface RoutingResult {
  selected: AiModelProfileRecord | null;
  fallback: AiModelProfileRecord | null;
  reason: string;
}

/**
 * Selects the first usable model from a candidate list. Falls back to the
 * next usable candidate. If nothing usable exists, returns null and a plain
 * reason string so the caller can surface a "not_configured" state.
 */
export function selectModel(
  registry: AiModelProfileRecord[],
  request: RoutingRequest
): RoutingResult {
  const usable = registry.filter((m) =>
    isModelUsable(m) && (!request.requireToolSupport || m.supportsTools)
  );
  if (usable.length === 0) {
    return {
      selected: null,
      fallback: null,
      reason: "no_usable_model_registered",
    };
  }
  const bySlug = new Map(usable.map((m) => [m.slug, m]));
  const ordered = request.candidateSlugs
    .map((s) => bySlug.get(s))
    .filter((m): m is AiModelProfileRecord => Boolean(m));
  if (ordered.length === 0) {
    return {
      selected: usable[0],
      fallback: usable[1] ?? null,
      reason: "no_candidate_match_used_first_usable",
    };
  }
  return {
    selected: ordered[0],
    fallback: ordered[1] ?? null,
    reason: "candidate_match",
  };
}
