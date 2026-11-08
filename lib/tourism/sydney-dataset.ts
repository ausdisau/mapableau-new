/**
 * Illustrative Sydney tourism dataset. Source pages were reviewed 27 October 2026.
 * This is not a venue inspection, AccessFit evaluation, or booking.
 */
import {
  evidenceToLegacy,
  type AccessEvidence,
  type TourismPlace,
} from "@/lib/tourism/types";

const reviewed = "27 October 2026";

const ILLUSTRATION_LICENCE =
  "MapAble prototype illustration (not a venue photograph; see public/tourism/LICENCE.md)";

function evidence(
  status: AccessEvidence["status"],
  summary: string,
  sourceName: string,
  sourceUrl: string,
  limitations: string[],
): AccessEvidence {
  return {
    status,
    summary,
    sourceName,
    sourceUrl,
    checkedOn: reviewed,
    limitations,
  };
}

function place(input: Omit<TourismPlace, "latitude" | "longitude" | "stepFree" | "accessibleToilet" | "caution" | "sourceName" | "sourceUrl" | "checkedOn">): TourismPlace {
  const stepFree = input.features.stepFree;
  const toilets = input.features.toilets;
  return {
    ...input,
    latitude: input.coords.latitude,
    longitude: input.coords.longitude,
    stepFree: { status: evidenceToLegacy(stepFree.status), detail: stepFree.summary },
    accessibleToilet: { status: evidenceToLegacy(toilets.status), detail: toilets.summary },
    caution: input.caveats[0] ?? "Confirm access on the day of travel.",
    sourceName: stepFree.sourceName,
    sourceUrl: stepFree.sourceUrl,
    checkedOn: reviewed,
  };
}

export const SYDNEY_TOURISM_PLACES: TourismPlace[] = [
  place({
    id: "mca",
    name: "Museum of Contemporary Art Australia",
    category: "Arts",
    neighbourhood: "The Rocks",
    address: "140 George Street, The Rocks NSW 2000",
    description: "Contemporary exhibitions on the harbour, with the city's waterfront close by.",
    coords: { latitude: -33.8599, longitude: 151.2092 },
    photos: [
      {
        src: "/tourism/mca.svg",
        alt: "Colour-field illustration standing in for the Museum of Contemporary Art, not a photograph of the building.",
        licence: ILLUSTRATION_LICENCE,
        credit: "MapAble Tourism prototype",
      },
    ],
    experienceMinutes: 105,
    recommendedDay: 1,
    features: {
      stepFree: evidence(
        "documented",
        "The official Sydney tourism listing identifies a step-free main entrance and lift access.",
        "Destination NSW / Sydney.com",
        "https://www.sydney.com/destinations/sydney/sydney-city/the-rocks/attractions/museum-contemporary-art-australia",
        ["Approach routes from Circular Quay or The Rocks are not verified here."],
      ),
      toilets: evidence(
        "documented",
        "The official Sydney tourism listing identifies an accessible public toilet.",
        "Destination NSW / Sydney.com",
        "https://www.sydney.com/destinations/sydney/sydney-city/the-rocks/attractions/museum-contemporary-art-australia",
        ["Measurements and operational status may differ on the day."],
      ),
      extras: [],
    },
    caveats: ["Confirm current exhibitions, ticket costs and access to any temporary installations."],
  }),
  place({
    id: "opera",
    name: "Sydney Opera House",
    category: "Landmarks",
    neighbourhood: "Bennelong Point",
    address: "Bennelong Point, Sydney NSW 2000",
    description: "Harbour architecture, views and optional performances or accessible experiences.",
    coords: { latitude: -33.8568, longitude: 151.2153 },
    photos: [
      {
        src: "/tourism/opera.svg",
        alt: "Colour-field illustration standing in for Sydney Opera House, not a photograph of the sails or foyers.",
        licence: ILLUSTRATION_LICENCE,
        credit: "MapAble Tourism prototype",
      },
    ],
    experienceMinutes: 100,
    recommendedDay: 1,
    features: {
      stepFree: evidence(
        "documented",
        "Lifts serve key foyers and specified access routes; theatre and seating access varies.",
        "Sydney Opera House — Mobility",
        "https://www.sydneyoperahouse.com/visit/accessibility/mobility",
        ["Venue, tour and performance access can differ. Do not treat one foyer as whole-site access."],
      ),
      toilets: evidence(
        "documented",
        "Accessible toilets at the Lower Concourse, Main Box Office and Western Foyers; Changing Places near the Box Office.",
        "Sydney Opera House — Mobility",
        "https://www.sydneyoperahouse.com/visit/accessibility/mobility",
        ["Which toilets are open depends on the event and time of day."],
      ),
      extras: [],
    },
    caveats: [
      "Do not assume all seating, tours, transport approaches or performances have the same access arrangements.",
    ],
  }),
  place({
    id: "australian-museum",
    name: "Australian Museum",
    category: "Museums",
    neighbourhood: "Sydney CBD",
    address: "1 William Street, Sydney NSW 2010",
    description: "Natural history, biodiversity and First Nations cultural exhibitions.",
    coords: { latitude: -33.8747, longitude: 151.2131 },
    photos: [
      {
        src: "/tourism/australian-museum.svg",
        alt: "Colour-field illustration standing in for the Australian Museum, not a photograph of the galleries.",
        licence: ILLUSTRATION_LICENCE,
        credit: "MapAble Tourism prototype",
      },
    ],
    experienceMinutes: 115,
    recommendedDay: 2,
    features: {
      stepFree: evidence(
        "documented",
        "The College Street main entrance has step-free entry, with lifts and ramps.",
        "Australian Museum — Accessibility and inclusion",
        "https://australian.museum/visit/accessibility-and-inclusion/",
        ["The street approach and special exhibitions may need separate confirmation."],
      ),
      toilets: evidence(
        "documented",
        "Wheelchair-accessible toilets on public gallery floors and Changing Places on Level 2.",
        "Australian Museum — Accessibility and inclusion",
        "https://australian.museum/visit/accessibility-and-inclusion/",
        ["Changing Places hours follow public gallery hours."],
      ),
      extras: [],
    },
    caveats: ["The route to the entrance and any special exhibition may need separate confirmation."],
  }),
  place({
    id: "state-library",
    name: "State Library of NSW",
    category: "Arts",
    neighbourhood: "Macquarie Street",
    address: "1 Shakespeare Place, Sydney NSW 2000",
    description: "Historic reading rooms, exhibitions and beautiful architecture.",
    coords: { latitude: -33.8663, longitude: 151.2127 },
    photos: [
      {
        src: "/tourism/state-library.svg",
        alt: "Colour-field illustration standing in for the State Library of NSW, not a photograph of the reading rooms.",
        licence: ILLUSTRATION_LICENCE,
        credit: "MapAble Tourism prototype",
      },
    ],
    experienceMinutes: 90,
    recommendedDay: 2,
    features: {
      stepFree: evidence(
        "documented",
        "The library documents lift access to its reading rooms and exhibition levels.",
        "State Library NSW — Access at the Library",
        "https://www.sl.nsw.gov.au/about-library/access-inclusion/access-library",
        ["Which entrance is suitable can change with events or lift outages."],
      ),
      toilets: evidence(
        "documented",
        "Accessible toilets on the Mitchell ground level and multiple Macquarie Street levels.",
        "State Library NSW — Access at the Library",
        "https://www.sl.nsw.gov.au/about-library/access-inclusion/access-library",
        ["Assisted entry may still be needed for some historic rooms."],
      ),
      extras: [],
    },
    caveats: [
      "Check which entrance is suitable, assisted entry needs, current exhibitions and any lift outages.",
    ],
  }),
  place({
    id: "sea-life",
    name: "SEA LIFE Sydney Aquarium",
    category: "Wildlife",
    neighbourhood: "Darling Harbour",
    address: "1–5 Wheat Road, Sydney NSW 2000",
    description: "Underwater habitats, marine animals and an aquarium experience along Darling Harbour.",
    coords: { latitude: -33.8694, longitude: 151.202 },
    photos: [
      {
        src: "/tourism/sea-life.svg",
        alt: "Colour-field illustration standing in for SEA LIFE Sydney Aquarium, not a photograph of the tanks.",
        licence: ILLUSTRATION_LICENCE,
        credit: "MapAble Tourism prototype",
      },
    ],
    experienceMinutes: 110,
    recommendedDay: 3,
    features: {
      stepFree: evidence(
        "requires_confirmation",
        "The operator describes wheelchair access throughout, but some ramps are steep, some turns narrow and electric scooters restricted in specified sections.",
        "SEA LIFE Sydney — Accessibility guide",
        "https://www.visitsealife.com/sydney/plan-your-day/before-you-visit/accessibility-guide/",
        ["Steep or narrow sections may not suit every wheelchair or scooter."],
      ),
      toilets: evidence(
        "documented",
        "Accessible toilets listed at the entrance, after the penguins and near the exit.",
        "SEA LIFE Sydney — Accessibility guide",
        "https://www.visitsealife.com/sydney/plan-your-day/before-you-visit/accessibility-guide/",
        ["Floating sections can move with the tide."],
      ),
      extras: [],
    },
    caveats: [
      "Some experiences require transfers or unaided boarding; the floating section can move with tides. Confirm personal access fit before booking.",
    ],
  }),
  place({
    id: "maritime",
    name: "Australian National Maritime Museum",
    category: "Museums",
    neighbourhood: "Darling Harbour",
    address: "2 Murray Street, Sydney NSW 2000",
    description: "Maritime history, waterfront exhibitions and harbour stories.",
    coords: { latitude: -33.869, longitude: 151.1988 },
    photos: [
      {
        src: "/tourism/maritime.svg",
        alt: "Colour-field illustration standing in for the Australian National Maritime Museum, not a photograph of the vessels.",
        licence: ILLUSTRATION_LICENCE,
        credit: "MapAble Tourism prototype",
      },
    ],
    experienceMinutes: 105,
    recommendedDay: 3,
    features: {
      stepFree: evidence(
        "documented",
        "The main museum has ramp access, with lifts or ramps to exhibitions and the outside viewing platform.",
        "Australian National Maritime Museum — Accessibility",
        "https://www.sea.museum/en/visit/plan-your-visit/accessibility",
        ["Historic vessels are not wheelchair-accessible."],
      ),
      toilets: evidence(
        "documented",
        "Accessible toilets in the ground-floor foyer and lower level.",
        "Australian National Maritime Museum — Accessibility",
        "https://www.sea.museum/en/visit/plan-your-visit/accessibility",
        ["Some bathroom doors are not automatic."],
      ),
      extras: [],
    },
    caveats: ["Historic vessels are not wheelchair-accessible. Some bathroom doors are not automatic."],
  }),
];

export function getSydneyPlace(id: string): TourismPlace | undefined {
  return SYDNEY_TOURISM_PLACES.find((item) => item.id === id);
}

export const SYDNEY_DAY_OUTLINES = [
  {
    title: "Harbour and The Rocks",
    attractionIds: ["mca", "opera"] as const,
    rest: {
      title: "Rest by Circular Quay",
      note: "Pause between MCA and the Opera House. Seating, toilets and shade still need checking on the day.",
    },
    transport: {
      mode: "Unverified harbour-side connection",
      note: "Unverified connection / not a calculated travel time. Confirm TfNSW lifts, kerb ramps and ferry access independently.",
    },
  },
  {
    title: "Culture and discovery",
    attractionIds: ["australian-museum", "state-library"] as const,
    rest: {
      title: "Rest near Hyde Park",
      note: "A slower break between the museum and the library. Park paths and toilets are not verified here.",
    },
    transport: {
      mode: "Unverified city connection",
      note: "Unverified connection / not a calculated travel time. College Street and Macquarie Street lifts can change.",
    },
  },
  {
    title: "Darling Harbour",
    attractionIds: ["sea-life", "maritime"] as const,
    rest: {
      title: "Rest on the waterfront promenade",
      note: "Leave time between the aquarium and the maritime museum. Promenade gradients still need a personal check.",
    },
    transport: {
      mode: "Unverified waterfront connection",
      note: "Unverified connection / not a calculated travel time. Do not treat this as a wheelchair-accessible journey.",
    },
  },
] as const;
