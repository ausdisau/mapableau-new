import type {
  MapAbleSearchHit,
  MapAbleSearchResponse,
} from "@/lib/search/mapable-search-core";
import {
  hardDenyOperationalActions,
  isCapabilityEnabled,
} from "@/lib/support-intelligence/config/feature-flags";
import type { ExplainableMatchCandidate } from "@/lib/support-intelligence/types";

/**
 * Maps SMA candidates onto MapAble Search hits without asserting registration
 * or screening. Preference-ranked organic results only — no commercial boost.
 */
export function smaCandidatesToSearchHits(
  candidates: ExplainableMatchCandidate[],
): MapAbleSearchHit[] {
  return candidates
    .filter((c) => c.eligibilityPassed)
    .map((c) => ({
      id: c.entityId,
      kind: "provider_outlet" as const,
      vertical: "providers" as const,
      title: c.title,
      description: [
        c.explanation.whyMayWork,
        c.explanation.unknown.length > 0
          ? `Unknown: ${c.explanation.unknown.join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      href: `/provider-finder?q=${encodeURIComponent(c.title)}`,
      provenance: "local_ndis_directory_import" as const,
      sourceLabel: "Support Intelligence (directory + evidence)",
      registration: "not_independently_verified" as const,
      workerScreening: "not_independently_verified" as const,
      accessFit: "unknown" as const,
      availability: "unknown" as const,
    }));
}

export function enhanceSearchResponse(input: {
  base: MapAbleSearchResponse;
  candidates?: ExplainableMatchCandidate[];
}): MapAbleSearchResponse & {
  supportIntelligence: {
    enabled: boolean;
    operationalActions: ReturnType<typeof hardDenyOperationalActions>;
  };
} {
  const enabled = isCapabilityEnabled("search");
  const extra =
    enabled && input.candidates
      ? smaCandidatesToSearchHits(input.candidates)
      : [];

  const seen = new Set(input.base.results.map((r) => r.id));
  const merged = [...input.base.results];
  for (const hit of extra) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    merged.push(hit);
  }

  return {
    ...input.base,
    results: merged,
    resultCount: merged.length,
    warnings: [
      ...input.base.warnings,
      ...(enabled
        ? [
            "Support Intelligence adds evidence-labelled directory matches only. Registration, screening, vacancies and funding remain unknown unless independently confirmed.",
          ]
        : []),
    ],
    supportIntelligence: {
      enabled,
      operationalActions: hardDenyOperationalActions(),
    },
  };
}
