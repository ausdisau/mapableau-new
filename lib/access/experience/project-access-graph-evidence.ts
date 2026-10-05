import type {
  AccessGraphEvidenceDto,
  AccessGraphEvidenceItem,
} from "@/lib/access/experience/access-graph-evidence-dto";

type GraphObservationProjectionInput = AccessGraphEvidenceItem & {
  observerUserId?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  sourceType?: string;
  evidenceKinds?: string[];
  canonicalProvenance?: unknown;
};

export function projectAccessGraphEvidence(input: {
  placeId: string;
  featureCount: number;
  expiredCount: number;
  unverifiedCount: number;
  observations: GraphObservationProjectionInput[];
  note: string;
  claimState: "in_development";
  productionClaim: "none";
}): AccessGraphEvidenceDto {
  return {
    placeId: input.placeId,
    featureCount: input.featureCount,
    expiredCount: input.expiredCount,
    unverifiedCount: input.unverifiedCount,
    observations: input.observations.map((observation) => ({
      id: observation.id,
      featureKey: observation.featureKey,
      ontologyConceptId: observation.ontologyConceptId,
      value: observation.value,
      unit: observation.unit,
      observedAt: observation.observedAt,
      confidence: observation.confidence,
      disputed: observation.disputed,
      provenance: {
        sourceClass: observation.provenance.sourceClass,
        verificationStatus: observation.provenance.verificationStatus,
        displayLabel: observation.provenance.displayLabel,
        unverified: observation.provenance.unverified,
        aiInferred: observation.provenance.aiInferred,
      },
      freshness: {
        state: observation.freshness.state,
        policyDescription: observation.freshness.policyDescription,
        expiresAt: observation.freshness.expiresAt,
      },
    })),
    note: input.note,
    claimState: "in_development",
    productionClaim: "none",
  };
}
