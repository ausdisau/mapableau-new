import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

export async function createResearchProject(params: {
  title: string;
  ethicsApprovalId?: string;
}) {
  if (!phase9Config.researchSafeRoomEnabled) {
    throw new Error("RESEARCH_SAFE_ROOM_DISABLED");
  }
  return prisma.researchSafeRoomProject.create({
    data: {
      title: params.title,
      ethicsApprovalId: params.ethicsApprovalId,
      syntheticDataOnly: true,
      accessPolicy: "restricted",
    },
  });
}

export async function listResearchProjects() {
  if (!phase9Config.researchSafeRoomEnabled) {
    return { disabled: true, projects: [] };
  }
  const projects = await prisma.researchSafeRoomProject.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { disabled: false, projects };
}

export async function attachSyntheticDataset(
  projectId: string,
  _schema: Record<string, unknown>
) {
  return prisma.researchSafeRoomProject.update({
    where: { id: projectId },
    data: {
      status: "active",
      accessPolicy: "synthetic_only",
    },
  });
}
