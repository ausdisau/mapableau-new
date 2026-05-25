import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { canAccessEvidencePack } from "./evidence-pack-access-policy";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function exportEvidencePack(params: {
  packId: string;
  exportedById: string;
  format: string;
  viewer: CurrentUser;
}) {
  const pack = await prisma.evidencePack.findUnique({
    where: { id: params.packId },
    include: { items: true, sections: true },
  });
  if (!pack) throw new Error("PACK_NOT_FOUND");
  if (!(await canAccessEvidencePack(params.viewer, pack))) {
    throw new Error("EVIDENCE_FORBIDDEN");
  }

  const exportRecord = await prisma.evidencePackExport.create({
    data: {
      packId: params.packId,
      exportedById: params.exportedById,
      format: params.format,
    },
  });

  await prisma.evidencePack.update({
    where: { id: params.packId },
    data: { status: "exported" },
  });

  await prisma.evidencePackEvent.create({
    data: {
      packId: params.packId,
      eventType: "exported",
      actorUserId: params.exportedById,
    },
  });

  await createAuditEvent({
    actorUserId: params.exportedById,
    action: "evidence_pack.exported",
    entityType: "EvidencePack",
    entityId: params.packId,
    participantId: pack.participantId,
    metadata: { format: params.format },
  });

  return {
    exportRecord,
    placeholderUrl: `/api/evidence-packs/${params.packId}/export/download?id=${exportRecord.id}`,
    disclaimer:
      "This export supports your records. It is not legal advice or a funding guarantee.",
  };
}
