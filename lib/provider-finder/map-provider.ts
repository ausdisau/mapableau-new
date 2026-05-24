import type { Provider } from "@/app/provider-finder/providers";

import type { ProviderProfile } from "./types";

export function mapLiveProviderToProfile(
  provider: Provider,
  distanceLabel?: string,
): ProviderProfile {
  const primary = provider.categories[0] ?? "Disability support";
  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    category: primary,
    suburb: provider.suburb,
    postcode: provider.postcode,
    distanceLabel:
      distanceLabel ??
      (provider.distanceKm > 0 && provider.suburb !== "Remote"
        ? `${provider.distanceKm.toFixed(1)} km`
        : "—"),
    rating: provider.rating,
    reviews: provider.reviewCount,
    responseTime:
      provider.reviewCount >= 100
        ? "Usually replies in 2 hours"
        : provider.reviewCount >= 30
          ? "Usually replies same day"
          : "Response time varies",
    funding: provider.registered ? "NDIS registered" : "Private / plan flexible",
    accessNeeds: provider.supports,
    description: `${provider.name} offers ${primary.toLowerCase()} and related supports.`,
    availability:
      provider.suburb === "Remote"
        ? "Telehealth slots open"
        : provider.registered
          ? "Available this week"
          : "Enquire for availability",
    featured: provider.rating >= 4.7 && provider.reviewCount >= 50,
    verified: provider.registered,
    coordinates:
      provider.latitude != null && provider.longitude != null
        ? { lat: provider.latitude, lng: provider.longitude }
        : undefined,
  };
}
