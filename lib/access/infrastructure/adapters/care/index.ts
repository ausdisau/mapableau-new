/**
 * Care Access Infrastructure adapter (Phase 3).
 * Projects worker evidence → capabilities; evaluates passport requirements;
 * never auto-assigns. Not a second Care accessibility profile.
 */

import type { AccessCapability, AccessRequirement } from "@/lib/access/infrastructure/types";
import type { AccessProvenanceStatus } from "@/lib/access/infrastructure/domains";
import {
  evaluateCompatibility,
  summariseCompatibilityForParticipant,
} from "@/lib/access/infrastructure/engine";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure/flags";
import { getPassportForUser } from "@/lib/access/infrastructure/passport-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type CareAccessMatchCandidate = {
  workerId: string;
  workerDisplayName?: string;
  state: "compatible" | "compatible_with_adjustment" | "uncertain" | "incompatible";
  summary: string;
  missingCompetencies: string[];
  preferenceGaps: string[];
  decisionOwner: "PARTICIPANT";
  productionClaim: "none";
};

export type CareAccessAdapter = {
  readonly vertical: "care";
  suggestCompatibleWorkers(input: {
    passportId: string;
    careRequestId: string;
    excludeWorkerProfileIds?: string[];
  }): Promise<CareAccessMatchCandidate[]>;
};

export const CARE_ADAPTER_STATUS = {
  implemented: true,
  phase: 3,
  note: "Flag-gated Care access matching. Never auto-assigns. Participant remains decision owner.",
} as const;

/** Map competencyType strings → ontology concept ids (functional, not diagnosis). */
const COMPETENCY_TO_ONTOLOGY: Record<string, string> = {
  aac: "speech_communication.text_fallback",
  aac_familiarity: "speech_communication.text_fallback",
  auslan: "auslan_language.auslan_available",
  hoist: "equipment_at.wheelchair_charging",
  hoist_competency: "equipment_at.wheelchair_charging",
  manual_handling: "service_staff.adjustment_procedure",
  personal_care: "self_care_continence.accessible_toilet",
  personal_care_capability: "self_care_continence.accessible_toilet",
  sensory_support: "sensory_regulation.quiet_space",
  sensory_support_experience: "sensory_regulation.quiet_space",
  complex_support: "service_staff.high_intensity_competency",
  complex_support_competency: "service_staff.high_intensity_competency",
  high_intensity: "service_staff.high_intensity_competency",
};

const CARE_RELEVANT_DOMAINS = new Set([
  "speech_communication",
  "auslan_language",
  "cognition_learning",
  "executive_memory",
  "sensory_regulation",
  "psychosocial",
  "pain_fatigue_fluctuating",
  "self_care_continence",
  "equipment_at",
  "assistance_animals",
  "service_staff",
  "mobility_movement",
]);

export type WorkerCapabilityProjectionInput = {
  workerProfileId: string;
  highIntensityCompetencyVerified?: boolean;
  credentials?: Array<{
    id: string;
    credentialType: string;
    verificationStatus: string;
    expiresAt?: Date | string | null;
    revokedAt?: Date | string | null;
  }>;
  competencies?: Array<{
    id: string;
    competencyType: string;
    verificationStatus: string;
    expiresAt?: Date | string | null;
    revokedAt?: Date | string | null;
  }>;
  now?: Date;
};

function mapVerificationStatus(
  status: string,
  expiresAt?: Date | string | null,
  revokedAt?: Date | string | null,
  now: Date = new Date(),
): AccessProvenanceStatus {
  if (revokedAt) return "disputed";
  if (expiresAt && new Date(expiresAt) < now) return "outdated";
  const s = status.toLowerCase();
  if (s === "verified" || s === "human_verified") return "verified";
  if (s === "observed" || s === "assessed") return "observed";
  if (s === "reported" || s === "self_reported" || s === "venue_reported") {
    return "venue_reported";
  }
  // Pending / unverified must be unusable by the engine (unknown ≠ match/mismatch).
  if (s === "pending" || s === "unverified" || s === "draft") return "unknown";
  if (s === "disputed" || s === "revoked") return "disputed";
  return "unknown";
}

/** Project worker credentials/competencies into AccessCapability shapes. */
export function projectWorkerCapabilities(
  input: WorkerCapabilityProjectionInput,
): Array<
  AccessCapability & {
    observationStatus?: AccessProvenanceStatus;
    disputed?: boolean;
    reviewDue?: string | null;
  }
> {
  const now = input.now ?? new Date();
  const caps: Array<
    AccessCapability & {
      observationStatus?: AccessProvenanceStatus;
      disputed?: boolean;
      reviewDue?: string | null;
    }
  > = [];

  for (const cred of input.credentials ?? []) {
    const status = mapVerificationStatus(
      cred.verificationStatus,
      cred.expiresAt,
      cred.revokedAt,
      now,
    );
    caps.push({
      id: `cap-cred-${cred.id}`,
      entityType: "support_provider",
      entityId: input.workerProfileId,
      ontologyConceptId: `service_staff.credential_${cred.credentialType}`,
      attribute: `credential_${cred.credentialType}`,
      value: status === "verified" || status === "observed",
      evidenceObservationId: `obs-cred-${cred.id}`,
      status,
      observationStatus: status,
      disputed: status === "disputed",
      reviewDue: cred.expiresAt ? new Date(cred.expiresAt).toISOString() : null,
    });
  }

  for (const comp of input.competencies ?? []) {
    const status = mapVerificationStatus(
      comp.verificationStatus,
      comp.expiresAt,
      comp.revokedAt,
      now,
    );
    const key = comp.competencyType.toLowerCase().replace(/\s+/g, "_");
    const ontologyConceptId =
      COMPETENCY_TO_ONTOLOGY[key] ??
      COMPETENCY_TO_ONTOLOGY[comp.competencyType.toLowerCase()] ??
      `service_staff.competency_${key}`;
    caps.push({
      id: `cap-comp-${comp.id}`,
      entityType: "support_provider",
      entityId: input.workerProfileId,
      ontologyConceptId,
      attribute: key,
      value: status === "verified" || status === "observed",
      evidenceObservationId: `obs-comp-${comp.id}`,
      status,
      observationStatus: status,
      disputed: status === "disputed",
      reviewDue: comp.expiresAt ? new Date(comp.expiresAt).toISOString() : null,
    });
  }

  if (input.highIntensityCompetencyVerified != null) {
    caps.push({
      id: `cap-hi-${input.workerProfileId}`,
      entityType: "support_provider",
      entityId: input.workerProfileId,
      ontologyConceptId: "service_staff.high_intensity_competency",
      attribute: "high_intensity_competency",
      value: input.highIntensityCompetencyVerified,
      evidenceObservationId: `obs-hi-${input.workerProfileId}`,
      status: input.highIntensityCompetencyVerified ? "verified" : "unknown",
      observationStatus: input.highIntensityCompetencyVerified
        ? "verified"
        : "unknown",
    });
  }

  return caps;
}

const CARE_DISCLOSURE_SCOPES = new Set([
  "worker",
  "service_provider",
  "care_worker",
  "care_provider",
]);

/**
 * Compile Care-relevant requirements from passport.
 * Legacy summary/CareAccessNeed are soft preference signals only — never diagnosis.
 */
export function compileCareRequirements(params: {
  passportId: string;
  requirements: AccessRequirement[];
  accessRequirementsSummary?: string | null;
  legacyNeeds?: Array<{ id: string; category: string; summary: string }>;
}): AccessRequirement[] {
  const fromPassport = params.requirements.filter((r) => {
    if (CARE_RELEVANT_DOMAINS.has(r.domain)) return true;
    if (r.disclosureScopes.some((s) => CARE_DISCLOSURE_SCOPES.has(s))) return true;
    return false;
  });

  const legacy: AccessRequirement[] = [];
  for (const need of params.legacyNeeds ?? []) {
    legacy.push({
      id: `legacy-need-${need.id}`,
      passportId: params.passportId,
      ontologyConceptId: "service_staff.adjustment_procedure",
      domain: "service_staff",
      attribute: need.category || "legacy_need",
      value: true,
      criticality: "preference",
      contextScope: "activity_specific",
      timing: "permanent",
      assistance: "optional",
      disclosureScopes: ["worker"],
      userConfirmed: false,
      notes: need.summary.slice(0, 200),
    });
  }

  if (params.accessRequirementsSummary?.trim() && fromPassport.length === 0) {
    legacy.push({
      id: `legacy-summary-${params.passportId}`,
      passportId: params.passportId,
      ontologyConceptId: "service_staff.adjustment_procedure",
      domain: "service_staff",
      attribute: "access_summary",
      value: true,
      criticality: "preference",
      contextScope: "activity_specific",
      timing: "permanent",
      assistance: "optional",
      disclosureScopes: ["worker"],
      userConfirmed: false,
      notes: params.accessRequirementsSummary.slice(0, 200),
    });
  }

  return [...fromPassport, ...legacy];
}

export function assessWorkerCareCompatibility(params: {
  passportId: string;
  workerProfileId: string;
  workerDisplayName?: string;
  requirements: AccessRequirement[];
  capabilities: ReturnType<typeof projectWorkerCapabilities>;
}): CareAccessMatchCandidate {
  const result = evaluateCompatibility({
    passportId: params.passportId,
    requirements: params.requirements,
    entityType: "support_provider",
    entityId: params.workerProfileId,
    capabilities: params.capabilities,
    adjustments: [],
    contextTags: ["CARE"],
  });

  const missingCompetencies = result.findings
    .filter(
      (f) =>
        f.criticality === "required" &&
        (f.result === "mismatch" || f.result === "unknown"),
    )
    .map((f) => f.ontologyConceptId);

  const preferenceGaps = result.findings
    .filter(
      (f) =>
        f.criticality !== "required" &&
        (f.result === "mismatch" || f.result === "unknown"),
    )
    .map((f) => f.ontologyConceptId);

  return {
    workerId: params.workerProfileId,
    workerDisplayName: params.workerDisplayName,
    state: result.state,
    summary: summariseCompatibilityForParticipant(result),
    missingCompetencies,
    preferenceGaps,
    decisionOwner: "PARTICIPANT",
    productionClaim: "none",
  };
}

/** Live wiring guard — empty when Care matching flag is off. */
export async function suggestCompatibleWorkers(input: {
  careRequestId: string;
  excludeWorkerProfileIds?: string[];
  actorUserId?: string;
}): Promise<CareAccessMatchCandidate[]> {
  if (
    !accessInfrastructureFlags.enabled ||
    !accessInfrastructureFlags.careMatching
  ) {
    return [];
  }

  const request = await prisma.careRequest.findUnique({
    where: { id: input.careRequestId },
  });
  if (!request) return [];

  const passport = await getPassportForUser(request.participantId);
  if (!passport) return [];

  const legacyNeeds = await prisma.careAccessNeed.findMany({
    where: { participantId: request.participantId, active: true },
    take: 20,
  });

  const requirements = compileCareRequirements({
    passportId: passport.id,
    requirements: passport.requirements,
    accessRequirementsSummary: request.accessRequirementsSummary,
    legacyNeeds: legacyNeeds.map((n) => ({
      id: n.id,
      category: n.category,
      summary: n.summary,
    })),
  });

  const exclude = new Set(input.excludeWorkerProfileIds ?? []);
  const workers = await prisma.workerProfile.findMany({
    where: { active: true },
    include: {
      competencyEvidence: true,
      credentialEvidence: true,
    },
    take: 50,
  });

  const candidates: CareAccessMatchCandidate[] = [];
  for (const w of workers) {
    if (exclude.has(w.id)) continue;
    const capabilities = projectWorkerCapabilities({
      workerProfileId: w.id,
      highIntensityCompetencyVerified: w.highIntensityCompetencyVerified,
      credentials: w.credentialEvidence,
      competencies: w.competencyEvidence,
    });
    candidates.push(
      assessWorkerCareCompatibility({
        passportId: passport.id,
        workerProfileId: w.id,
        workerDisplayName: w.displayName,
        requirements,
        capabilities,
      }),
    );
  }

  // Prefer compatible / adjustment; keep uncertain visible; put mismatches last.
  const order = {
    compatible: 0,
    compatible_with_adjustment: 1,
    uncertain: 2,
    incompatible: 3,
  } as const;
  candidates.sort((a, b) => order[a.state] - order[b.state]);

  if (input.actorUserId) {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      action: "CARE_MATCH_PRESENTED",
      entityType: "CareAccessCompatibility",
      entityId: input.careRequestId,
      participantId: request.participantId,
      metadata: {
        candidateCount: candidates.length,
        compatibleCount: candidates.filter((c) => c.state === "compatible").length,
        incompatibleCount: candidates.filter((c) => c.state === "incompatible")
          .length,
      },
    });
  }

  return candidates;
}

/** Filter replacement pool to sufficiently compatible workers (not nearest/any). */
export function filterSufficientlyCompatibleWorkers<
  T extends { workerId: string },
>(
  candidates: T[],
  accessByWorkerId: Map<string, CareAccessMatchCandidate["state"]>,
  options?: { highComplexity?: boolean },
): { kept: T[]; escalateToOperations: boolean } {
  const kept = candidates.filter((c) => {
    const state = accessByWorkerId.get(c.workerId);
    if (!state) return !options?.highComplexity;
    return state === "compatible" || state === "compatible_with_adjustment";
  });
  const escalateToOperations =
    Boolean(options?.highComplexity) && kept.length === 0;
  return { kept, escalateToOperations };
}

export function isCareAccessMatchingEnabled(): boolean {
  return (
    accessInfrastructureFlags.enabled && accessInfrastructureFlags.careMatching
  );
}
