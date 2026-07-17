import { prisma } from "@/lib/prisma";

/**
 * Correlation guard. Given a claimed pairwise subject ID and an
 * external-entity key, return whether the pair is a legitimate MapAble
 * mint. Verifiers colluding with each other cannot forge these because
 * they lack the pairwise secret; MapAble is the only party that can
 * resolve them back to a participant.
 */
export async function resolvePairwiseToParticipantId(
  pairwiseSub: string
): Promise<string | null> {
  const row = await prisma.pairwiseSubjectIdentifier.findUnique({
    where: { pairwiseSub },
    select: { participantId: true },
  });
  return row?.participantId ?? null;
}

export async function listPairwiseForParticipant(participantId: string) {
  return prisma.pairwiseSubjectIdentifier.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
  });
}
