import { phase10Config } from "@/lib/config/phase10";
import { prisma } from "@/lib/prisma";

export async function createFederatedAgreement(params: {
  partnerName: string;
  scope: string;
}) {
  if (!phase10Config.federatedResearchEnabled) {
    throw new Error("FEDERATED_RESEARCH_DISABLED");
  }
  return prisma.federatedResearchAgreement.create({
    data: {
      partnerName: params.partnerName,
      scope: params.scope,
      syntheticOnly: true,
      status: "draft",
    },
  });
}

export async function approveFederatedAgreement(agreementId: string) {
  return prisma.federatedResearchAgreement.update({
    where: { id: agreementId },
    data: { status: "approved", approvedAt: new Date() },
  });
}

export async function listFederatedAgreements() {
  if (!phase10Config.federatedResearchEnabled) {
    return { disabled: true, agreements: [] };
  }
  const agreements = await prisma.federatedResearchAgreement.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { disabled: false, agreements };
}
