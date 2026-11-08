/**
 * Programme ↔ AURA / AI-platform boundary (current main).
 *
 * Facts on main:
 * - `lib/aura/` proposal/execution stack is absent
 * - AI-platform authority ceilings live in `lib/ai/platform/types/authority.ts`
 * - Companion exposes device-local Stop AURA (`apps/companion/src/aura/stop-aura.ts`)
 *
 * Programme adapters may read governed proposals only.
 * Models cannot publish, certify, approve, consent, refer, book, pay, or execute.
 * Executable actions require participant authority + deterministic service path + not stopped.
 *
 * Stage 1: process-local Stop remains the default. Durable tenant-scoped Stop is
 * written/read only when MAPABLE_ACS_DURABLE_STOP_ENABLED === "true".
 */

import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  isAcsDurableStopEnabled,
  isAcsExactConsentEnabled,
} from "@/lib/config/autonomy-care";
import { checkExactPurposeConsent } from "@/lib/consent/exact-purpose-check";
import { prisma } from "@/lib/prisma";
import { evaluateParticipantAuthority } from "@/lib/programmes/authority/participant-authority-service";
import {
  ForbiddenAuraAction,
  ProgrammeInvariantError,
  validateAuraProposalBoundary,
  type AuraProposalAction,
} from "@/lib/programmes/safety-invariants";
import type { ConsentScope } from "@/types/mapable";

/** Process-local stop flag for server-side programme gates (mirrors companion stop). */
let programmeAuraStopped = false;

export type ProgrammeAuraStopInput = {
  tenantId: string;
  participantId?: string | null;
  stoppedById: string;
  reason: string;
};

export async function stopProgrammeAura(
  input?: ProgrammeAuraStopInput,
): Promise<void> {
  if (isAcsDurableStopEnabled() && input) {
    await persistDurableProgrammeAuraStop(input);
    return;
  }

  programmeAuraStopped = true;
}

async function persistDurableProgrammeAuraStop(
  input: ProgrammeAuraStopInput,
): Promise<void> {
  const record = await prisma.autonomyStop.create({
    data: {
      tenantId: input.tenantId,
      participantId: input.participantId ?? null,
      stoppedById: input.stoppedById,
      reason: input.reason,
    },
  });

  await createAuditEvent({
    actorUserId: input.stoppedById,
    action: "autonomy.stop",
    entityType: "AutonomyStop",
    entityId: record.id,
    participantId: input.participantId ?? null,
    organisationId: input.tenantId,
    metadata: { reason: input.reason, durable: true },
  });
}

export function isProgrammeAuraStopped(): boolean {
  return programmeAuraStopped;
}

export async function isDurableProgrammeAuraStopped(query: {
  tenantId: string;
  participantId?: string | null;
}): Promise<boolean> {
  if (!isAcsDurableStopEnabled()) {
    return programmeAuraStopped;
  }

  const record = await prisma.autonomyStop.findFirst({
    where: {
      tenantId: query.tenantId,
      clearedAt: null,
      OR: query.participantId
        ? [{ participantId: null }, { participantId: query.participantId }]
        : [{ participantId: null }],
    },
    orderBy: { createdAt: "desc" },
  });

  return Boolean(record);
}

export function __resetProgrammeAuraStopForTests(): void {
  programmeAuraStopped = false;
}

export const PROGRAMME_AURA_CEILING: AuthorityCeiling =
  "SUGGEST_WITH_PARTICIPANT_APPROVAL";

export type ExecutableProgrammeAction =
  | "refer"
  | "book"
  | "pay"
  | "publish"
  | "certify"
  | "approve"
  | "consent"
  | "execute";

const DIRECT_WRITER_ACTIONS: ExecutableProgrammeAction[] = [
  "refer",
  "book",
  "pay",
  "publish",
  "certify",
  "approve",
  "consent",
  "execute",
];

export function assertProposalOnlyModelBoundary(input: {
  action: AuraProposalAction | ForbiddenAuraAction | string;
  textContent?: string;
  requiresParticipantApproval?: boolean;
}): void {
  validateAuraProposalBoundary(input);
}

/**
 * Refuse model-direct consequential writes. Execution must go through
 * deterministic services after participant authority checks.
 */
export function refuseDirectAuraWriter(
  action: ExecutableProgrammeAction | string,
): never {
  throw new ProgrammeInvariantError(
    "recommendation_not_determination",
    `Direct AURA/model writer refused for action: ${action}. Use deterministic programme services after participant authority.`,
  );
}

export async function assertProgrammeExecutionEligibility(input: {
  participantId: string;
  actorUserId: string;
  organisationId?: string | null;
  action: string;
  requiredFields?: string[];
  tenantId?: string;
  consentScope?: ConsentScope;
  purpose?: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
}): Promise<void> {
  if (programmeAuraStopped) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      "Programme execution blocked: AURA/programme stop is active",
    );
  }

  if (isAcsDurableStopEnabled()) {
    const tenantId = input.tenantId ?? input.organisationId ?? null;
    if (!tenantId) {
      throw new ProgrammeInvariantError(
        "explicit_authority_only",
        "Programme execution blocked: durable stop requires a tenant id",
      );
    }
    const durable = await isDurableProgrammeAuraStopped({
      tenantId,
      participantId: input.participantId,
    });
    if (durable) {
      throw new ProgrammeInvariantError(
        "explicit_authority_only",
        "Programme execution blocked: durable stop is active",
      );
    }
  }

  if (isAcsExactConsentEnabled()) {
    const purpose = (input.purpose ?? input.action).trim();
    if (!purpose || !input.consentScope) {
      throw new ProgrammeInvariantError(
        "explicit_authority_only",
        "Exact-purpose consent requires purpose and consent scope",
      );
    }
    const actingTenantId = input.tenantId ?? input.organisationId ?? null;
    if (!actingTenantId) {
      throw new ProgrammeInvariantError(
        "explicit_authority_only",
        "Exact-purpose consent requires a tenant id",
      );
    }
    if (
      input.grantedToOrganisationId &&
      input.grantedToOrganisationId !== actingTenantId
    ) {
      throw new ProgrammeInvariantError(
        "explicit_authority_only",
        "Cross-organisation programme access denied",
      );
    }
    const consent = await checkExactPurposeConsent({
      subjectUserId: input.participantId,
      scope: input.consentScope,
      purpose,
      grantedToUserId: input.grantedToUserId,
      grantedToOrganisationId: actingTenantId,
      requestedFields: input.requiredFields,
    });
    if (!consent.allowed) {
      throw new ProgrammeInvariantError(
        "explicit_authority_only",
        consent.reason,
      );
    }
  }

  if (
    DIRECT_WRITER_ACTIONS.includes(input.action as ExecutableProgrammeAction)
  ) {
    // Still require authority evaluation even for named executable verbs —
    // callers must not treat model output as authority.
  }

  const decision = await evaluateParticipantAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    purpose: input.action,
    requestedFields: input.requiredFields ?? [],
    requestedAction: input.action,
  });

  if (!decision.allowed) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      decision.reason ?? "Participant authority denied",
    );
  }
}

export function assertCrossTenantDenied(input: {
  actorOrganisationId: string | null | undefined;
  resourceOrganisationId: string | null | undefined;
}): void {
  if (
    input.actorOrganisationId &&
    input.resourceOrganisationId &&
    input.actorOrganisationId !== input.resourceOrganisationId
  ) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      "Cross-organisation programme access denied",
    );
  }
}

export function assertCrossParticipantDenied(input: {
  actorUserId: string;
  participantId: string;
  hasGrant: boolean;
}): void {
  if (input.actorUserId !== input.participantId && !input.hasGrant) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      "Cross-participant programme access denied without grant",
    );
  }
}
