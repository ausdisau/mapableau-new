import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

export async function linkAccountabilityPartner(params: {
  partnerName: string;
  jurisdiction?: string;
  scope: string;
}) {
  if (!phase12Config.federatedAccountabilityEnabled) {
    throw new Error("FEDERATED_ACCOUNTABILITY_DISABLED");
  }
  return prisma.federatedAccountabilityPartner.create({ data: params });
}

export async function listAccountabilityPartners() {
  return prisma.federatedAccountabilityPartner.findMany({
    where: { status: "active" },
    orderBy: { linkedAt: "desc" },
  });
}
