import { createHash, randomUUID } from "crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface QsAuditAppendInput {
  organisationId?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  correlationId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashPayload(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return sha256(JSON.stringify(value));
}

function hashOptionalPii(value?: string | null): string | undefined {
  if (!value) return undefined;
  return sha256(value);
}

/**
 * Append-only immutable audit event with hash chaining per organisation scope.
 * There is intentionally no update/delete API for these rows.
 */
export async function appendQsImmutableAuditEvent(
  input: QsAuditAppendInput
): Promise<{ id: string; eventHash: string; correlationId: string }> {
  const correlationId = input.correlationId ?? randomUUID();
  const occurredAt = new Date();

  const previous = await prisma.qsImmutableAuditEvent.findFirst({
    where: {
      organisationId: input.organisationId ?? null,
    },
    orderBy: { occurredAt: "desc" },
    select: { eventHash: true },
  });

  const beforeHash = hashPayload(input.before);
  const afterHash = hashPayload(input.after);
  const previousHash = previous?.eventHash ?? null;

  const material = [
    input.organisationId ?? "",
    input.actorId ?? "",
    input.action,
    input.resourceType,
    input.resourceId,
    occurredAt.toISOString(),
    beforeHash ?? "",
    afterHash ?? "",
    previousHash ?? "",
    correlationId,
  ].join("|");

  const eventHash = sha256(material);

  const created = await prisma.qsImmutableAuditEvent.create({
    data: {
      organisationId: input.organisationId ?? null,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      occurredAt,
      ipHash: hashOptionalPii(input.ipAddress),
      userAgentHash: hashOptionalPii(input.userAgent),
      reason: input.reason ?? null,
      beforeHash: beforeHash ?? null,
      afterHash: afterHash ?? null,
      eventHash,
      previousHash,
      correlationId,
      metadataJson: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    select: { id: true, eventHash: true, correlationId: true },
  });

  return created;
}

export async function listQsAuditEvents(params: {
  organisationId?: string | null;
  resourceType?: string;
  resourceId?: string;
  limit?: number;
}) {
  return prisma.qsImmutableAuditEvent.findMany({
    where: {
      ...(params.organisationId
        ? { organisationId: params.organisationId }
        : {}),
      ...(params.resourceType ? { resourceType: params.resourceType } : {}),
      ...(params.resourceId ? { resourceId: params.resourceId } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: params.limit ?? 50,
  });
}
