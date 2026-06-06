export type SupportArea = "All" | "Care" | "Transport" | "NDIS Help" | "Jobs" | "Places";
export type ResultCategory = SupportArea | "Plan" | "Support";

export type SearchResult = {
  title: string;
  category: ResultCategory;
  description: string;
  action: string;
  href: string;
};

export type MenuItem = {
  label: string;
  href: string;
  description: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type SponsoredPlacement = {
  id: string;
  title: string;
  category: string;
  description: string;
  cta: string;
  href: string;
  contextAreas: SupportArea[];
  placement: "primary" | "search" | "footer";
};

export type TrustMetric = {
  value: string;
  label: string;
};

export type DifferenceCard = {
  title: string;
  body: string;
  badge: string;
};

export type JourneyStep = {
  number: string;
  title: string;
  body: string;
};

export type MarketplaceCard = {
  title: string;
  eyebrow: string;
  body: string;
  icon: string;
  href: string;
};

export const supportAreas: SupportArea[] = [
  "All",
  "Care",
  "Transport",
  "NDIS Help",
  "Jobs",
  "Places",
];

export const logoMenuItems: MenuItem[] = [
  {
    label: "Find support",
    href: "/provider-finder",
    description: "Care, transport, jobs, places and guidance in one search.",
  },
  {
    label: "Accessible places",
    href: "/access",
    description: "Explore venues with access notes, quiet spaces and community guidance.",
  },
  {
    label: "List your service",
    href: "/register",
    description: "Join MapAble as a support worker, provider or transport partner.",
  },
  {
    label: "Provider console",
    href: "/provider",
    description: "Manage care, transport, workers and engagement for your organisation.",
  },
  {
    label: "Help Centre",
    href: "/ask",
    description: "Plain-language support for NDIS, bookings and accessibility.",
  },
];

export const quickPrompts = [
  "I need help getting to physio next Tuesday morning",
  "Find a support worker who understands wheelchair access",
  "Accessible transport to an appointment tomorrow",
  "Help me understand NDIS transport funding",
  "Remote jobs with flexible hours",
  "Quiet accessible cafes near me",
];

export const sampleResults: SearchResult[] = [
  {
    title: "Create a care + transport plan",
    category: "Plan",
    description:
      "Combine appointment support, accessible pickup, buffer time and return travel into one guided next step.",
    action: "Start guided plan",
    href: "/provider-finder?area=Care",
  },
  {
    title: "Find trusted support workers",
    category: "Care",
    description:
      "Compare support workers and providers by skills, availability, communication style and access experience.",
    action: "Compare support",
    href: "/provider-finder?area=Care",
  },
  {
    title: "Accessible transport options",
    category: "Transport",
    description:
      "Find wheelchair accessible transport, community transport and providers that understand access needs.",
    action: "Search rides",
    href: "/provider-finder?area=Transport",
  },
  {
    title: "NDIS transport funding guide",
    category: "NDIS Help",
    description:
      "Plain-language guidance on using transport funding, service agreements, invoices and plan-manager notes.",
    action: "Read guide",
    href: "/ask?q=NDIS+transport+funding",
  },
  {
    title: "Inclusive jobs and work support",
    category: "Jobs",
    description:
      "Explore remote roles, flexible work and interview supports that match your strengths and access needs.",
    action: "Explore jobs",
    href: "/provider-finder?area=Jobs",
  },
  {
    title: "Accessible places nearby",
    category: "Places",
    description:
      "Discover cafes, venues and everyday places with access notes, quiet spaces and wheelchair-friendly details.",
    action: "Open places",
    href: "/access",
  },
];

export const trustMetrics: TrustMetric[] = [
  { value: "1", label: "guided place to compare care, transport and support" },
  { value: "5", label: "support pathways: care, transport, NDIS help, jobs and places" },
  { value: "0", label: "confusing hand-offs when care and transport belong together" },
];

export const differenceCards: DifferenceCard[] = [
  {
    title: "Beyond care-only matching",
    body: "Mable-style marketplace clarity, but extended into transport, jobs, places and practical support guidance.",
    badge: "Care + transport",
  },
  {
    title: "Beyond worker profiles",
    body: "Hireup-style confidence around profiles and support management, with MapAble’s access-first journey planning layered in.",
    badge: "Access-first",
  },
  {
    title: "Beyond directories",
    body: "Search results become guided next steps: compare options, ask questions, save a pathway or talk to support.",
    badge: "Guided support",
  },
];

export const journeySteps: JourneyStep[] = [
  {
    number: "01",
    title: "Tell us what you need",
    body: "Search naturally, choose a support area, or start with a guided prompt.",
  },
  {
    number: "02",
    title: "Compare matched options",
    body: "See care, transport, jobs, places and guidance together instead of hunting across separate tabs.",
  },
  {
    number: "03",
    title: "Connect with confidence",
    body: "Move to booking, enquiry, saved plan or human support when you are ready.",
  },
];

export const marketplaceCards: MarketplaceCard[] = [
  {
    title: "Care",
    eyebrow: "Find support workers",
    body: "Compare experience, preferences, service type and availability in one friendly flow.",
    icon: "🤝",
    href: "/provider-finder?area=Care",
  },
  {
    title: "Transport",
    eyebrow: "Accessible rides",
    body: "Coordinate pickup notes, wheelchair access, timing buffers and appointment travel.",
    icon: "🚐",
    href: "/provider-finder?area=Transport",
  },
  {
    title: "NDIS Help",
    eyebrow: "Plain-language guidance",
    body: "Understand funding, provider choices, invoices and next steps without jargon fog.",
    icon: "🧭",
    href: "/ask",
  },
  {
    title: "Jobs",
    eyebrow: "Inclusive opportunity",
    body: "Find flexible work, interview support, transport links and workplace adjustment guidance.",
    icon: "💼",
    href: "/provider-finder?area=Jobs",
  },
  {
    title: "Places",
    eyebrow: "Access notes",
    body: "Discover everyday venues with wheelchair-friendly details, quiet spaces and community notes.",
    icon: "📍",
    href: "/access",
  },
];

export const footerPlatformLinks: FooterLink[] = [
  { label: "Find care", href: "/provider-finder?area=Care" },
  { label: "Accessible transport", href: "/provider-finder?area=Transport" },
  { label: "Inclusive jobs", href: "/provider-finder?area=Jobs" },
  { label: "Accessible places", href: "/access" },
  { label: "Provider finder", href: "/provider-finder" },
];

export const footerResourceLinks: FooterLink[] = [
  { label: "NDIS help", href: "/ask" },
  { label: "Support Centre", href: "/dashboard/engagement" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Provider console", href: "/provider" },
  { label: "List your service", href: "/register" },
  { label: "Privacy", href: "/privacy" },
];

export const companyRegistrationDetails = {
  abn: "55 641 613 541",
  ndisRegistrationNumber: "To be confirmed",
};

export const MAPABLE_CARE_COMBINED_PHONE = "0434 083 624";

export const sponsoredPlacements: SponsoredPlacement[] = [
  {
    id: "support-coordination-partner",
    title: "Need help comparing support options?",
    category: "Sponsored partner",
    description:
      "Connect with a MapAble-aligned support coordination partner who can help you understand services, funding and next steps.",
    cta: "View partner",
    href: "/ask?q=support+coordination",
    contextAreas: ["All", "Care", "NDIS Help"],
    placement: "primary",
  },
  {
    id: "accessible-transport-partner",
    title: "Accessible appointment transport",
    category: "Sponsored result",
    description:
      "A featured transport partner for wheelchair-accessible rides, appointment pickups and driver assistance.",
    cta: "Check availability",
    href: "/provider-finder?area=Transport",
    contextAreas: ["All", "Transport"],
    placement: "search",
  },
  {
    id: "assistive-tech-partner",
    title: "Assistive technology partner",
    category: "Community partner",
    description:
      "Explore mobility, communication and daily-living products from accessibility-focused providers.",
    cta: "Explore partner",
    href: "/marketplace",
    contextAreas: ["All", "Care", "Places"],
    placement: "footer",
  },
];

export const mapAbleCareCombinedDesignTests = [
  {
    name: "search field starts blank",
    expectedInitialQuery: "",
  },
  {
    name: "positioning uses combined care language",
    expectedHeadline: "Care and support, connected.",
  },
  {
    name: "support selector uses user-facing areas instead of agents",
    expectedAreas: supportAreas,
  },
  {
    name: "footer displays current phone number",
    expectedPhone: MAPABLE_CARE_COMBINED_PHONE,
  },
  {
    name: "footer displays company ABN and NDIS registration number",
    expectedRegistrationDetails: companyRegistrationDetails,
  },
  {
    name: "typography uses static wavy display treatment without animation",
    expectedTypography: "mapable-display + static WavyText",
  },
  {
    name: "wavy typography keeps clear spacing between words",
    expectedWordSpacing: "0.34em",
  },
  {
    name: "design includes clearly labelled sponsored partner placements",
    expectedSponsoredPlacements: sponsoredPlacements.map((placement) => placement.placement),
  },
  {
    name: "hero component is declared with valid function syntax",
    expectedDeclaration: "function Hero()",
  },
  {
    name: "competitive redesign includes trust metrics and guided journey sections",
    expectedSections: ["TrustMetrics", "JourneyBuilder", "MapAbleDifference", "MarketplaceGrid"],
  },
];

export function getPredictiveSuggestions(query: string) {
  if (!query.trim()) return quickPrompts.slice(0, 4);
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(" ").filter(Boolean);
  return quickPrompts
    .filter((prompt) => {
      const lowerPrompt = prompt.toLowerCase();
      return (
        lowerPrompt.includes(lowerQuery) ||
        queryWords.some((word) => word.length > 3 && lowerPrompt.includes(word))
      );
    })
    .slice(0, 4);
}

export function getFilteredResults(query: string, area: SupportArea) {
  const lowerQuery = query.toLowerCase();
  return sampleResults
    .filter((result) => {
      const matchesArea = area === "All" || result.category === area || result.category === "Plan";
      const searchableText = `${result.title} ${result.category} ${result.description}`.toLowerCase();
      const matchesQuery =
        !lowerQuery ||
        lowerQuery.split(" ").some((word) => word.length > 3 && searchableText.includes(word));
      return matchesArea && matchesQuery;
    })
    .slice(0, 4);
}

export function getSponsoredPlacement(area: SupportArea, placement: SponsoredPlacement["placement"]) {
  return sponsoredPlacements.find(
    (item) =>
      item.placement === placement &&
      (item.contextAreas.includes(area) || item.contextAreas.includes("All")),
  );
}
