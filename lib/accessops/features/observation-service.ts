import type {
  AccessEvidenceLevel,
  AccessFeatureObservation,
  AccessObservationMethod,
  AccessOpsFeatureType,
  AccessVerificationStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import type { JsonObject } from "../types";

export interface AppendFeatureObservationInput {
  assetId: string;
  featureType: AccessOpsFeatureType;
  observedValue: JsonObject;
  sourceType: string;
  observedAt: Date;
  unit?: string | null;
  evidenceLevel?: AccessEvidenceLevel;
  sourceEntityId?: string | null;
  sourceReference?: string | null;
  observationMethod?: AccessObservationMethod;
  validUntil?: Date | null;
  confidence?: number;
  verificationStatus?: AccessVerificationStatus;
  safeNotes?: string | null;
  privateEvidenceReference?: string | null;
  isInferred?: boolean;
}

export async function appendFeatureObservation(
  input: AppendFeatureObservationInput,
): Promise<AccessFeatureObservation> {
  const observedValue = asJson(input.observedValue);
  if (!observedValue) throw new Error("OBSERVATION_VALUE_REQUIRED");
  return prisma.accessFeatureObservation.create({
    data: {
      assetId: input.assetId,
      featureType: input.featureType,
      observedValue,
      unit: input.unit ?? null,
      evidenceLevel: input.evidenceLevel ?? "unknown",
      sourceType: input.sourceType,
      sourceEntityId: input.sourceEntityId ?? null,
      sourceReference: input.sourceReference ?? null,
      observationMethod: input.observationMethod ?? "unknown",
      observedAt: input.observedAt,
      validUntil: input.validUntil ?? null,
      confidence: input.confidence ?? 0.5,
      verificationStatus: input.verificationStatus ?? "unverified",
      safeNotes: input.safeNotes ?? null,
      privateEvidenceReference: input.privateEvidenceReference ?? null,
      isInferred: input.isInferred ?? false,
    },
  });
}

export type FeatureObservationProjection = Pick<
  AccessFeatureObservation,
  | "assetId"
  | "featureType"
  | "observedValue"
  | "observedAt"
  | "validUntil"
  | "confidence"
  | "isInferred"
  | "verificationStatus"
>;

export function projectCurrentFeatureObservations(
  observations: FeatureObservationProjection[],
  now: Date = new Date(),
): FeatureObservationProjection[] {
  const latest = new Map<AccessOpsFeatureType, FeatureObservationProjection>();
  for (const observation of observations) {
    if (
      observation.validUntil &&
      observation.validUntil.getTime() <= now.getTime()
    )
      continue;
    if (observation.verificationStatus === "rejected") continue;
    if (observation.verificationStatus === "superseded") continue;
    const current = latest.get(observation.featureType);
    if (
      !current ||
      current.observedAt.getTime() < observation.observedAt.getTime()
    ) {
      latest.set(observation.featureType, observation);
    }
  }
  return [...latest.values()];
}

export async function markFeatureObservationStale(
  observation: AccessFeatureObservation,
  staleAt: Date = new Date(),
): Promise<AccessFeatureObservation> {
  return appendFeatureObservation({
    assetId: observation.assetId,
    featureType: observation.featureType,
    observedValue: { stale: true, supersedesObservationId: observation.id },
    sourceType: "system_projection",
    observedAt: staleAt,
    evidenceLevel: "unknown",
    observationMethod: "unknown",
    confidence: 0,
    verificationStatus: "unverified",
    safeNotes: "Marked stale by projection; original row retained append-only.",
    isInferred: true,
  });
}

export async function correctFeatureObservation(
  input: AppendFeatureObservationInput & { correctionForObservationId: string },
): Promise<AccessFeatureObservation> {
  return appendFeatureObservation({
    ...input,
    observedValue: {
      ...input.observedValue,
      correctionForObservationId: input.correctionForObservationId,
    },
  });
}
