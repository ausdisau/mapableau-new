import { prisma } from "@/lib/prisma";

export async function listDataProcessingActivities(organisationId?: string) {
  return prisma.dataProcessingActivity.findMany({
    where: {
      active: true,
      organisationId: organisationId ?? undefined,
    },
    orderBy: { name: "asc" },
  });
}

export async function upsertDataProcessingActivity(params: {
  id?: string;
  organisationId?: string | null;
  name: string;
  purpose: string;
  lawfulBasis: Parameters<
    typeof prisma.dataProcessingActivity.create
  >[0]["data"]["lawfulBasis"];
  dataCategories?: string[];
  retentionPolicy?: string;
  systemsInvolved?: string[];
  ownerUserId?: string | null;
}) {
  if (params.id) {
    return prisma.dataProcessingActivity.update({
      where: { id: params.id },
      data: {
        name: params.name,
        purpose: params.purpose,
        lawfulBasis: params.lawfulBasis,
        dataCategories: params.dataCategories ?? [],
        retentionPolicy: params.retentionPolicy,
        systemsInvolved: params.systemsInvolved ?? [],
        ownerUserId: params.ownerUserId ?? null,
        organisationId: params.organisationId ?? null,
      },
    });
  }

  return prisma.dataProcessingActivity.create({
    data: {
      organisationId: params.organisationId ?? null,
      name: params.name,
      purpose: params.purpose,
      lawfulBasis: params.lawfulBasis,
      dataCategories: params.dataCategories ?? [],
      retentionPolicy: params.retentionPolicy,
      systemsInvolved: params.systemsInvolved ?? [],
      ownerUserId: params.ownerUserId ?? null,
    },
  });
}
