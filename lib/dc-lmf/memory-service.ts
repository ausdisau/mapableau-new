import {
  dclmfMemoryWriteSchema,
  dclmfSchemaVersion,
  type DclmfMemoryWrite,
  type DclmfProjectedMemory,
} from "@mapable/contracts";
import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isDcLmfEnabled } from "@/lib/config/dc-lmf";
import { prisma } from "@/lib/prisma";

import { assertPersistableMemory } from "./policy";

export class DcLmfError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DcLmfError";
    this.status = status;
  }
}

export function assertDcLmfEnabled(): void {
  if (!isDcLmfEnabled()) {
    throw new DcLmfError("DC-LMF is not enabled", 503);
  }
}

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value == null ? undefined : (value as Prisma.InputJsonValue);
}

function toProjectedMemory(row: {
  id: string;
  category: string;
  payloadJson: Prisma.JsonValue | null;
  payloadRef: string | null;
  sourceType: string;
  sourceRef: string | null;
  confidence: string;
  scope: string;
  dataClass: string;
  evidenceRefs: string[];
  observedAt: Date | null;
  validFrom: Date | null;
  validUntil: Date | null;
  supersedesId: string | null;
  status: string;
}): DclmfProjectedMemory {
  return {
    id: row.id,
    category: row.category as DclmfProjectedMemory["category"],
    payload: row.payloadJson,
    payloadRef: row.payloadRef,
    sourceType: row.sourceType as DclmfProjectedMemory["sourceType"],
    sourceRef: row.sourceRef,
    confidence: row.confidence as DclmfProjectedMemory["confidence"],
    scope: row.scope as DclmfProjectedMemory["scope"],
    dataClass: row.dataClass as DclmfProjectedMemory["dataClass"],
    evidenceRefs: row.evidenceRefs,
    observedAt: row.observedAt?.toISOString() ?? null,
    validFrom: row.validFrom?.toISOString() ?? null,
    validUntil: row.validUntil?.toISOString() ?? null,
    supersedesId: row.supersedesId,
    status: row.status as DclmfProjectedMemory["status"],
  };
}

export async function createMemoryRecord(
  input: DclmfMemoryWrite & { actorUserId: string },
): Promise<DclmfProjectedMemory> {
  assertDcLmfEnabled();
  const parsed = dclmfMemoryWriteSchema.parse(input);

  if (input.actorUserId !== parsed.participantId) {
    throw new DcLmfError("DC_LMF_SELF_WRITE_REQUIRED", 403);
  }

  assertPersistableMemory({
    dataClass: parsed.dataClass,
    payload: parsed.payload,
    payloadRef: parsed.payloadRef,
    sourceType: parsed.sourceType,
    scope: parsed.scope,
  });

  const confidence =
    parsed.sourceType === "self_report" || parsed.sourceType === "aac"
      ? "authoritative"
      : parsed.confidence;

  const row = await prisma.dclmfMemoryRecord.create({
    data: {
      participantId: parsed.participantId,
      category: parsed.category,
      payloadJson: asJson(parsed.payload),
      payloadRef: parsed.payloadRef ?? null,
      sourceType: parsed.sourceType,
      sourceRef: parsed.sourceRef ?? null,
      confidence,
      scope: parsed.scope,
      dataClass: parsed.dataClass,
      purposeTags: parsed.purposeTags,
      evidenceRefs: parsed.evidenceRefs,
      observedAt: parsed.observedAt ? new Date(parsed.observedAt) : null,
      validFrom: parsed.validFrom ? new Date(parsed.validFrom) : null,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
      consentRecordId: parsed.consentRecordId ?? null,
      createdById: input.actorUserId,
      status: "active",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "dc_lmf.memory.created",
    entityType: "DclmfMemoryRecord",
    entityId: row.id,
    participantId: parsed.participantId,
    metadata: {
      category: parsed.category,
      sourceType: parsed.sourceType,
      confidence,
      scope: parsed.scope,
      dataClass: parsed.dataClass,
      storesInlinePayload: parsed.payload != null,
      schemaVersion: dclmfSchemaVersion,
    },
  });

  return toProjectedMemory(row);
}

export async function listParticipantMemory(
  participantId: string,
  actorUserId: string,
): Promise<DclmfProjectedMemory[]> {
  assertDcLmfEnabled();
  if (participantId !== actorUserId) {
    throw new DcLmfError("DC_LMF_SELF_READ_REQUIRED", 403);
  }

  const rows = await prisma.dclmfMemoryRecord.findMany({
    where: { participantId },
    orderBy: [{ createdAt: "desc" }],
  });
  return rows.map(toProjectedMemory);
}

export async function correctMemoryRecord(input: {
  recordId: string;
  participantId: string;
  actorUserId: string;
  payload?: unknown;
  payloadRef?: string | null;
  sourceRef?: string | null;
  evidenceRefs?: string[];
  observedAt?: Date;
}): Promise<DclmfProjectedMemory> {
  assertDcLmfEnabled();
  if (input.participantId !== input.actorUserId) {
    throw new DcLmfError("DC_LMF_SELF_CORRECTION_REQUIRED", 403);
  }

  const prior = await prisma.dclmfMemoryRecord.findUnique({
    where: { id: input.recordId },
  });
  if (!prior || prior.participantId !== input.participantId) {
    throw new DcLmfError("DC_LMF_MEMORY_NOT_FOUND", 404);
  }
  if (prior.status === "revoked") {
    throw new DcLmfError("DC_LMF_MEMORY_REVOKED", 409);
  }

  assertPersistableMemory({
    dataClass: prior.dataClass as DclmfProjectedMemory["dataClass"],
    payload: input.payload,
    payloadRef: input.payloadRef ?? prior.payloadRef,
    sourceType: "self_report",
    scope: prior.scope,
  });

  const replacement = await prisma.$transaction(async (tx) => {
    await tx.dclmfMemoryRecord.update({
      where: { id: prior.id },
      data: { status: "superseded" },
    });

    const next = await tx.dclmfMemoryRecord.create({
      data: {
        participantId: prior.participantId,
        category: prior.category,
        payloadJson: asJson(input.payload),
        payloadRef: input.payloadRef ?? prior.payloadRef,
        sourceType: "self_report",
        sourceRef: input.sourceRef ?? "participant_correction",
        confidence: "authoritative",
        scope: prior.scope,
        dataClass: prior.dataClass,
        purposeTags: prior.purposeTags,
        evidenceRefs: input.evidenceRefs ?? prior.evidenceRefs,
        observedAt: input.observedAt ?? new Date(),
        validFrom: new Date(),
        validUntil: prior.validUntil,
        supersedesId: prior.id,
        status: "active",
        consentRecordId: prior.consentRecordId,
        createdById: input.actorUserId,
      },
    });

    await createAuditEvent({
      tx,
      actorUserId: input.actorUserId,
      action: "dc_lmf.memory.corrected",
      entityType: "DclmfMemoryRecord",
      entityId: next.id,
      participantId: input.participantId,
      metadata: {
        supersedesId: prior.id,
        category: prior.category,
        sourceType: "self_report",
      },
    });

    return next;
  });

  return toProjectedMemory(replacement);
}

export async function contestMemoryRecord(input: {
  recordId: string;
  participantId: string;
  actorUserId: string;
  reason?: string;
}): Promise<void> {
  assertDcLmfEnabled();
  if (input.participantId !== input.actorUserId) {
    throw new DcLmfError("DC_LMF_SELF_CONTEST_REQUIRED", 403);
  }

  const row = await prisma.dclmfMemoryRecord.findUnique({
    where: { id: input.recordId },
  });
  if (!row || row.participantId !== input.participantId) {
    throw new DcLmfError("DC_LMF_MEMORY_NOT_FOUND", 404);
  }

  await prisma.dclmfMemoryRecord.update({
    where: { id: row.id },
    data: {
      status: "contested",
      contestReason: input.reason?.trim().slice(0, 1000) || null,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "dc_lmf.memory.contested",
    entityType: "DclmfMemoryRecord",
    entityId: row.id,
    participantId: input.participantId,
    metadata: { category: row.category },
  });
}

export async function revokeMemoryRecord(input: {
  recordId: string;
  participantId: string;
  actorUserId: string;
}): Promise<void> {
  assertDcLmfEnabled();
  if (input.participantId !== input.actorUserId) {
    throw new DcLmfError("DC_LMF_SELF_REVOKE_REQUIRED", 403);
  }

  const row = await prisma.dclmfMemoryRecord.findUnique({
    where: { id: input.recordId },
  });
  if (!row || row.participantId !== input.participantId) {
    throw new DcLmfError("DC_LMF_MEMORY_NOT_FOUND", 404);
  }

  await prisma.dclmfMemoryRecord.update({
    where: { id: row.id },
    data: { status: "revoked" },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "dc_lmf.memory.revoked",
    entityType: "DclmfMemoryRecord",
    entityId: row.id,
    participantId: input.participantId,
    metadata: { category: row.category },
  });
}
