import type { Place } from "./domain";

const reviewed = "2026-10-27";

/** Illustrative venue list for UX testing; no partnership or current access guarantee. */
export const DEMO_PLACES: Place[] = [
  {
    id: "demo:state-library", name: "State Library of New South Wales",
    suburb: "Sydney CBD", category: "Libraries & culture",
    description: "Reading rooms, free exhibitions and public spaces.",
    source: "illustrative", sourceLabel: "State Library NSW — access information",
    sourceReviewedAt: reviewed, sourceUrl: "https://www.sl.nsw.gov.au/about-library/access-inclusion/access-library",
    stepFree: { status: "documented", detail: "Official visitor information describes accessible entrances and lifts." },
    accessibleToilet: { status: "documented", detail: "Accessible toilets are documented in the Mitchell and Macquarie Street buildings." },
    caution: "Confirm the correct entrance, lift availability, exhibition conditions and nearby drop-off options.",
  },
  {
    id: "demo:mca", name: "Museum of Contemporary Art Australia",
    suburb: "The Rocks", category: "Arts & exhibitions",
    description: "Contemporary Australian art and harbour-side exhibitions.",
    source: "illustrative", sourceLabel: "Destination NSW — MCA visitor listing",
    sourceReviewedAt: reviewed,
    sourceUrl: "https://www.sydney.com/destinations/sydney/sydney-city/the-rocks/attractions/museum-contemporary-art-australia",
    stepFree: { status: "documented", detail: "The destination listing identifies step-free entry and lifts." },
    accessibleToilet: { status: "documented", detail: "The destination listing identifies an accessible public toilet." },
    caution: "Check the access arrangements for temporary exhibitions and the harbour approach.",
  },
  {
    id: "demo:australian-museum", name: "Australian Museum",
    suburb: "Sydney CBD", category: "Museums",
    description: "Natural history, biodiversity and First Nations collections.",
    source: "illustrative", sourceLabel: "Australian Museum — accessibility and inclusion",
    sourceReviewedAt: reviewed, sourceUrl: "https://australian.museum/visit/accessibility-and-inclusion/",
    stepFree: { status: "documented", detail: "The College Street entrance is listed as step-free with lifts to public galleries." },
    accessibleToilet: { status: "documented", detail: "Accessible public toilets and Changing Places information are published." },
    caution: "Verify temporary exhibitions and the travel path to the entrance.",
  },
  {
    id: "demo:maritime", name: "Australian National Maritime Museum",
    suburb: "Darling Harbour", category: "Museums",
    description: "Museum galleries and maritime history by the waterfront.",
    source: "illustrative", sourceLabel: "Australian National Maritime Museum — accessibility",
    sourceReviewedAt: reviewed, sourceUrl: "https://www.sea.museum/en/visit/plan-your-visit/accessibility",
    stepFree: { status: "conditional", detail: "The main museum has step-free access; historic vessels are not wheelchair accessible." },
    accessibleToilet: { status: "documented", detail: "Accessible toilets are listed in the foyer and on the lower level." },
    caution: "Do not assume vessel access; some toilet doors are not automatic.",
  },
];

export type CommunityCircle = {
  id: string;
  title: string;
  placeId: string;
  description: string;
};
export type CommunityGathering = {
  id: string;
  circleId: string;
  title: string;
  timing: string;
  accessPlan: string;
};
export const DEMO_CIRCLES: CommunityCircle[] = [
  { id: "circle:books", title: "Sydney Book Circle", placeId: "demo:state-library",
    description: "Illustrative CripSquare interest group for reading and friendship." },
  { id: "circle:art", title: "Creative Connections", placeId: "demo:mca",
    description: "Illustrative peer-led arts and culture group." },
  { id: "circle:history", title: "Museums Together", placeId: "demo:australian-museum",
    description: "Illustrative group for exploring museums at a relaxed pace." },
];
export const DEMO_GATHERINGS: CommunityGathering[] = [
  {
    id: "gather:books", circleId: "circle:books",
    title: "Book club catch-up — scenario",
    timing: "No real date or booking: choose a time with members",
    accessPlan: "Before scheduling: confirm accessible entry, meeting room, toilets, transport and communication preferences.",
  },
  {
    id: "gather:art", circleId: "circle:art",
    title: "Gallery afternoon — scenario",
    timing: "No real date or booking: proposed activity only",
    accessPlan: "Confirm exhibition access, seating, quiet spaces, travel buffers and a fallback location.",
  },
  {
    id: "gather:museum", circleId: "circle:history",
    title: "Discovery day — scenario",
    timing: "No real date or booking: proposed activity only",
    accessPlan: "Check step-free exhibition routes, accessible toilets, transport, rest breaks and ticket conditions.",
  },
];
