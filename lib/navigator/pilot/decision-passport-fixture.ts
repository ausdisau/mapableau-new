import type { DecisionPassport } from "@/lib/ai/platform/decision-passport/types";

/**
 * Synthetic Decision Passport for accessibility / co-design preview only.
 * Contains no real participant information.
 */
export const DECISION_PASSPORT_A11Y_FIXTURE: DecisionPassport = {
  id: "fixture-decision-passport",
  tenantId: "fixture-tenant",
  participantId: "fixture-participant",
  capabilityKey: "navigator.provider_search_pilot",
  requestedSummary:
    "Find wheelchair-accessible personal care near Newcastle (synthetic fixture).",
  preferencesUsed: ["access:wheelchair", "service:personal care"],
  constraintsUsed: ["state:NSW", "hard_access:wheelchair"],
  sourcesConsulted: [
    {
      id: "ndis_providers_directory",
      label: "NDIS provider directory (MapAble ingest)",
      kind: "approved_directory",
    },
  ],
  missingOrStaleInformation: ["live_availability", "travel_distance"],
  suggestedProviders: [
    {
      sourceId: "fixture-provider-1",
      name: "Example River Supports",
      reasons: ["Access keyword hits: 1", "Matched preference keywords"],
      score: 0.72,
    },
    {
      sourceId: "fixture-provider-2",
      name: "Example Harbour Care",
      reasons: ["Postcode proximity proxy (directory only)"],
      score: 0.61,
    },
  ],
  uncertaintyAndLimitations: [
    "Directory data may be incomplete or stale.",
    "Live availability is not verified in this pilot.",
    "AI commentary is optional and subordinate to deterministic matching.",
  ],
  aiInvolvement: {
    used: false,
    modelVersion: null,
    promptVersion: "navigator-provider-search-v1",
    commentaryOptional: true,
  },
  proposedNextAction: {
    actionType: "create_care_request_draft",
    envelopeId: null,
    summary:
      "Create a service-request draft or transfer filters to Provider Finder.",
  },
  requiredApproverRole: "participant",
  controls: {
    canCorrectFacts: true,
    canEditRankingWeights: true,
    canEditHardConstraints: true,
    canRejectSuggestion: true,
    canRequestAnotherOption: true,
    canWithdrawConsent: true,
    canRequestHumanReview: true,
    canContinueNonAi: true,
    nonAiPath: "/provider-finder?state=NSW&accessNeeds=wheelchair",
  },
  createdAt: "2026-08-12T00:00:00.000Z",
};
