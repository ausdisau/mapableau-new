import { prisma } from "@/lib/prisma";

export async function createFederation(input: {
  name: string;
  type: "peak_body" | "government_partnership" | "research_consortium" | "cross_provider_cooperative" | "internal";
  description?: string;
}) {
  return prisma.tenantFederation.create({
    data: {
      name: input.name,
      type: input.type,
      description: input.description ?? null,
    },
  });
}

export async function addFederationMember(input: {
  federationId: string;
  organisationId: string;
  role?: "member" | "admin" | "observer" | "hub";
}) {
  return prisma.federationMembership.upsert({
    where: {
      federationId_organisationId: {
        federationId: input.federationId,
        organisationId: input.organisationId,
      },
    },
    create: {
      federationId: input.federationId,
      organisationId: input.organisationId,
      role: input.role ?? "member",
      status: "invited",
    },
    update: { role: input.role ?? "member" },
  });
}
