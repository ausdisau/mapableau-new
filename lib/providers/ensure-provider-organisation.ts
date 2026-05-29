import { prisma } from "@/lib/prisma";

export async function ensureProviderOrganisation(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });
  if (!provider) return null;
  if (provider.organisationId) {
    return provider.organisationId;
  }

  const org = await prisma.organisation.create({
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

  await prisma.provider.update({
    where: { id: providerId },
    data: { organisationId: org.id },
  });

  return org.id;
}
