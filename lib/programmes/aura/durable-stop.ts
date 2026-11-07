/**
 * Durable Stop AURA — Postgres-backed, participant/org scoped (ACS Stage 1 / C3).
 * Redis is never used as stop or consent SoT.
 */

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { invalidatePassportProjectionCache } from "@/lib/passport";
import { prisma } from "@/lib/prisma";

/** In-process invalidation epoch bumped on stop/clear for cache busting. */
let protectedReadInvalidationEpoch = 0;

export function getProtectedReadInvalidationEpoch(): number {
  return protectedReadInvalidationEpoch;
}

function bumpInvalidationEpoch(): void {
  protectedReadInvalidationEpoch += 1;
}

/** Call after consent revoke so cached protected reads cannot reuse stale approval. */
export function invalidateProtectedReadsOnRevocation(): void {
  bumpInvalidationEpoch();
}

export async function activateProgrammeAuraStop(input: {
  participantId: string;
  organisationId?: string | null;
  stoppedById: string;
  reason?: string;
  correlationId?: string;
}): Promise<{ id: string }> {
  const row = await prisma.programmeAuraStop.create({
    data: {
      participantId: input.participantId,
      organisationId: input.organisationId ?? null,
      stoppedById: input.stoppedById,
      reason: input.reason,
      correlationId: input.correlationId,
    },
  });

  bumpInvalidationEpoch();
  invalidatePassportProjectionCache(input.participantId);

  await createAuditEvent({
    actorUserId: input.stoppedById,
    participantId: input.participantId,
    organisationId: input.organisationId ?? undefined,
    action: "programme.aura.stop",
    entityType: "ProgrammeAuraStop",
    entityId: row.id,
    metadata: {
      reason: input.reason ?? null,
      correlationId: row.correlationId,
    },
  });

  return { id: row.id };
}

export async function clearProgrammeAuraStop(input: {
  participantId: string;
  organisationId?: string | null;
  clearedById: string;
}): Promise<number> {
  const result = await prisma.programmeAuraStop.updateMany({
    where: {
      participantId: input.participantId,
      clearedAt: null,
      ...(input.organisationId
        ? { organisationId: input.organisationId }
        : {}),
    },
    data: {
      clearedAt: new Date(),
      clearedById: input.clearedById,
    },
  });

  if (result.count > 0) {
    bumpInvalidationEpoch();
    invalidatePassportProjectionCache(input.participantId);
    await createAuditEvent({
      actorUserId: input.clearedById,
      participantId: input.participantId,
      organisationId: input.organisationId ?? undefined,
      action: "programme.aura.stop.cleared",
      entityType: "ProgrammeAuraStop",
      entityId: input.participantId,
      metadata: { clearedCount: result.count },
    });
  }

  return result.count;
}

export async function isDurableProgrammeAuraStopped(input: {
  participantId: string;
  organisationId?: string | null;
}): Promise<boolean> {
  const active = await prisma.programmeAuraStop.findFirst({
    where: {
      participantId: input.participantId,
      clearedAt: null,
      OR: [
        { organisationId: null },
        ...(input.organisationId
          ? [{ organisationId: input.organisationId }]
          : []),
      ],
    },
    select: { id: true },
  });
  return Boolean(active);
}

/** Test helper — resets in-process invalidation epoch only. */
export function __resetProtectedReadInvalidationEpochForTests(): void {
  protectedReadInvalidationEpoch = 0;
}
