import { prisma } from "@/lib/prisma";

export async function ensureProviderOrganisation(providerId: string) {
  return prisma.$transaction(async (tx) => {
    const provider = await tx.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider) return null;
    if (provider.organisationId) {
      return provider.organisationId;
    }

    const org = await tx.organisation.create({
      data: {
        name: provider.name,
        abn: provider.abn,
        organisationType: "care_provider",
        contactEmail: provider.email,
        contactPhone: provider.phone,
        website: provider.website,
        serviceRegions: provider.serviceAreas,
        ndisRegistrationClaimed: provider.ndisRegistered,
        ndisRegistrationNumber: provider.ndisNumber,
        verificationStatus: "not_started",
        status: "active",
      },
    });

    const linked = await tx.provider.updateMany({
      where: { id: providerId, organisationId: null },
      data: { organisationId: org.id },
    });

    if (linked.count === 1) {
      return org.id;
    }

    const current = await tx.provider.findUnique({
      where: { id: providerId },
      select: { organisationId: true },
    });

    if (current?.organisationId && current.organisationId !== org.id) {
      const orphanMembers = await tx.organisationMember.count({
        where: { organisationId: org.id },
      });
      if (orphanMembers === 0) {
        await tx.organisation.delete({ where: { id: org.id } }).catch(() => {
          // Another writer may have linked the org; ignore delete races.
        });
      }
    }

    return current?.organisationId ?? org.id;
  });
}
