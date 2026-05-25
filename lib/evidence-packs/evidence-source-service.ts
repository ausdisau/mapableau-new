import { prisma } from "@/lib/prisma";

import { canAccessEvidencePack } from "./evidence-pack-access-policy";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function addEvidenceItem(params: {
  packId: string;
  sourceType: string;
  sourceId?: string;
  label: string;
  sectionId?: string;
  snapshot?: Record<string, unknown>;
  viewer: CurrentUser;
}) {
  const pack = await prisma.evidencePack.findUnique({ where: { id: params.packId } });
  if (!pack) throw new Error("PACK_NOT_FOUND");
  if (!(await canAccessEvidencePack(params.viewer, pack))) {
    throw new Error("EVIDENCE_FORBIDDEN");
  }

  if (params.sourceType === "participant_goals") {
    const goal = await prisma.outcomeGoal.findFirst({
      where: { id: params.sourceId, participantId: pack.participantId },
    });
    if (!goal) throw new Error("RESTRICTED_EVIDENCE");
  }

  return prisma.evidencePackItem.create({
    data: {
      packId: params.packId,
      sectionId: params.sectionId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      label: params.label,
      snapshot: params.snapshot as never,
    },
  });
}
