import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { prisma } from "@/lib/prisma";

/**
 * Distinguishes account ownership from scoped delegated authority.
 * Never treat a support person's authentication as unrestricted participant consent.
 */
export async function assertDelegatedOrSelfAuthority(input: {
  participantId: string;
  actorUserId: string;
  tenantId?: string;
  domain: string;
  action: string;
  fields?: string[];
  consentScopes?: string[];
  now?: Date;
}): Promise<{
  ok: boolean;
  mode: "self" | "delegate" | "denied";
  reason?: string;
}> {
  if (input.participantId === input.actorUserId) {
    return { ok: true, mode: "self" };
  }

  const allowed = await hasParticipantAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    tenantId: input.tenantId,
    domain: input.domain,
    action: input.action,
    consentScopes: input.consentScopes,
    now: input.now,
  });

  if (!allowed) {
    return {
      ok: false,
      mode: "denied",
      reason: "DELEGATION_INVALID_OR_INSUFFICIENT",
    };
  }

  if (input.fields && input.fields.length > 0) {
    const now = input.now ?? new Date();
    const grant = await prisma.participantAuthorityGrant.findFirst({
      where: {
        participantId: input.participantId,
        delegateId: input.actorUserId,
        domain: input.domain,
        actions: { has: input.action },
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });
    if (!grant) {
      return {
        ok: false,
        mode: "denied",
        reason: "DELEGATION_INVALID_OR_INSUFFICIENT",
      };
    }
    const allowedFields = grant.allowedFields ?? [];
    if (allowedFields.length > 0) {
      const set = new Set(allowedFields);
      if (input.fields.some((field) => !set.has(field))) {
        return {
          ok: false,
          mode: "denied",
          reason: "DELEGATION_FIELD_SCOPE_EXCEEDED",
        };
      }
    }
  }

  return { ok: true, mode: "delegate" };
}
