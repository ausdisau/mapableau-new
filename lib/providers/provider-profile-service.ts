import { mapOutletsToProviders } from "@/app/provider-finder/outletToProvider";
import type { Provider } from "@/app/provider-finder/providers";
import { fetchProviderOutlets } from "@/lib/provider-outlets";
import { prisma } from "@/lib/prisma";
import type {
  ProviderVerificationLabel,
  PublicProviderProfile,
  PublicProviderReview,
} from "@/types/provider-profile";
import { VERIFICATION_DISPLAY } from "@/types/provider-profile";

function labelForOutlet(provider: Provider): ProviderVerificationLabel {
  if (provider.registered) return "ndis_registered";
  return "community_listed";
}

function labelForRegistered(ndisRegistered: boolean): ProviderVerificationLabel {
  if (ndisRegistered) return "ndis_registered";
  return "unverified";
}

function fromDirectoryProvider(provider: Provider): PublicProviderProfile {
  const verificationLabel = labelForOutlet(provider);
  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    description: undefined,
    verificationLabel,
    verificationDisplay: VERIFICATION_DISPLAY[verificationLabel],
    ndisRegistered: provider.registered,
    services: provider.categories.map((name, i) => ({
      id: `cat-${i}`,
      name,
    })),
    regions: [
      {
        id: "primary",
        label:
          provider.suburb === "Remote"
            ? "Telehealth (Australia-wide)"
            : `${provider.suburb}, ${provider.state} ${provider.postcode}`.trim(),
        suburb: provider.suburb !== "Remote" ? provider.suburb : undefined,
        state: provider.state,
        postcode: provider.postcode !== "0000" ? provider.postcode : undefined,
      },
    ],
    accessFeatures: provider.supports.filter((s) => s !== "In-person"),
    languages: [],
    contact: {
      phone: provider.phone,
      email: provider.email,
      website: provider.website,
      abn: provider.abn,
    },
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    reviews: [],
    supports: provider.supports,
    categories: provider.categories,
    openingHours: provider.openingHours,
    latitude: provider.latitude,
    longitude: provider.longitude,
    outletKey: provider.outletKey,
    source: "directory",
    showUnverifiedWarning: verificationLabel !== "ndis_registered",
    canRequestSupport: true,
  };
}

async function findDirectoryProvider(
  identifier: string,
): Promise<Provider | null> {
  const outlets = await fetchProviderOutlets({
    next: { revalidate: 3600 },
  } as RequestInit);
  const providers = mapOutletsToProviders(outlets);
  const decoded = decodeURIComponent(identifier);
  const lower = decoded.toLowerCase();

  return (
    providers.find(
      (p) =>
        p.id === decoded ||
        p.slug.toLowerCase() === lower ||
        p.outletKey === decoded,
    ) ?? null
  );
}

function reviewsFromAggregate(
  rating: number,
  reviewCount: number,
): PublicProviderReview[] {
  if (reviewCount <= 0 || rating <= 0) return [];
  return [];
}

export async function getPublicProviderProfile(
  identifier: string,
): Promise<PublicProviderProfile | null> {
  const decoded = decodeURIComponent(identifier).trim();
  if (!decoded) return null;

  const registered = await prisma.provider.findUnique({
    where: { id: decoded },
    include: {
      services: true,
      locations: true,
      workers: {
        include: {
          worker: { include: { languages: true } },
        },
      },
    },
  });

  if (registered) {
    const languages = [
      ...new Set(
        registered.workers.flatMap((wp) =>
          wp.worker.languages.map((l) => l.name),
        ),
      ),
    ];
    const verificationLabel = labelForRegistered(registered.ndisRegistered);
    return {
      id: registered.id,
      slug: registered.id,
      name: registered.name,
      description: registered.description ?? undefined,
      verificationLabel,
      verificationDisplay: VERIFICATION_DISPLAY[verificationLabel],
      ndisRegistered: registered.ndisRegistered,
      ndisNumber: registered.ndisNumber ?? undefined,
      services: registered.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? undefined,
      })),
      regions: registered.locations.map((loc) => ({
        id: loc.id,
        label: [loc.address, loc.city, loc.state, loc.postcode]
          .filter(Boolean)
          .join(", "),
        suburb: loc.city ?? undefined,
        state: loc.state ?? undefined,
        postcode: loc.postcode ?? undefined,
      })),
      accessFeatures: registered.specialisations,
      languages,
      contact: {
        phone: registered.phone ?? undefined,
        email: registered.email ?? undefined,
        website: registered.website ?? undefined,
        abn: registered.abn ?? undefined,
      },
      rating: registered.rating ?? 0,
      reviewCount: registered.reviewCount,
      reviews: reviewsFromAggregate(
        registered.rating ?? 0,
        registered.reviewCount,
      ),
      supports: ["In-person"],
      categories: registered.specialisations,
      outletKey: undefined,
      source: "registered",
      showUnverifiedWarning: verificationLabel !== "ndis_registered",
      canRequestSupport: true,
    };
  }

  const profile = await prisma.providerProfile.findFirst({
    where: {
      OR: [{ id: decoded }, { slug: decoded }],
      isSearchVisible: true,
    },
    include: { services: true },
  });

  if (profile) {
    const verificationLabel: ProviderVerificationLabel = profile.isVerified
      ? "mapable_reviewed"
      : "community_listed";
    return {
      id: profile.id,
      slug: profile.slug ?? profile.id,
      name: profile.name,
      verificationLabel,
      verificationDisplay: VERIFICATION_DISPLAY[verificationLabel],
      ndisRegistered: false,
      services: profile.services.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      regions: [
        {
          id: "primary",
          label: [profile.suburb, profile.state, profile.postcode]
            .filter(Boolean)
            .join(", "),
          suburb: profile.suburb ?? undefined,
          state: profile.state ?? undefined,
          postcode: profile.postcode ?? undefined,
        },
      ].filter((r) => r.label),
      accessFeatures: [],
      languages: [],
      contact: {},
      rating: 0,
      reviewCount: 0,
      reviews: [],
      supports: ["In-person"],
      categories: profile.services.map((s) => s.name),
      source: "profile",
      showUnverifiedWarning: !profile.isVerified,
      canRequestSupport: true,
    };
  }

  const claimed = await prisma.claimedProvider.findFirst({
    where: {
      OR: [{ slug: decoded }, { id: decoded }, { outletKey: decoded }],
    },
  });

  if (claimed) {
    const verificationLabel: ProviderVerificationLabel = claimed.verifiedAt
      ? "mapable_reviewed"
      : "documents_submitted";
    return {
      id: claimed.id,
      slug: claimed.slug,
      name: claimed.name,
      description: claimed.description ?? undefined,
      verificationLabel,
      verificationDisplay: VERIFICATION_DISPLAY[verificationLabel],
      ndisRegistered: false,
      services: claimed.categories.map((name, i) => ({
        id: `claimed-${i}`,
        name,
      })),
      regions: [
        {
          id: "primary",
          label: [claimed.suburb, claimed.state, claimed.postcode]
            .filter(Boolean)
            .join(", "),
          suburb: claimed.suburb ?? undefined,
          state: claimed.state ?? undefined,
          postcode: claimed.postcode ?? undefined,
        },
      ].filter((r) => r.label),
      accessFeatures: [],
      languages: [],
      contact: {
        phone: claimed.phone ?? undefined,
        email: claimed.email ?? undefined,
        website: claimed.website ?? undefined,
      },
      rating: 0,
      reviewCount: 0,
      reviews: [],
      supports: ["In-person"],
      categories: claimed.categories,
      openingHours: claimed.openingHours ?? undefined,
      outletKey: claimed.outletKey ?? undefined,
      source: "claimed",
      showUnverifiedWarning: !claimed.verifiedAt,
      canRequestSupport: true,
    };
  }

  const directory = await findDirectoryProvider(decoded);
  if (directory) {
    return fromDirectoryProvider(directory);
  }

  return null;
}

/** Strip fields that must not appear in public API responses. */
export function toPublicProviderApiPayload(
  profile: PublicProviderProfile,
): PublicProviderProfile {
  return profile;
}
