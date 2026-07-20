import type {
  PbsAccessActor,
  PbsAccessDecision,
  PbsAccessPurpose,
} from "./types";

export interface PbsGrantSnapshot {
  granteeUserId: string | null;
  granteeOrganisationId: string | null;
  status: "active" | "revoked" | "expired";
  expiresAt: Date | null;
  allowedActions: string[];
  purpose: string;
}

export interface PbsEngagementAccessContext {
  participantUserId: string;
  organisationId: string;
  assignedPractitionerUserId: string | null;
  implementingOrganisationId: string | null;
  grant?: PbsGrantSnapshot | null;
  breakGlassActive?: boolean;
  adminGovernanceOnly?: boolean;
}

function grantIsValid(grant: PbsGrantSnapshot | null | undefined): boolean {
  if (!grant) return false;
  if (grant.status !== "active") return false;
  if (grant.expiresAt && grant.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

/**
 * Assignment- and organisation-scoped access.
 * Does NOT reuse ambient case:read:any or canViewParticipantProfile.
 */
export function evaluatePbsAccess(
  actor: PbsAccessActor,
  ctx: PbsEngagementAccessContext,
  requested: {
    needsClinical: boolean;
    action: string;
  },
): PbsAccessDecision {
  if (actor.userId === ctx.participantUserId) {
    return {
      allowed: true,
      purpose: "participant_self",
      reason: "Participant is the primary decision-maker for their records",
      clinicalContentAllowed: true,
      fieldScope: "full",
    };
  }

  if (
    ctx.assignedPractitionerUserId === actor.userId &&
    actor.organisationIds.includes(ctx.organisationId)
  ) {
    return {
      allowed: true,
      purpose: "assigned_practitioner",
      reason: "Assigned practitioner within organisation",
      clinicalContentAllowed: true,
      fieldScope: "full",
    };
  }

  if (
    ctx.implementingOrganisationId &&
    actor.organisationIds.includes(ctx.implementingOrganisationId)
  ) {
    return {
      allowed: true,
      purpose: "implementing_provider",
      reason: "Implementing provider assignment — implementation fields only",
      clinicalContentAllowed: false,
      fieldScope: "implementation",
    };
  }

  if (
    grantIsValid(ctx.grant) &&
    (ctx.grant!.granteeUserId === actor.userId ||
      (ctx.grant!.granteeOrganisationId &&
        actor.organisationIds.includes(ctx.grant!.granteeOrganisationId)))
  ) {
    const actions = ctx.grant!.allowedActions;
    if (actions.length > 0 && !actions.includes(requested.action) && !actions.includes("*")) {
      return {
        allowed: false,
        purpose: "denied",
        reason: "ParticipantAuthorityGrant does not include requested action",
        clinicalContentAllowed: false,
        fieldScope: "none",
      };
    }
    return {
      allowed: true,
      purpose: "delegate_grant",
      reason: "Valid scoped ParticipantAuthorityGrant",
      clinicalContentAllowed: requested.needsClinical,
      fieldScope: requested.needsClinical ? "full" : "metadata",
    };
  }

  if (actor.isPlatformAdmin && ctx.breakGlassActive) {
    return {
      allowed: true,
      purpose: "break_glass",
      reason: "Break-glass session with access receipt required",
      clinicalContentAllowed: requested.needsClinical,
      fieldScope: requested.needsClinical ? "full" : "metadata",
    };
  }

  if (actor.isPlatformAdmin) {
    return {
      allowed: ctx.adminGovernanceOnly !== false && !requested.needsClinical,
      purpose: requested.needsClinical
        ? "denied"
        : ("admin_governance_metadata" satisfies PbsAccessPurpose),
      reason: requested.needsClinical
        ? "Ambient admin access does not expose clinical PBS content without break-glass"
        : "Admin governance metadata only",
      clinicalContentAllowed: false,
      fieldScope: requested.needsClinical ? "none" : "metadata",
    };
  }

  if (
    actor.organisationIds.length > 0 &&
    !actor.organisationIds.includes(ctx.organisationId) &&
    ctx.implementingOrganisationId &&
    !actor.organisationIds.includes(ctx.implementingOrganisationId)
  ) {
    return {
      allowed: false,
      purpose: "denied",
      reason: "Unrelated provider organisation denied",
      clinicalContentAllowed: false,
      fieldScope: "none",
    };
  }

  return {
    allowed: false,
    purpose: "denied",
    reason: "No assignment, grant, or break-glass authority for PBS record",
    clinicalContentAllowed: false,
    fieldScope: "none",
  };
}

export function assertPbsAccess(decision: PbsAccessDecision): void {
  if (!decision.allowed) {
    throw new Error(`PBS access denied: ${decision.reason}`);
  }
}

/** Implementation DTO — strips clinical formulation fields. */
export function toImplementingProviderView<T extends Record<string, unknown>>(
  record: T,
): Partial<T> {
  const allowedKeys = new Set([
    "id",
    "planId",
    "planVersionId",
    "status",
    "planType",
    "reviewDueAt",
    "strategySummaries",
    "implementationInstructions",
    "monitoringRequirements",
    "restrictivePracticeStatus",
    "authoringPractitionerDisplay",
    "consultationStatus",
    "aiAssisted",
    "unresolvedInformation",
  ]);
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (allowedKeys.has(key)) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}
