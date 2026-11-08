/**
 * GAIS / legacy import helpers — always Unknown + unverified_legacy_import.
 * Never promote icons or aggregate rows to Green.
 */
import { ACCESS_SIGNALS_RULE_VERSION } from "./ruleset";
import type { RagEvaluationResult, RagObservation } from "./types";

export type GaisLegacyRow = {
  sourceRecordId: string;
  kind: "feature" | "aggregate" | "icon_only";
  layerHint?: string;
  geometryPresent: boolean;
};

export type GaisImportResult = {
  accepted: boolean;
  reason: string;
  observation: RagObservation | null;
  evaluation: RagEvaluationResult | null;
};

const LAYER_HINTS_NOT_GREEN = [
  "toilet",
  "stairs",
  "parking",
  "accessible",
  "disability",
];

export function importGaisLegacyRow(row: GaisLegacyRow): GaisImportResult {
  if (row.kind === "aggregate") {
    return {
      accepted: false,
      reason: "Aggregate rows are rejected — import only feature-level records.",
      observation: null,
      evaluation: null,
    };
  }

  if (row.kind === "icon_only") {
    return {
      accepted: true,
      reason: "Icon/label presence is not a rating; forced Unknown.",
      observation: {
        id: `gais-${row.sourceRecordId}`,
        featureKey: "legacy_icon",
        domain: "legacy",
        value: row.layerHint ?? "icon",
        observedAt: new Date(0).toISOString(),
        flags: ["unverified_legacy_import"],
      },
      evaluation: unknownLegacyResult([`gais-${row.sourceRecordId}`], "Icon/label ≠ accessibility rating."),
    };
  }

  const hint = (row.layerHint ?? "").toLowerCase();
  if (LAYER_HINTS_NOT_GREEN.some((token) => hint.includes(token))) {
    return {
      accepted: true,
      reason:
        "ADL/GAIS layer hints (toilet/stairs/parking/accessible) must not yield Green.",
      observation: {
        id: `gais-${row.sourceRecordId}`,
        featureKey: "legacy_layer_hint",
        domain: "legacy",
        value: row.layerHint ?? "",
        observedAt: new Date(0).toISOString(),
        flags: ["unverified_legacy_import"],
      },
      evaluation: unknownLegacyResult(
        [`gais-${row.sourceRecordId}`],
        "Layer-name heuristics are not verified RAG.",
      ),
    };
  }

  return {
    accepted: true,
    reason: "Legacy feature imported as Unknown + unverified_legacy_import.",
    observation: {
      id: `gais-${row.sourceRecordId}`,
      featureKey: "legacy_feature",
      domain: "legacy",
      value: row.sourceRecordId,
      observedAt: new Date(0).toISOString(),
      flags: ["unverified_legacy_import"],
    },
    evaluation: unknownLegacyResult(
      [`gais-${row.sourceRecordId}`],
      "Legacy import defaults to Unknown until independently assessed.",
    ),
  };
}

function unknownLegacyResult(
  evidenceRefs: string[],
  explanation: string,
): RagEvaluationResult {
  return {
    status: "unknown",
    applicability: "applicable",
    explanation,
    evidenceRefs,
    ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
    unresolvedQuestions: ["Run a fresh Access Signals assessment before any Green claim."],
    operationalConditions: [],
    aggregated: false,
    limitations: ["unverified_legacy_import"],
  };
}
