import {
  ACCESS_QUERY_AST_VERSION,
  type AccessQueryAst,
  type AccessQueryConstraint,
} from "@/lib/access/intelligence-next/query/ast";
import { validateAccessQuery } from "@/lib/access/intelligence-next/query/validate";

import type { GaisStructuredQuery } from "./request-schema";

function buildParticipantSummary(query: GaisStructuredQuery): string {
  if (query.participantEditableSummary?.trim()) {
    return query.participantEditableSummary.trim();
  }

  const parts: string[] = ["Structured GAIS geographic query"];
  if (query.featureTypes?.length) {
    parts.push(`feature types: ${query.featureTypes.join(", ")}`);
  }
  if (query.requirements?.requiresStepFree) {
    parts.push("requires step-free");
  }
  if (query.evidenceRequirements?.requiresKnownStepFreeEntrance) {
    parts.push("known step-free entrance evidence");
  }
  if (query.evidenceRequirements?.requiresAccessibleToiletEvidence) {
    parts.push("accessible toilet evidence");
  }
  if (query.unknownOnly) parts.push("unknown accessibility data only");
  return parts.join("; ");
}

/**
 * Compiles a GAIS structured query into Access Intelligence Next AST for validation.
 * Reuses existing ontology concepts — no duplicate AST.
 */
export function compileGaisQueryToAccessQueryAst(
  query: GaisStructuredQuery,
  queryId: string,
): AccessQueryAst {
  const require: AccessQueryConstraint[] = [];

  if (query.requirements?.requiresStepFree) {
    require.push({
      ontologyConceptId: "physical.step_free",
      comparator: "eq",
      value: true,
    });
  }

  if (query.requirements?.requiresLift) {
    require.push({
      ontologyConceptId: "physical.lift_operational",
      comparator: "eq",
      value: true,
    });
  }

  if (query.requirements?.minimumWidthMm != null) {
    require.push({
      ontologyConceptId: "physical.minimum_clear_width_mm",
      comparator: "gte",
      value: query.requirements.minimumWidthMm,
    });
  }

  if (query.evidenceRequirements?.requiresKnownStepFreeEntrance) {
    require.push({
      ontologyConceptId: "physical.step_free",
      comparator: "eq",
      value: true,
    });
  }

  if (query.evidenceRequirements?.requiresAccessibleToiletEvidence) {
    require.push({
      ontologyConceptId: "physical.accessible_toilet",
      comparator: "eq",
      value: true,
    });
  }

  return {
    id: queryId,
    version: ACCESS_QUERY_AST_VERSION,
    target: "feature",
    require,
    prefer: [],
    avoid: [],
    at: query.activeAt,
    participantEditableSummary: buildParticipantSummary(query),
  };
}

export function validateGaisQueryAst(query: GaisStructuredQuery, queryId: string) {
  const ast = compileGaisQueryToAccessQueryAst(query, queryId);
  return validateAccessQuery(ast);
}
