import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";

import { canAccessEvidencePack } from "./evidence-pack-access-policy";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function createEvidencePack(params: {
  participantId: string;
  packType: string;
  title: string;
  createdById?: string;
}) {
  await requireModuleEnabled("evidence_pack_builder_enabled");

  const pack = await prisma.evidencePack.create({
    data: {
      participantId: params.participantId,
      packType: params.packType as never,
      title: params.title,
      createdById: params.createdById,
      status: "draft",
    },
  });

  await prisma.evidencePackEvent.create({
    data: {
      packId: pack.id,
      eventType: "created",
      actorUserId: params.createdById,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "evidence_pack.created",
    entityType: "EvidencePack",
    entityId: pack.id,
    participantId: params.participantId,
  });

  return pack;
}

export async function listEvidencePacks(participantId: string) {
  return prisma.evidencePack.findMany({
    where: { participantId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEvidencePack(id: string, viewer: CurrentUser) {
  const pack = await prisma.evidencePack.findUnique({
    where: { id },
    include: { sections: true, items: true, exports: true },
  });
  if (!pack) return null;
  if (!(await canAccessEvidencePack(viewer, pack))) {
    throw new Error("EVIDENCE_FORBIDDEN");
  }
  return pack;
}
