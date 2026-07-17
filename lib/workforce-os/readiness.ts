import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type EvidenceClass,
  type WorkerReadinessRequest,
  type WorkerReadinessResult,
} from "@/lib/connected-capability";

export interface WorkerCredentialInput {
  workerProfileId: string;
  organisationId: string;
  displayName?: string;
  workerScreeningStatus: string;
  wwccStatus?: string;
  firstAidStatus: string;
  verificationStatus?: string;
  highIntensityCompetencyVerified?: boolean;
  trustCredentials?: Array<{
    credentialType: string;
    status: string;
    expiresAt?: Date | string | null;
  }>;
  learningEvidence?: Array<{
    competencyKey: string;
    evidenceClasses: EvidenceClass[];
  }>;
  participantIntroductionCompleted?: boolean;
  requiredCompetencies?: string[];
  isSynthetic?: boolean;
}

function mapCredentialStatus(
  status: string,
  expiresAt?: Date | string | null
): {
  status: WorkerReadinessResult["checks"][number]["status"];
  evidenceClass: EvidenceClass;
} {
  if (expiresAt) {
    const exp =
      typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return { status: "expired", evidenceClass: "expired" };
    }
  }
  switch (status) {
    case "verified":
      return { status: "verified", evidenceClass: "authoritative_source" };
    case "current":
      return { status: "current", evidenceClass: "organisation_confirmed" };
    case "pending":
    case "pending_review":
    case "not_provided":
      return { status: "unknown", evidenceClass: "unknown" };
    case "expired":
    case "revoked":
    case "rejected":
    case "suspended":
      return { status: "expired", evidenceClass: "expired" };
    default:
      return { status: "unknown", evidenceClass: "unknown" };
  }
}

/**
 * Deterministic worker readiness projection.
 * AI may explain; only this function calculates readiness.
 * No quality score. No automatic assignment.
 */
export function computeWorkerReadiness(
  worker: WorkerCredentialInput,
  request?: Partial<WorkerReadinessRequest>
): WorkerReadinessResult {
  const required = request?.requiredCompetencies ?? worker.requiredCompetencies ?? [];
  const introRequired =
    request?.participantIntroductionRequired ??
    worker.participantIntroductionCompleted !== undefined;

  const checks: WorkerReadinessResult["checks"] = [];

  const screening = mapCredentialStatus(worker.workerScreeningStatus);
  checks.push({
    key: "worker_screening",
    label: "Worker screening",
    status: screening.status === "verified" ? "verified" : screening.status,
    evidenceClass: screening.evidenceClass,
  });

  const firstAid = mapCredentialStatus(worker.firstAidStatus);
  checks.push({
    key: "first_aid",
    label: "First aid",
    status:
      firstAid.status === "verified" || firstAid.status === "current"
        ? "current"
        : firstAid.status,
    evidenceClass: firstAid.evidenceClass,
  });

  for (const cred of worker.trustCredentials ?? []) {
    const mapped = mapCredentialStatus(cred.status, cred.expiresAt);
    checks.push({
      key: `trust:${cred.credentialType}`,
      label: cred.credentialType,
      status: mapped.status,
      evidenceClass: mapped.evidenceClass,
      detail: cred.expiresAt
        ? `Expires ${typeof cred.expiresAt === "string" ? cred.expiresAt : cred.expiresAt.toISOString()}`
        : undefined,
    });
  }

  for (const competency of required) {
    const evidence = worker.learningEvidence?.find(
      (e) => e.competencyKey === competency
    );
    const classes = evidence?.evidenceClasses ?? [];
    const hasCompletion = classes.includes("course_completion");
    const hasObservation =
      classes.includes("supervisor_observed") ||
      classes.includes("professional_verified");
    const hasAssessment = classes.includes("assessment_passed");

    if (hasCompletion && hasAssessment && hasObservation) {
      checks.push({
        key: `competency:${competency}`,
        label: competency,
        status: "present",
        evidenceClass: "professional_verified",
        detail:
          "Learning completion, assessment, and supervised observation present.",
      });
    } else if (hasCompletion && !hasObservation) {
      checks.push({
        key: `competency:${competency}`,
        label: competency,
        status: "unknown",
        evidenceClass: "course_completion",
        detail:
          "Academy completion alone does not prove current practical competency.",
      });
    } else {
      checks.push({
        key: `competency:${competency}`,
        label: competency,
        status: "unknown",
        evidenceClass: "unknown",
        detail: "Required competency evidence missing.",
      });
    }
  }

  const introDone = worker.participantIntroductionCompleted === true;
  if (introRequired || worker.participantIntroductionCompleted !== undefined) {
    checks.push({
      key: "participant_introduction",
      label: "Participant introduction",
      status: introDone ? "present" : "not_completed",
      evidenceClass: introDone ? "participant_confirmed" : "unknown",
    });
  }

  const blockers: string[] = [];
  for (const check of checks) {
    if (
      check.status === "unknown" ||
      check.status === "expired" ||
      check.status === "missing" ||
      check.status === "not_completed"
    ) {
      blockers.push(
        check.detail ?? `${check.label} remains unresolved (${check.status}).`
      );
    }
  }

  const assignmentReadiness = blockers.length === 0 ? "ready" : "blocked";
  const status: WorkerReadinessResult["status"] =
    assignmentReadiness === "ready"
      ? "ready"
      : checks.some((c) => c.evidenceClass === "course_completion" && c.status === "unknown")
        ? "human_review_required"
        : "blocked";

  return {
    workerProfileId: worker.workerProfileId,
    organisationId: worker.organisationId,
    status,
    checks,
    blockers,
    assignmentReadiness,
    qualityScore: null,
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    computedAt: new Date().toISOString(),
    isSynthetic: worker.isSynthetic,
  };
}

export function listExpiringCredentials(
  worker: WorkerCredentialInput,
  withinDays = 30
): Array<{ credentialType: string; expiresAt: string; daysRemaining: number }> {
  const now = Date.now();
  const horizon = withinDays * 24 * 60 * 60 * 1000;
  const result: Array<{
    credentialType: string;
    expiresAt: string;
    daysRemaining: number;
  }> = [];

  for (const cred of worker.trustCredentials ?? []) {
    if (!cred.expiresAt) continue;
    const exp =
      typeof cred.expiresAt === "string"
        ? new Date(cred.expiresAt)
        : cred.expiresAt;
    const delta = exp.getTime() - now;
    if (delta >= 0 && delta <= horizon) {
      result.push({
        credentialType: cred.credentialType,
        expiresAt: exp.toISOString(),
        daysRemaining: Math.ceil(delta / (24 * 60 * 60 * 1000)),
      });
    }
  }
  return result;
}
