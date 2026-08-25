import type {
  AccessAdjustmentRecord,
  AccessCapabilityRecord,
  AccessObservationRecord,
  AccessPassport,
  AccessRequirementRecord,
} from "@prisma/client";

import type {
  AccessAdjustment,
  AccessCapability,
  AccessObservation,
  AccessPassport as AccessPassportDto,
  AccessRequirement,
} from "./types";

function jsonScalar(value: unknown): string | number | boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return JSON.stringify(value);
}

export function mapRequirement(
  row: AccessRequirementRecord,
): AccessRequirement {
  return {
    id: row.id,
    passportId: row.passportId,
    ontologyConceptId: row.ontologyConceptId,
    domain: row.domain,
    attribute: row.attribute,
    comparator: (row.comparator as AccessRequirement["comparator"]) ?? undefined,
    value: jsonScalar(row.valueJson),
    unit: row.unit,
    criticality: row.criticality,
    contextScope: row.contextScope,
    timing: row.timing,
    assistance: row.assistance,
    disclosureScopes: row.disclosureScopes as AccessRequirement["disclosureScopes"],
    userConfirmed: row.userConfirmed,
    acceptableAdjustmentIds: row.acceptableAdjustmentIds,
    notes: row.notes ?? undefined,
  };
}

export function mapPassport(
  row: AccessPassport & { requirements: AccessRequirementRecord[] },
): AccessPassportDto {
  return {
    id: row.id,
    userId: row.userId,
    visibilityDefault: row.visibilityDefault,
    containsDiagnosis: false,
    requirements: row.requirements.map(mapRequirement),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapObservation(row: AccessObservationRecord): AccessObservation {
  return {
    id: row.id,
    featureKey: row.featureKey,
    ontologyConceptId: row.ontologyConceptId,
    value: jsonScalar(row.valueJson) ?? false,
    unit: row.unit,
    sourceType: row.sourceType as AccessObservation["sourceType"],
    observedAt: row.observedAt.toISOString(),
    evidenceKinds: row.evidenceKinds,
    verificationStatus: row.verificationStatus,
    confidence: row.confidence,
    reviewDue: row.reviewDue?.toISOString() ?? null,
    disputed: row.disputed,
    placeId: row.placeId,
    entityType: row.entityType,
    entityId: row.entityId,
    evidenceEnvelopeId: row.evidenceEnvelopeId,
    observerUserId: row.observerUserId,
  };
}

export function mapCapability(row: AccessCapabilityRecord): AccessCapability {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    placeId: row.placeId,
    ontologyConceptId: row.ontologyConceptId,
    attribute: row.attribute,
    value: jsonScalar(row.valueJson) ?? false,
    unit: row.unit,
    availabilityJson: row.availabilityJson ?? undefined,
    evidenceObservationId: row.evidenceObservationId,
    status: row.status,
  };
}

export function mapAdjustment(row: AccessAdjustmentRecord): AccessAdjustment {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    ontologyConceptId: row.ontologyConceptId,
    summary: row.summary,
    description: row.description,
    availabilityJson: row.availabilityJson ?? undefined,
    status: row.status,
  };
}
