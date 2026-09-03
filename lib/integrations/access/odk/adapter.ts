import type {
  AccessEvidenceProvider,
  EvidenceRequest,
  EvidenceResult,
  NormalizedObservation,
  ProviderHealth,
} from "../contracts";
import { createUnverifiedProvenance, normalizedObservationSchema } from "../contracts";
import { openInfrastructureFlags } from "../flags";
import { parseOdkSubmission, type OdkSubmission } from "./schemas";

export class OdkAdapter implements AccessEvidenceProvider {
  readonly providerId = "odk" as const;

  isEnabled(): boolean {
    return openInfrastructureFlags.accessMissions;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    return {
      providerId: this.providerId,
      configured: true,
      reachable: false,
      latencyMs: null,
      version: null,
      checkedAt,
      message: this.isEnabled()
        ? "ODK boundary active — no live ODK server in foundation"
        : "Access missions flag is OFF",
    };
  }

  async resolveEvidence(request: EvidenceRequest): Promise<EvidenceResult> {
    if (!this.isEnabled()) {
      throw new Error("ODK adapter disabled");
    }
    return {
      providerId: this.providerId,
      references: [],
      rawSummary: `ODK reference ${request.reference}`,
    };
  }

  async normalizeObservation(input: unknown): Promise<NormalizedObservation> {
    if (!openInfrastructureFlags.enabled) {
      throw new Error("Open infrastructure disabled");
    }
    const submission = parseOdkSubmission(input);
    return mapOdkSubmissionToObservation(submission);
  }
}

export function mapOdkSubmissionToObservation(
  submission: OdkSubmission,
): NormalizedObservation {
  const provenance = createUnverifiedProvenance({
    sourceProvider: "odk",
    sourceReference: submission.instanceId,
    contributorType: "COMMUNITY",
    attribution: "ODK field submission",
    capturedAt: submission.submittedAt,
  });

  const firstQuestField = Object.entries(submission.fields).find(([k]) =>
    k.startsWith("quest_"),
  );
  const questId = firstQuestField?.[0]?.replace(/^quest_/, "") ?? "unknown";
  const rawValue = firstQuestField?.[1];

  let value: boolean | "UNKNOWN" | string = "UNKNOWN";
  if (rawValue === "yes" || rawValue === true) value = true;
  else if (rawValue === "no" || rawValue === false) value = false;
  else if (rawValue === "unknown") value = "UNKNOWN";
  else if (typeof rawValue === "string") value = rawValue;

  return normalizedObservationSchema.parse({
    featureType: "odk_submission",
    attribute: questId,
    value,
    valueQualifier: "EXPERIENCED",
    geometry: submission.geopoint
      ? {
          type: "Point",
          coordinates: [submission.geopoint.lng, submission.geopoint.lat],
        }
      : undefined,
    observedAt: submission.submittedAt,
    provenance: {
      ...provenance,
      sourceType: "odk_submission",
      verificationState: "UNVERIFIED",
    },
    claimStrength: "observation",
  });
}

export const odkAdapter = new OdkAdapter();
