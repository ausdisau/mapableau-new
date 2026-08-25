import type {
  ContextDataClass,
  ContextQueryActor,
  MapAbleContextRecord,
  MissionContextQuery,
} from "./types";

const SENSITIVE_CLASSES: ReadonlySet<ContextDataClass> = new Set([
  "participant_pii",
  "health_sensitive",
  "financial",
  "safeguarding",
  "credentials_secrets",
  "legal_privileged",
]);

export function isSensitiveDataClass(dc: ContextDataClass): boolean {
  return SENSITIVE_CLASSES.has(dc);
}

export function recordRequiresConsent(record: MapAbleContextRecord): boolean {
  return record.dataClasses.some(isSensitiveDataClass) || record.consentScopes.length > 0;
}

/**
 * Consent / tenant / subject scope checks for queries.
 * Never returns complete participant records — only authorised mission-relevant slices.
 */
export function evaluateRecordAuthorisation(input: {
  record: MapAbleContextRecord;
  query: MissionContextQuery;
}): { authorised: boolean; reason: string | null } {
  const { record, query } = input;

  if (record.tenantId !== query.tenantId || record.tenantId !== query.actor.tenantId) {
    return { authorised: false, reason: "cross_tenant_denied" };
  }

  if (record.consentRevokedAt) {
    return { authorised: false, reason: "consent_revoked" };
  }

  const participantLinked = record.subjectRefs.some(
    (s) => s.kind === "participant" && s.id === query.participantId,
  );
  const missionLinked =
    (record.missionIds ?? []).includes(query.missionId) ||
    record.subjectRefs.some((s) => s.kind === "mission" && s.id === query.missionId);

  if (!participantLinked && !missionLinked) {
    return { authorised: false, reason: "subject_not_linked" };
  }

  if (query.actor.role === "participant" && query.actor.actorId !== query.participantId) {
    return { authorised: false, reason: "participant_actor_mismatch" };
  }

  if (recordRequiresConsent(record)) {
    const missing = record.consentScopes.filter(
      (scope) => !query.consentScopes.includes(scope),
    );
    if (missing.length > 0) {
      return { authorised: false, reason: `consent_missing:${missing.join(",")}` };
    }
  }

  return { authorised: true, reason: null };
}

export function actorMayPublishEvents(actor: ContextQueryActor): boolean {
  return actor.role === "system" || actor.role === "admin" || actor.role === "support_coordinator";
}

export function scopesOverlap(
  required: string[],
  granted: string[],
): boolean {
  if (required.length === 0) return true;
  return required.every((s) => granted.includes(s));
}
