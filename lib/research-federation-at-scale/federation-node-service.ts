import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

export async function registerFederationNode(params: {
  nodeName: string;
  institution?: string;
}) {
  if (!phase12Config.researchFederationAtScaleEnabled) {
    throw new Error("RESEARCH_FEDERATION_DISABLED");
  }
  return prisma.researchFederationNode.create({
    data: {
      nodeName: params.nodeName,
      institution: params.institution,
      syntheticOnly: true,
      status: "pending",
    },
  });
}

export async function approveFederationNode(nodeId: string) {
  return prisma.researchFederationNode.update({
    where: { id: nodeId },
    data: { status: "approved", approvedAt: new Date() },
  });
}

export async function listFederationNodes() {
  if (!phase12Config.researchFederationAtScaleEnabled) {
    return { disabled: true, nodes: [] };
  }
  const nodes = await prisma.researchFederationNode.findMany({
    where: { status: "approved" },
    orderBy: { approvedAt: "desc" },
    take: 30,
  });
  return { disabled: false, nodes };
}
