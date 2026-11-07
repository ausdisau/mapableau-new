import { prisma } from "@/lib/prisma";
import { emitProgrammeAuditEvent } from "@/lib/programmes/audit";
import { assertDisclosureScope } from "@/lib/programmes/safety-invariants";

export interface CreateAuthorityGrantInput {
  participantId: string;
  granteeUserId?: string;
  granteeOrganisationId?: string;
  purpose: string;
  allowedFields: string[];
  allowedActions?: string[];
  consentRecordId?: string;
  expiresAt?: Date;
  createdById: string;
  correlationId: string;
}

export async function createParticipantAuthorityGrant(
  input: CreateAuthorityGrantInput,
) {
  assertDisclosureScope({
    recipientId: input.granteeUserId ?? input.granteeOrganisationId,
    purpose: input.purpose,
    fields: input.allowedFields,
    expiry: input.expiresAt ?? null,
  });

  // Dual-write dialect fields so Core `hasParticipantAuthority` (delegateId +
  // actions) and programme `evaluateParticipantAuthority` (granteeUserId +
  // allowedActions) see the same grant — ACS Stage 1 / C2 facade.
  const allowedActions = input.allowedActions ?? [];
  const grant = await prisma.participantAuthorityGrant.create({
    data: {
      participantId: input.participantId,
      granteeUserId: input.granteeUserId,
      granteeOrganisationId: input.granteeOrganisationId,
      delegateId: input.granteeUserId ?? undefined,
      domain: "programmes",
      actions: allowedActions,
      purpose: input.purpose,
      allowedFields: input.allowedFields,
      allowedActions,
      consentRecordId: input.consentRecordId,
      expiresAt: input.expiresAt,
      createdById: input.createdById,
      correlationId: input.correlationId,
      status: "active",
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.createdById,
    action: "authority.granted",
    entityType: "ParticipantAuthorityGrant",
    entityId: grant.id,
    participantId: input.participantId,
    metadata: {
      purpose: input.purpose,
      allowedFields: input.allowedFields,
    },
  });

  return grant;
}

export async function revokeParticipantAuthorityGrant(input: {
  grantId: string;
  participantId: string;
  revokedById: string;
  correlationId: string;
}) {
  const existing = await prisma.participantAuthorityGrant.findFirst({
    where: {
      id: input.grantId,
      participantId: input.participantId,
      status: "active",
    },
  });

  if (!existing) {
    throw new Error("Authority grant not found or not active");
  }

  const grant = await prisma.participantAuthorityGrant.update({
    where: { id: input.grantId },
    data: {
      status: "revoked",
      revokedById: input.revokedById,
      revokedAt: new Date(),
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.revokedById,
    action: "authority.revoked",
    entityType: "ParticipantAuthorityGrant",
    entityId: grant.id,
    participantId: input.participantId,
  });

  return grant;
}

export async function evaluateParticipantAuthority(input: {
  participantId: string;
  actorUserId: string;
  purpose: string;
  requestedFields: string[];
  requestedAction?: string;
}) {
  if (input.actorUserId === input.participantId) {
    return {
      allowed: true,
      allowedFields: input.requestedFields,
      reason: "Participant is primary decision-maker",
    };
  }

  const now = new Date();
  const grants = await prisma.participantAuthorityGrant.findMany({
    where: {
      participantId: input.participantId,
      status: "active",
      OR: [
        { granteeUserId: input.actorUserId },
        { delegateId: input.actorUserId },
      ],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
  });

  for (const grant of grants) {
    const purposeOk =
      !grant.purpose ||
      grant.purpose === input.purpose ||
      grant.purpose.startsWith(`${input.purpose}.`) ||
      input.purpose.startsWith(`${grant.purpose}.`);
    if (!purposeOk) {
      continue;
    }

    const fieldAllowlist = grant.allowedFields ?? [];
    const allowedFields =
      fieldAllowlist.length === 0
        ? input.requestedFields
        : input.requestedFields.filter((field) =>
            fieldAllowlist.includes(field),
          );

    if (input.requestedAction) {
      const actionAllow =
        grant.allowedActions.length > 0
          ? grant.allowedActions
          : grant.actions;
      if (
        actionAllow.length > 0 &&
        !actionAllow.includes(input.requestedAction) &&
        !actionAllow.includes("*")
      ) {
        continue;
      }
    }

    if (allowedFields.length === input.requestedFields.length) {
      return {
        allowed: true,
        allowedFields,
        grantId: grant.id,
      };
    }
  }

  return {
    allowed: false,
    allowedFields: [],
    reason: "No matching authority grant for requested scope",
  };
}

export const participantAuthorityPolicy = {
  evaluateAuthority: evaluateParticipantAuthority,
};
