import { summarisePortfolio } from "./portfolio";
import type { LabsNativeIntelligenceView, NativeRouteDecision } from "./types";

/**
 * Labs presentation helpers for MapAble-native intelligence R&D.
 * Always labels experimental status, model used, limitations, and data handling.
 * Never implies production support or participant-facing product claims.
 */

export function buildLabsNativeIntelligenceView(input: {
  decision?: NativeRouteDecision | null;
}): LabsNativeIntelligenceView {
  const modelUsed =
    input.decision && input.decision.ok ? input.decision.modelId : null;

  return {
    experimental: true,
    label: "MapAble-native intelligence (experimental)",
    modelUsed,
    limitations: [
      "Experimental / Labs only — not production-supported.",
      "Does not replace the production AI gateway.",
      "Cannot execute actions or raise authority ceilings.",
      "Local/open-weight routes are evaluation-gated and fail-closed.",
      "Unevaluated models cannot silently replace production capabilities.",
    ],
    dataHandling: [
      "No training data store in this R&D layer.",
      "Governed retrieval requires provenance on every hit.",
      "Prohibited data classes are enforced per model registration.",
      "Do not scrape personal stories without lawful ethical basis.",
      "Participant-controlled context remains participant-controlled.",
    ],
    productionSupported: false,
    participantFacingClaimAllowed: false,
  };
}

export function labsPortfolioBlurb(): string {
  const s = summarisePortfolio();
  return [
    `Portfolio models: ${s.totalModels}`,
    `R&D-only: ${s.rndOnlyCount}`,
    `Production-eligible (pilot/prod eval status): ${s.productionEligibleCount}`,
    "Promotion to production is never automatic.",
  ].join(" · ");
}
