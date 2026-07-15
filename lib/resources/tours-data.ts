export type TourLoadLevel = "low" | "moderate" | "high";

export type TourAccessProfile =
  | "wheelchair"
  | "sensory-friendly"
  | "neurodivergent"
  | "family-carer"
  | "support-worker";

export type TourCategory =
  | "sensory-friendly"
  | "half-day"
  | "museum"
  | "outdoors"
  | "capital-city";

export type TourVerificationStatus =
  | "community-draft"
  | "locally-checked"
  | "needs-recheck";

export type TourStopFacilityNotes = {
  toilets: string[];
  parking: string[];
  dropOff: string[];
  quietSpaces: string[];
};

export type TourStopPhoto = {
  src: string;
  alt: string;
};

export type TourStop = {
  id: string;
  order: number;
  name: string;
  summary: string;
  latitude: number;
  longitude: number;
  estimatedMinutes: number;
  accessNotes: string[];
  sensoryNotes: string[];
  facilities: TourStopFacilityNotes;
  photos?: TourStopPhoto[];
};

export type TourSegment = {
  id: string;
  fromStopId: string;
  toStopId: string;
  summary: string;
  distanceMetres: number;
  transportMode: string;
  notes: string[];
};

export type TourVerification = {
  status: TourVerificationStatus;
  lastChecked: string;
  checkedByLabel: string;
  notes: string;
};

export type Tour = {
  id: string;
  slug: string;
  title: string;
  city: string;
  state: string;
  summary: string;
  durationMinutes: number;
  distanceMetres: number;
  audience: string[];
  accessProfiles: TourAccessProfile[];
  categories: TourCategory[];
  sensoryLoad: TourLoadLevel;
  mobilityLoad: TourLoadLevel;
  transportComplexity: TourLoadLevel;
  bestTimeOfDay: string;
  transportNotes: string[];
  safetyNotes: string[];
  fallbackPlan: string;
  routeSummary: string;
  routeNotes: string[];
  sensoryChecklist: string[];
  supportWorkerNotes: string[];
  featured: boolean;
  relatedArticleHref?: string;
  relatedGuideHref?: string;
  checklistDownloadHref?: string;
  stops: TourStop[];
  segments: TourSegment[];
  geojson: GeoJSON.FeatureCollection;
  verification: TourVerification;
  disclaimer: string;
};

export const TOUR_DISCLAIMER =
  "MapAble tours provide practical access information to help people plan outings. They are not a guarantee of access and are not legal, medical, transport or NDIS advice. Conditions can change. Check opening hours, bookings, transport availability and venue accessibility before travelling.";

const canberraMuseumStop: TourStop = {
  id: "nma",
  order: 1,
  name: "National Museum of Australia",
  summary:
    "Indoor culture stop with lifts, accessible toilets, Changing Places, quiet spaces and optional quiet hours.",
  latitude: -35.2931,
  longitude: 149.1169,
  estimatedMinutes: 90,
  accessNotes: [
    "Lifts between Lower Ground, Ground and Level 1.",
    "Accessible toilets on multiple levels; Changing Places on Lower Ground.",
    "Wheelchair and scooter loan may be available with advance booking.",
  ],
  sensoryNotes: [
    "Quiet hours are offered on the first Tuesday of the month — confirm on the museum calendar before travelling.",
    "Multi-faith / quiet room available for time out.",
    "Galleries may include screens, projections and sound — choose a short loop.",
  ],
  facilities: {
    toilets: [
      "Accessible toilets on Ground, Level 1 and Lower Ground.",
      "Changing Places facility on Lower Ground near the garden entry.",
    ],
    parking: [
      "Accessible parking bays near the main entrance for permit holders (confirm current rules).",
      "Route from parking to entrance may be weather-exposed.",
    ],
    dropOff: [
      "Drop-off close to the main entrance can reduce walking before you start.",
    ],
    quietSpaces: [
      "Multi-faith / quiet room for reflection or regulation.",
      "Gandel Atrium seating and outdoor cafe seating as quieter alternatives if the cafe is busy.",
    ],
  },
};

const canberraArboretumStop: TourStop = {
  id: "arboretum",
  order: 2,
  name: "National Arboretum Canberra",
  summary:
    "Outdoor calm and wide views near the Village Centre — only if accessible transport is confirmed first.",
  latitude: -35.2892,
  longitude: 149.0684,
  estimatedMinutes: 60,
  accessNotes: [
    "Sealed ramp (“The Cutting”) from the main car park to the Village Centre.",
    "Accessible toilets at the Visitors Centre.",
    "Free wheelchair hire may be available at the Village Centre — ask on arrival.",
  ],
  sensoryNotes: [
    "Outdoor paths can be bright, windy or hot — pack sunglasses, water and layers.",
    "Keep the visit short: Village Centre views and a short sealed path.",
    "Avoid long hillside walks unless energy and mobility are strong that day.",
  ],
  facilities: {
    toilets: [
      "Accessible toilets at the Visitors Centre.",
      "Additional accessible toilets exist elsewhere on site (confirm before walking farther).",
    ],
    parking: [
      "Designated mobility spaces at the main Visitors Centre car park.",
      "Permit holders are often not charged for parking — confirm current rules.",
    ],
    dropOff: [
      "Companion drop-off seating near the top of the sealed entrance ramp.",
    ],
    quietSpaces: [
      "Village Centre decks and short outdoor sits for a calmer reset.",
      "Shade and indoor seating can vary — plan an early exit if needed.",
    ],
  },
};

function buildCanberraTourGeoJson(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: canberraMuseumStop.id,
        properties: {
          stopId: canberraMuseumStop.id,
          name: canberraMuseumStop.name,
          order: canberraMuseumStop.order,
        },
        geometry: {
          type: "Point",
          coordinates: [
            canberraMuseumStop.longitude,
            canberraMuseumStop.latitude,
          ],
        },
      },
      {
        type: "Feature",
        id: canberraArboretumStop.id,
        properties: {
          stopId: canberraArboretumStop.id,
          name: canberraArboretumStop.name,
          order: canberraArboretumStop.order,
        },
        geometry: {
          type: "Point",
          coordinates: [
            canberraArboretumStop.longitude,
            canberraArboretumStop.latitude,
          ],
        },
      },
      {
        type: "Feature",
        id: "museum-to-arboretum",
        properties: {
          segmentId: "nma-to-arboretum",
          name: "Museum to Arboretum transfer",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [canberraMuseumStop.longitude, canberraMuseumStop.latitude],
            [canberraArboretumStop.longitude, canberraArboretumStop.latitude],
          ],
        },
      },
    ],
  };
}

export const tours: Tour[] = [
  {
    id: "tour-sensory-friendly-canberra-half-day",
    slug: "sensory-friendly-canberra-half-day",
    title: "Sensory-Friendly Canberra Half-Day",
    city: "Canberra",
    state: "ACT",
    summary:
      "A calm, low-rush half-day outing linking the National Museum of Australia and the National Arboretum — for visitors who need predictable steps, quiet options and accessible planning notes.",
    durationMinutes: 210,
    distanceMetres: 12000,
    audience: [
      "People with disability",
      "Neurodivergent visitors",
      "Families and carers",
      "Support coordinators",
    ],
    accessProfiles: [
      "sensory-friendly",
      "neurodivergent",
      "wheelchair",
      "family-carer",
      "support-worker",
    ],
    categories: ["sensory-friendly", "half-day", "museum", "outdoors", "capital-city"],
    sensoryLoad: "low",
    mobilityLoad: "moderate",
    transportComplexity: "moderate",
    bestTimeOfDay:
      "Quieter weekday mornings, or museum quiet hours when available (confirm first).",
    transportNotes: [
      "Start at the National Museum; plan the Arboretum only after transport is confirmed.",
      "The National Arboretum Canberra has no direct public bus or light rail — use car, taxi, rideshare or booked accessible transport.",
      "Allow buffer time between stops so transfers stay low-rush.",
      "If transport falls through, switch to the fallback plan instead of pushing on.",
    ],
    safetyNotes: [
      "Outdoor paths at the Arboretum can be exposed to sun, wind and heat.",
      "Museum parking-to-entrance routes may be weather-exposed.",
      "This tour is advisory planning support only — not emergency, legal, medical or NDIS advice.",
    ],
    fallbackPlan:
      "Museum-only half day with longer rests, or Arboretum-only short Village Centre visit, or one stop then home for recovery.",
    routeSummary:
      "Stop 1: National Museum of Australia (short indoor loop and rest). Optional transfer by car, taxi or rideshare to Stop 2: National Arboretum Canberra (Village Centre views and a short sealed path). Skip Stop 2 if transport is not confirmed.",
    routeNotes: [
      "Choose one short gallery loop at the museum rather than covering every level.",
      "Rest before leaving Stop 1.",
      "Confirm Arboretum transport before you leave the museum.",
      "Keep Arboretum time short and weather-aware.",
    ],
    sensoryChecklist: [
      "Noise support: headphones, earplugs or a preferred quiet soundtrack",
      "Light support: sunglasses, cap or hoodie for glare and bright galleries",
      "Regulation tools: fidgets, weighted lap item, communication cards, preferred snacks",
      "Body support: water, layers, medication you already use, phone charger",
      "Exit plan: who leads a leave, where you wait, and what “done for today” looks like",
      "Timing: buffer between stops; no pressure to finish both venues",
      "Quiet booking: check museum quiet hours or quieter mid-week mornings",
      "Crowd cues: agree a simple signal for “too much” without long explanations",
    ],
    supportWorkerNotes: [
      "Confirm consent and preferences before the outing (noise, touch, photo, food, exits).",
      "Share the plan as a short sequence: arrive → short look → rest → decide next.",
      "Book or confirm Arboretum transport before leaving Stop 1.",
      "Prefer “we can leave now” language over persuasion to stay.",
      "Treat this page as practical planning support only — not plan, funding or clinical advice.",
    ],
    featured: true,
    relatedArticleHref:
      "/resources/sensory-friendly-canberra-half-day-itinerary",
    relatedGuideHref: "/guides/act/canberra-accessibility-guide",
    checklistDownloadHref:
      "/resources/itineraries/MapAble_Sensory_Friendly_Canberra_Half_Day_Checklist.txt",
    stops: [canberraMuseumStop, canberraArboretumStop],
    segments: [
      {
        id: "nma-to-arboretum",
        fromStopId: "nma",
        toStopId: "arboretum",
        summary:
          "Transfer from the museum to the Arboretum by car, taxi, rideshare or booked accessible transport.",
        distanceMetres: 10000,
        transportMode: "private or booked accessible transport",
        notes: [
          "There is no direct public bus or light rail to the Arboretum.",
          "Do not add Stop 2 until this transfer is confirmed.",
        ],
      },
    ],
    geojson: buildCanberraTourGeoJson(),
    verification: {
      status: "community-draft",
      lastChecked: "2026-07-15",
      checkedByLabel: "MapAble community draft",
      notes:
        "Drafted from publicly available venue access notes. Re-check opening hours, quiet hours, toilets, parking and transport before travelling.",
    },
    disclaimer: TOUR_DISCLAIMER,
  },
];

export type TourFilterInput = {
  query?: string;
  city?: string | null;
  category?: TourCategory | null;
  accessProfile?: TourAccessProfile | null;
  featuredOnly?: boolean;
};

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((tour) => tour.slug === slug);
}

export function getFeaturedTours(): Tour[] {
  return tours.filter((tour) => tour.featured);
}

export function getTourCities(): string[] {
  return [...new Set(tours.map((tour) => tour.city))].sort();
}

export function getTourCategories(): TourCategory[] {
  return [...new Set(tours.flatMap((tour) => tour.categories))].sort();
}

export function getTourAccessProfiles(): TourAccessProfile[] {
  return [...new Set(tours.flatMap((tour) => tour.accessProfiles))].sort();
}

export function filterTours(input: TourFilterInput = {}): Tour[] {
  const query = input.query?.trim().toLowerCase() ?? "";
  return tours.filter((tour) => {
    if (input.featuredOnly && !tour.featured) return false;
    if (input.city && tour.city !== input.city) return false;
    if (input.category && !tour.categories.includes(input.category)) {
      return false;
    }
    if (
      input.accessProfile &&
      !tour.accessProfiles.includes(input.accessProfile)
    ) {
      return false;
    }
    if (!query) return true;
    const haystack = [
      tour.title,
      tour.summary,
      tour.city,
      tour.state,
      ...tour.audience,
      ...tour.categories,
      ...tour.accessProfiles,
      ...tour.stops.map((stop) => stop.name),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function formatTourDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${remainder} minutes`;
}

export function formatTourDistance(metres: number): string {
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(metres % 1000 === 0 ? 0 : 1)} km`;
}

export function formatLoadLevel(level: TourLoadLevel): string {
  switch (level) {
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "high":
      return "High";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function formatVerificationStatus(
  status: TourVerificationStatus,
): string {
  switch (status) {
    case "community-draft":
      return "Community draft";
    case "locally-checked":
      return "Locally checked";
    case "needs-recheck":
      return "Needs re-check";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatAccessProfile(profile: TourAccessProfile): string {
  switch (profile) {
    case "wheelchair":
      return "Wheelchair";
    case "sensory-friendly":
      return "Sensory-friendly";
    case "neurodivergent":
      return "Neurodivergent";
    case "family-carer":
      return "Family / carer";
    case "support-worker":
      return "Support worker";
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
  }
}

export function formatTourCategory(category: TourCategory): string {
  switch (category) {
    case "sensory-friendly":
      return "Sensory-friendly";
    case "half-day":
      return "Half day";
    case "museum":
      return "Museum";
    case "outdoors":
      return "Outdoors";
    case "capital-city":
      return "Capital city";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}
