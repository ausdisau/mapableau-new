import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function searchListings(filters?: {
  suburb?: string;
  state?: string;
  feature?: string;
}) {
  if (!remainingSystemsConfig.housingModuleEnabled) {
    throw new Error("HOUSING_DISABLED");
  }

  const listings = await prisma.housingListing.findMany({
    where: {
      published: true,
      suburb: filters?.suburb,
      state: filters?.state,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (filters?.feature) {
    return listings.filter((l) => {
      const features = l.featuresJson as Record<string, boolean> | null;
      return features?.[filters.feature!];
    });
  }

  return listings;
}

export async function createHousingEnquiry(params: {
  listingId?: string;
  participantId: string;
  message?: string;
}) {
  return prisma.housingEnquiry.create({ data: params });
}
