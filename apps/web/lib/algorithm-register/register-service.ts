import { phase10Config } from "@/lib/config/phase10";
import { prisma } from "@/lib/prisma";

export async function publishAlgorithm(params: {
  name: string;
  purpose: string;
  version: string;
  owner?: string;
  fairnessNotes?: string;
}) {
  if (!phase10Config.publicAlgorithmRegisterEnabled) {
    throw new Error("ALGORITHM_REGISTER_DISABLED");
  }
  const draft = await prisma.registeredAlgorithm.create({
    data: { ...params, status: "draft" },
  });
  return prisma.registeredAlgorithm.update({
    where: { id: draft.id },
    data: { status: "published", publishedAt: new Date() },
  });
}

export async function listPublishedAlgorithms() {
  if (!phase10Config.publicAlgorithmRegisterEnabled) return [];
  return prisma.registeredAlgorithm.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      purpose: true,
      version: true,
      owner: true,
      fairnessNotes: true,
      publishedAt: true,
    },
  });
}
