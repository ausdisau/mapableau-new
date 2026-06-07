import { decryptNdisNumber } from "@/lib/crypto/ndis";
import { mapBatchClaimToNdiaRequest } from "@/lib/ndia/shared/ndia-payload-mapper";
import { prisma } from "@/lib/prisma";

export async function buildBatchClaimPayload(batchId: string) {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: {
      providerOrg: true,
      lines: {
        where: { paymentRoute: "ndia_managed" },
        orderBy: { serviceStartDate: "asc" },
      },
    },
  });

  if (!batch || batch.paymentRoute !== "ndia_managed") {
    return { ok: false as const, error: "BATCH_NOT_NDIA_MANAGED" };
  }
  if (!batch.providerOrg.ndisRegistrationNumber) {
    return { ok: false as const, error: "PROVIDER_REGISTRATION_REQUIRED" };
  }

  const participantIds = [...new Set(batch.lines.map((l) => l.participantId))];
  const profiles = await prisma.participantProfile.findMany({
    where: { userId: { in: participantIds } },
    select: { userId: true, ndisParticipantNumberEnc: true },
  });
  const ndisByParticipant = new Map<string, string | null>();
  for (const profile of profiles) {
    ndisByParticipant.set(
      profile.userId,
      profile.ndisParticipantNumberEnc
        ? decryptNdisNumber(profile.ndisParticipantNumberEnc)
        : null
    );
  }

  const lines = batch.lines.map((line) => ({
    participantNumber: ndisByParticipant.get(line.participantId) ?? "",
    participantName: line.participantName,
    supportItemCode: line.supportItemCode,
    supportDescription: line.supportDescription,
    serviceStartDate: line.serviceStartDate.toISOString().slice(0, 10),
    serviceEndDate: line.serviceEndDate.toISOString().slice(0, 10),
    quantity: Number(line.quantity),
    unitPriceCents: line.unitPriceCents,
    totalAmountCents: line.totalAmountCents,
    claimReference: line.id,
  }));

  const requestBody = mapBatchClaimToNdiaRequest({
    batchReference: batch.batchReference ?? batch.id,
    providerRegistrationNumber: batch.providerOrg.ndisRegistrationNumber,
    organisationId: batch.providerOrgId,
    organisationName: batch.providerOrg.name,
    lines,
  });

  return {
    ok: true as const,
    requestBody,
    lineCount: lines.length,
    batchReference: batch.batchReference ?? batch.id,
  };
}
