import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/map/distance-service";

export type ProviderSearchParams = {
  serviceType?: string;
  postcode?: string;
  suburb?: string;
  radiusKm?: number;
  accessCapability?: string;
  telehealthAvailable?: boolean;
  acceptingNewParticipants?: boolean;
  verifiedOnly?: boolean;
  lat?: number;
  lng?: number;
};

export async function searchProviders(params: ProviderSearchParams) {
  const orgs = await prisma.organisation.findMany({
    where: {
      organisationType: { in: ["care_provider", "transport_provider"] },
      status: "active",
      ...(params.verifiedOnly
        ? { verificationStatus: "verified" }
        : {}),
      ...(params.serviceType
        ? {
            providerServices: {
              some: {
                OR: [
                  { serviceType: { contains: params.serviceType, mode: "insensitive" } },
                  { serviceName: { contains: params.serviceType, mode: "insensitive" } },
                ],
                ...(params.telehealthAvailable
                  ? { telehealthAvailable: true }
                  : {}),
                ...(params.acceptingNewParticipants === false
                  ? {}
                  : params.acceptingNewParticipants
                    ? { acceptingNewParticipants: true }
                    : {}),
              },
            },
          }
        : {}),
      ...(params.accessCapability
        ? {
            accessCapabilities: {
              some: {
                capability: {
                  contains: params.accessCapability,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(params.postcode
        ? {
            providerServiceRegions: {
              some: { postcode: params.postcode },
            },
          }
        : {}),
    },
    include: {
      organisationProfile: true,
      providerServices: true,
      accessCapabilities: true,
      providerServiceRegions: true,
    },
    take: 50,
  });

  const catalogue = await prisma.providerProfile.findMany({
    where: {
      isSearchVisible: true,
      ...(params.suburb
        ? { suburb: { contains: params.suburb, mode: "insensitive" } }
        : {}),
      ...(params.postcode ? { postcode: params.postcode } : {}),
    },
    take: 30,
  });

  const orgResults = orgs.map((o) => {
    const bookingEligible =
      o.verificationStatus === "verified" &&
      o.organisationProfile?.bookingEligibilityStatus === "eligible";
    return {
      source: "organisation" as const,
      id: o.id,
      name: o.organisationProfile?.tradingName ?? o.name,
      verificationStatus: o.verificationStatus,
      bookingEligible,
      listingStatus: o.organisationProfile?.listingStatus ?? "profile_incomplete",
      services: o.providerServices.map((s) => s.serviceName),
      accessCapabilities: o.accessCapabilities.map((c) => c.capability),
      serviceRegions: o.providerServiceRegions,
      distanceKm: null as number | null,
      statusLabel: bookingEligible
        ? "Accepting bookings"
        : o.verificationStatus === "verified"
          ? "Listed — booking pending verification"
          : "Profile listed — not yet booking eligible",
    };
  });

  const profileResults = catalogue.map((p) => ({
    source: "catalogue" as const,
    id: p.id,
    slug: p.slug,
    name: p.name,
    suburb: p.suburb,
    state: p.state,
    postcode: p.postcode,
    isVerified: p.isVerified,
    bookingEligible: false,
    statusLabel: p.isVerified
      ? "NDIS directory listing"
      : "Directory listing — confirm details with provider",
    distanceKm: null as number | null,
  }));

  let combined = [...orgResults, ...profileResults];

  if (params.lat != null && params.lng != null && params.postcode) {
    combined = combined.map((r) => ({
      ...r,
      distanceKm: haversineKm(params.lat!, params.lng!, -33.87, 151.21),
    }));
  }

  return combined;
}

export async function getProviderPublicDetail(id: string) {
  const org = await prisma.organisation.findUnique({
    where: { id },
    include: {
      organisationProfile: true,
      providerServices: true,
      accessCapabilities: true,
      providerServiceRegions: true,
    },
  });
  if (org) {
    const bookingEligible =
      org.verificationStatus === "verified" &&
      org.organisationProfile?.bookingEligibilityStatus === "eligible";
    return {
      type: "organisation" as const,
      id: org.id,
      name: org.organisationProfile?.tradingName ?? org.name,
      website: org.organisationProfile?.website ?? org.website,
      services: org.providerServices,
      accessCapabilities: org.accessCapabilities,
      regions: org.providerServiceRegions,
      bookingEligible,
      verificationStatus: org.verificationStatus,
      publicOnly: true,
    };
  }

  const profile = await prisma.providerProfile.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { services: true },
  });
  if (!profile || !profile.isSearchVisible) return null;

  return {
    type: "catalogue" as const,
    id: profile.id,
    slug: profile.slug,
    name: profile.name,
    suburb: profile.suburb,
    state: profile.state,
    postcode: profile.postcode,
    isVerified: profile.isVerified,
    services: profile.services,
    bookingEligible: false,
    statusLabel:
      "This listing is informational. Contact the provider to confirm availability.",
  };
}
