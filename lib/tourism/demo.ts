/**
 * MapAble Tourism — explicitly illustrative Sydney pilot content.
 * Source links were reviewed 27 October 2026. This is not a venue inspection,
 * an AccessFit evaluation, an accessible-route certification, or a booking.
 */
export type TourismNeed = "step-free" | "accessible-toilet";
export type EvidenceStatus = "documented" | "requires-confirmation" | "unknown";

export type AccessFeature = {
  status: EvidenceStatus;
  detail: string;
};

export type TourismPlace = {
  id: string;
  name: string;
  category: "Arts" | "Landmarks" | "Museums" | "Wildlife";
  neighbourhood: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  experienceMinutes: number;
  recommendedDay: number;
  stepFree: AccessFeature;
  accessibleToilet: AccessFeature;
  caution: string;
  sourceName: string;
  sourceUrl: string;
  checkedOn: string;
};

export type TourismTripDay = {
  day: number;
  title: string;
  stopIds: string[];
};

export type TourismTrip = {
  id: "sydney-demo";
  destination: "Sydney";
  days: TourismTripDay[];
  createdFrom: "local-demo";
};

export const TOURISM_NEEDS: { id: TourismNeed; label: string; hint: string }[] = [
  {
    id: "step-free",
    label: "Step-free access",
    hint: "Entries and internal paths; approach routes must be checked separately.",
  },
  {
    id: "accessible-toilet",
    label: "Accessible toilets",
    hint: "Published availability; measurements and operational status may differ.",
  },
];

const reviewed = "27 October 2026";

export const SYDNEY_TOURISM_PLACES: TourismPlace[] = [
  {
    id: "mca",
    name: "Museum of Contemporary Art Australia",
    category: "Arts",
    neighbourhood: "The Rocks",
    address: "140 George Street, The Rocks NSW 2000",
    description: "Contemporary exhibitions on the harbour, with the city's waterfront close by.",
    latitude: -33.8599,
    longitude: 151.2092,
    experienceMinutes: 105,
    recommendedDay: 1,
    stepFree: { status: "documented", detail: "The official Sydney tourism listing identifies a step-free main entrance and lift access." },
    accessibleToilet: { status: "documented", detail: "The official Sydney tourism listing identifies an accessible public toilet." },
    caution: "Confirm current exhibitions, ticket costs and access to any temporary installations.",
    sourceName: "Destination NSW / Sydney.com",
    sourceUrl: "https://www.sydney.com/destinations/sydney/sydney-city/the-rocks/attractions/museum-contemporary-art-australia",
    checkedOn: reviewed,
  },
  {
    id: "opera",
    name: "Sydney Opera House",
    category: "Landmarks",
    neighbourhood: "Bennelong Point",
    address: "Bennelong Point, Sydney NSW 2000",
    description: "Harbour architecture, views and optional performances or accessible experiences.",
    latitude: -33.8568,
    longitude: 151.2153,
    experienceMinutes: 100,
    recommendedDay: 1,
    stepFree: { status: "documented", detail: "Lifts serve key foyers and specified access routes; theatre and seating access varies." },
    accessibleToilet: { status: "documented", detail: "Accessible toilets at the Lower Concourse, Main Box Office and Western Foyers; Changing Places near the Box Office." },
    caution: "Do not assume all seating, tours, transport approaches or performances have the same access arrangements.",
    sourceName: "Sydney Opera House — Mobility",
    sourceUrl: "https://www.sydneyoperahouse.com/visit/accessibility/mobility",
    checkedOn: reviewed,
  },
  {
    id: "australian-museum",
    name: "Australian Museum",
    category: "Museums",
    neighbourhood: "Sydney CBD",
    address: "1 William Street, Sydney NSW 2010",
    description: "Natural history, biodiversity and First Nations cultural exhibitions.",
    latitude: -33.8747,
    longitude: 151.2131,
    experienceMinutes: 115,
    recommendedDay: 2,
    stepFree: { status: "documented", detail: "The College Street main entrance has step-free entry, with lifts and ramps." },
    accessibleToilet: { status: "documented", detail: "Wheelchair-accessible toilets on public gallery floors and Changing Places on Level 2." },
    caution: "The route to the entrance and any special exhibition may need separate confirmation.",
    sourceName: "Australian Museum — Accessibility and inclusion",
    sourceUrl: "https://australian.museum/visit/accessibility-and-inclusion/",
    checkedOn: reviewed,
  },
  {
    id: "state-library",
    name: "State Library of NSW",
    category: "Arts",
    neighbourhood: "Macquarie Street",
    address: "1 Shakespeare Place, Sydney NSW 2000",
    description: "Historic reading rooms, exhibitions and beautiful architecture.",
    latitude: -33.8663,
    longitude: 151.2127,
    experienceMinutes: 90,
    recommendedDay: 2,
    stepFree: { status: "documented", detail: "The library documents lift access to its reading rooms and exhibition levels." },
    accessibleToilet: { status: "documented", detail: "Accessible toilets on the Mitchell ground level and multiple Macquarie Street levels." },
    caution: "Check which entrance is suitable, assisted entry needs, current exhibitions and any lift outages.",
    sourceName: "State Library NSW — Access at the Library",
    sourceUrl: "https://www.sl.nsw.gov.au/about-library/access-inclusion/access-library",
    checkedOn: reviewed,
  },
  {
    id: "sea-life",
    name: "SEA LIFE Sydney Aquarium",
    category: "Wildlife",
    neighbourhood: "Darling Harbour",
    address: "1–5 Wheat Road, Sydney NSW 2000",
    description: "Underwater habitats, marine animals and an aquarium experience along Darling Harbour.",
    latitude: -33.8694,
    longitude: 151.2020,
    experienceMinutes: 110,
    recommendedDay: 3,
    stepFree: { status: "requires-confirmation", detail: "The operator describes wheelchair access throughout, but some ramps are steep, some turns narrow and electric scooters restricted in specified sections." },
    accessibleToilet: { status: "documented", detail: "Accessible toilets listed at the entrance, after the penguins and near the exit." },
    caution: "Some experiences require transfers or unaided boarding; the floating section can move with tides. Confirm personal access fit before booking.",
    sourceName: "SEA LIFE Sydney — Accessibility guide",
    sourceUrl: "https://www.visitsealife.com/sydney/plan-your-day/before-you-visit/accessibility-guide/",
    checkedOn: reviewed,
  },
  {
    id: "maritime",
    name: "Australian National Maritime Museum",
    category: "Museums",
    neighbourhood: "Darling Harbour",
    address: "2 Murray Street, Sydney NSW 2000",
    description: "Maritime history, waterfront exhibitions and harbour stories.",
    latitude: -33.8690,
    longitude: 151.1988,
    experienceMinutes: 105,
    recommendedDay: 3,
    stepFree: { status: "documented", detail: "The main museum has ramp access, with lifts or ramps to exhibitions and the outside viewing platform." },
    accessibleToilet: { status: "documented", detail: "Accessible toilets in the ground-floor foyer and lower level." },
    caution: "Historic vessels are not wheelchair-accessible. Some bathroom doors are not automatic.",
    sourceName: "Australian National Maritime Museum — Accessibility",
    sourceUrl: "https://www.sea.museum/en/visit/plan-your-visit/accessibility",
    checkedOn: reviewed,
  },
];

const dayPlan = [
  { title: "Harbour & The Rocks", stopIds: ["mca", "opera"] },
  { title: "Culture & discovery", stopIds: ["australian-museum", "state-library"] },
  { title: "Darling Harbour", stopIds: ["sea-life", "maritime"] },
];

export function makeSydneyDemoTrip(dayCount = 3): TourismTrip {
  const count = Math.max(1, Math.min(5, Math.trunc(dayCount) || 3));
  return {
    id: "sydney-demo",
    destination: "Sydney",
    createdFrom: "local-demo",
    days: Array.from({ length: count }, (_, index) => ({
      day: index + 1,
      title: dayPlan[index]?.title ?? "Your choice",
      stopIds: [...(dayPlan[index]?.stopIds ?? [])],
    })),
  };
}

export function getTourismPlace(id: string): TourismPlace | undefined {
  return SYDNEY_TOURISM_PLACES.find((place) => place.id === id);
}

export function isTourismTrip(value: unknown): value is TourismTrip {
  if (typeof value !== "object" || value === null) return false;
  const trip = value as Partial<TourismTrip>;
  if (trip.id !== "sydney-demo" || trip.destination !== "Sydney" || !Array.isArray(trip.days)) return false;
  if (trip.days.length < 1 || trip.days.length > 5) return false;
  const validIds = new Set(SYDNEY_TOURISM_PLACES.map((place) => place.id));
  const allIds: string[] = [];
  for (const day of trip.days) {
    if (!day || !Number.isInteger(day.day) || typeof day.title !== "string" || !Array.isArray(day.stopIds)) return false;
    if (day.stopIds.some((id) => typeof id !== "string" || !validIds.has(id))) return false;
    allIds.push(...day.stopIds);
  }
  return new Set(allIds).size === allIds.length;
}

export function moveTourismStop(
  trip: TourismTrip,
  fromDay: number,
  stopId: string,
  toDay: number,
  targetIndex?: number,
): TourismTrip {
  if (!getTourismPlace(stopId) || !trip.days.some((d) => d.day === toDay)) return trip;
  const days = trip.days.map((day) => ({ ...day, stopIds: [...day.stopIds] }));
  const origin = days.find((d) => d.day === fromDay);
  const destination = days.find((d) => d.day === toDay);
  if (!origin || !destination || !origin.stopIds.includes(stopId)) return trip;
  origin.stopIds = origin.stopIds.filter((id) => id !== stopId);
  const index = targetIndex === undefined ? destination.stopIds.length : Math.max(0, Math.min(targetIndex, destination.stopIds.length));
  destination.stopIds.splice(index, 0, stopId);
  return { ...trip, days };
}

export function removeTourismStop(trip: TourismTrip, stopId: string): TourismTrip {
  return {
    ...trip,
    days: trip.days.map((day) => ({ ...day, stopIds: day.stopIds.filter((id) => id !== stopId) })),
  };
}

export function addTourismStop(trip: TourismTrip, stopId: string, dayNumber: number): TourismTrip {
  if (!getTourismPlace(stopId) || trip.days.some((day) => day.stopIds.includes(stopId))) return trip;
  return {
    ...trip,
    days: trip.days.map((day) => day.day === dayNumber
      ? { ...day, stopIds: [...day.stopIds, stopId] }
      : day),
  };
}
