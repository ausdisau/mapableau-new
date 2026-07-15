import type { AccessPlaceFeatureType } from "@prisma/client";

import type { AccessSearchIntent } from "@/types/access-chat";

/** Map chat intent required features → Prisma AccessPlaceFeatureType. */
export const REQUIRED_FEATURE_TO_TYPES: Record<
  keyof AccessSearchIntent["requiredFeatures"],
  AccessPlaceFeatureType[]
> = {
  stepFreeAccess: ["step_free_entry", "ramp_access", "lift_access"],
  accessibleToilet: ["accessible_toilet", "changing_places"],
  accessibleParking: ["accessible_parking"],
  quietSpace: ["quiet_space"],
  hearingLoop: ["hearing_loop"],
  serviceAnimalFriendly: ["assistance_animals_welcome"],
  lowSensory: ["low_sensory_environment", "quiet_space"],
  accessibleDropoff: ["accessible_dropoff", "public_transport_nearby"],
};

export function requiredFeaturesToPrismaTypes(
  required: AccessSearchIntent["requiredFeatures"],
): AccessPlaceFeatureType[] {
  const out = new Set<AccessPlaceFeatureType>();
  for (const [key, enabled] of Object.entries(required ?? {})) {
    if (!enabled) continue;
    const types =
      REQUIRED_FEATURE_TO_TYPES[
        key as keyof AccessSearchIntent["requiredFeatures"]
      ];
    if (types) {
      for (const t of types) out.add(t);
    }
  }
  return [...out];
}

/** Soft category keyword hints for natural-language queries. */
export const CATEGORY_KEYWORD_HINTS: Record<string, string[]> = {
  cafe_restaurant: ["cafe", "café", "coffee", "restaurant", "eatery", "dining"],
  bar_pub: ["bar", "pub", "hotel"],
  shop: ["shop", "store", "retail"],
  shopping_centre: ["shopping centre", "mall", "shopping center"],
  park: ["park", "garden"],
  beach: ["beach"],
  library: ["library"],
  museum_gallery: ["museum", "gallery"],
  theatre_cinema: ["theatre", "theater", "cinema", "movies"],
  sports_venue: ["stadium", "sports", "gym"],
  community_centre: ["community centre", "community center"],
  health_service: ["clinic", "medical", "health", "gp", "hospital"],
  education: ["school", "university", "tafe", "college"],
  transport_station: ["station", "train", "metro", "ferry"],
  public_toilet: ["toilet", "bathroom", "restroom", "changing places"],
  accommodation: ["hotel", "motel", "accommodation"],
  tourism_attraction: ["attraction", "tourist"],
  government_service: ["council", "centrelink", "government"],
};

export function inferCategoriesFromQuery(query: string): string[] {
  const lower = query.toLowerCase();
  const found: string[] = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORD_HINTS)) {
    if (keywords.some((k) => lower.includes(k))) {
      found.push(category);
    }
  }
  return found;
}

export function inferRequiredFeaturesFromQuery(
  query: string,
): AccessSearchIntent["requiredFeatures"] {
  const lower = query.toLowerCase();
  const features: AccessSearchIntent["requiredFeatures"] = {};

  if (
    /wheelchair|step[- ]?free|powerchair|power chair|manual wheelchair|scooter accessible/.test(
      lower,
    )
  ) {
    features.stepFreeAccess = true;
  }
  if (/accessible toilet|accessible bathroom|changing places/.test(lower)) {
    features.accessibleToilet = true;
  }
  if (/accessible parking|disabled parking|accesible parking/.test(lower)) {
    features.accessibleParking = true;
  }
  if (/quiet|low sensory|sensory[- ]?friendly|low stim/.test(lower)) {
    features.quietSpace = true;
    features.lowSensory = true;
  }
  if (/hearing loop|audio loop|induction loop/.test(lower)) {
    features.hearingLoop = true;
  }
  if (/service animal|assistance animal|guide dog/.test(lower)) {
    features.serviceAnimalFriendly = true;
  }
  if (/drop[- ]?off|kerbside|curb/.test(lower)) {
    features.accessibleDropoff = true;
  }

  return features;
}
