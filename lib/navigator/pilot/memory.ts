import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { verifyPurposeConsent } from "@/lib/consent/purpose-consent";
import { prisma } from "@/lib/prisma";

export const governedMemoryCategorySchema = z.enum([
  "explicit_preference",
  "communication_requirement",
  "accessibility_need",
  "participant_exclusion",
  "consented_workflow_state",
]);

export const governedMemoryWriteSchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  actorUserId: z.string().min(1),
  category: governedMemoryCategorySchema,
  purpose: z.string().min(1),
  content: z.record(z.string(), z.unknown()),
  provenance: z.string().min(1),
  confidence: z.enum(["stated", "verified", "provisional"]),
  consentReceiptId: z.string().min(1),
  expiresAt: z.string().datetime(),
});

const FORBIDDEN_MEMORY_KEYS = [
  "clinical_conclusion",
  "inferred_capacity",
  "emotion",
  "deception",
  "risk_personality",
  "service_difficulty",
  "complexity_label",
];

export async function writeGovernedMemory(
  raw: z.infer<typeof governedMemoryWriteSchema>,
) {
  const input = governedMemoryWriteSchema.parse(raw);
  for (const key of Object.keys(input.content)) {
    if (FORBIDDEN_MEMORY_KEYS.some((blocked) => key.includes(blocked))) {
      throw new Error("GOVERNED_MEMORY_FORBIDDEN_CONTENT");
    }
  }

  const consent = await verifyPurposeConsent({
    participantId: input.participantId,
    tenantId: input.tenantId,
    purpose: input.purpose,
    action: "store_memory",
  });
  if (!consent.ok) {
    throw new Error(`CONSENT_${(consent.reason ?? "missing").toUpperCase()}`);
  }

  const row = await prisma.navigatorGovernedMemory.create({
    data: {
      tenantId: input.tenantId,
      participantId: input.participantId,
      category: input.category,
      purpose: input.purpose,
      contentJson: input.content as Prisma.InputJsonValue,
      provenance: input.provenance,
      confidence: input.confidence,
      createdByUserId: input.actorUserId,
      consentReceiptId: input.consentReceiptId,
      expiresAt: new Date(input.expiresAt),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "navigator.memory.written",
    entityType: "NavigatorGovernedMemory",
    entityId: row.id,
    metadata: { category: input.category, purpose: input.purpose },
  });

  return row;
}

export async function listActiveGovernedMemory(input: {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  now?: Date;
}) {
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  const now = input.now ?? new Date();
  return prisma.navigatorGovernedMemory.findMany({
    where: {
      tenantId: input.tenantId,
      participantId: input.participantId,
      deletedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function correctGovernedMemory(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  content: Record<string, unknown>;
}) {
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  const existing = await prisma.navigatorGovernedMemory.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
      deletedAt: null,
    },
  });
  if (!existing) throw new Error("MEMORY_NOT_FOUND");

  const updated = await prisma.navigatorGovernedMemory.update({
    where: { id: input.id },
    data: {
      contentJson: input.content as Prisma.InputJsonValue,
      reviewedAt: new Date(),
      confidence: "verified",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "navigator.memory.corrected",
    entityType: "NavigatorGovernedMemory",
    entityId: updated.id,
  });
  return updated;
}

export async function deleteGovernedMemory(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  const result = await prisma.navigatorGovernedMemory.updateMany({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });
  if (result.count !== 1) throw new Error("MEMORY_NOT_FOUND");
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "navigator.memory.deleted",
    entityType: "NavigatorGovernedMemory",
    entityId: input.id,
  });
}
