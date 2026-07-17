import { prisma } from "@/lib/prisma";

export async function createCommunityPanel(params: {
  bodyId?: string;
  name: string;
  tenantId?: string;
  status?: string;
}) {
  return prisma.communityPanel.create({
    data: {
      ...params,
      status: params.status ?? "active",
    },
  });
}

export async function createCommunityRecommendation(params: {
  panelId?: string;
  bodyId?: string;
  title: string;
  recommendation: string;
  bindingAuthority?: boolean;
  minorityView?: string;
}) {
  return prisma.communityRecommendation.create({
    data: {
      ...params,
      status: "draft",
      bindingAuthority: params.bindingAuthority ?? false,
    },
  });
}

export async function submitCommunityRecommendation(recommendationId: string) {
  return prisma.communityRecommendation.update({
    where: { id: recommendationId },
    data: { status: "submitted" },
  });
}

export async function respondToCommunityRecommendation(params: {
  recommendationId: string;
  responderId?: string;
  responseBody: string;
  respondedAt?: Date;
}) {
  const response = await prisma.governanceResponse.create({
    data: {
      recommendationId: params.recommendationId,
      responderId: params.responderId,
      responseBody: params.responseBody,
      respondedAt: params.respondedAt ?? new Date(),
    },
  });

  await prisma.communityRecommendation.update({
    where: { id: params.recommendationId },
    data: { status: "responded" },
  });

  return response;
}
