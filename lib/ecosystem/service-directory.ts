/**
 * MapAble One: non-transactional service discovery graph.
 *
 * This catalogue is deliberately declarative and read-only. A navigation link
 * never grants consent, changes a booking, registers a worker, verifies a
 * product, transfers data or claims a purchase is NDIS-funded.
 *
 * Source reconciliation: 2026-11-10, mapableau-new main 1115b6f.
 */
export type EcosystemServiceId =
  | "challenges"
  | "access"
  | "day"
  | "care"
  | "transport"
  | "employment"
  | "marketplace"
  | "cripsquare"
  | "providers"
  | "worker-screening"
  | "ndis-guidance";

export type ServiceSurfaceState =
  | "existing-information"
  | "prototype"
  | "planned";

export type EcosystemService = {
  id: EcosystemServiceId;
  name: string;
  summary: string;
  state: ServiceSurfaceState;
  href: string | null;
  evidence: string;
};

export type EcosystemJourney = {
  id: string;
  title: string;
  description: string;
  serviceIds: readonly EcosystemServiceId[];
  participantControl: string;
};

export const ECOSYSTEM_SERVICES: readonly EcosystemService[] = [
  {
    id: "challenges",
    name: "MapAble Challenges",
    summary: "Create and review accessibility observations through MapAble Signal.",
    state: "prototype",
    href: "/community",
    evidence: "Existing /community route; browser-local fictional Signal workspace by default, live mode separately gated.",
  },
  {
    id: "access",
    name: "MapAble Access",
    summary: "Research access features and practical barriers at places and along routes.",
    state: "existing-information",
    href: "/accessibility-map",
    evidence: "Existing access-discovery entry point; observations have their own source and verification states.",
  },
  {
    id: "day",
    name: "MapAble Day",
    summary: "Plan activities around support, transport, work and changing circumstances.",
    state: "planned",
    href: null,
    evidence: "Draft PR #32 in ausdisau/MapAble; /dashboard/day is not present in this repository main.",
  },
  {
    id: "care",
    name: "MapAble Care",
    summary: "Explore participant-controlled support and provider coordination.",
    state: "existing-information",
    href: "/care",
    evidence: "Existing public Care route; a link is not a confirmed worker or shift booking.",
  },
  {
    id: "transport",
    name: "MapAble Transport",
    summary: "Explore accessible travel and the support needed to reach activities.",
    state: "existing-information",
    href: "/transport",
    evidence: "Existing public Transport route; vehicle availability and suitability are not established here.",
  },
  {
    id: "employment",
    name: "MapAble Employment",
    summary: "Explore inclusive work, adjustments and participation options.",
    state: "existing-information",
    href: "/employment",
    evidence: "Existing public Employment route; no job match or personal disclosure is made here.",
  },
  {
    id: "marketplace",
    name: "AccessiMart / Marketplace",
    summary: "Explore assistive technology, reuse, suppliers and future quotations.",
    state: "existing-information",
    href: "/marketplace",
    evidence: "Public programme page exists; AccessiMart import, payments and supplier verification are not active.",
  },
  {
    id: "cripsquare",
    name: "CripSquare",
    summary: "Future moderated community discussions, peer experiences and local exchanges.",
    state: "planned",
    href: null,
    evidence: "Separate CripSquare repository and local MapAble Places prototype; no live account or post federation.",
  },
  {
    id: "providers",
    name: "Australian Support Provider Finder",
    summary: "Search provider information and check the evidence behind registration claims.",
    state: "existing-information",
    href: "/provider-finder",
    evidence: "Existing Provider Finder route; provider registration never proves individual worker screening.",
  },
  {
    id: "worker-screening",
    name: "NDIS Worker Screening guidance",
    summary: "Learn how an authorised person checks an individual worker's current status.",
    state: "existing-information",
    href: "https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-participants",
    evidence: "Official pathway only; no access to a private worker-screening database.",
  },
  {
    id: "ndis-guidance",
    name: "NDIS support guidance",
    summary: "Read official rules before considering whether an item might be covered.",
    state: "existing-information",
    href: "https://www.ndis.gov.au/participants/using-your-funding/understanding-your-ndis-funding/what-are-ndis-supports",
    evidence: "External NDIA guidance only; no person-specific funding or claim determination.",
  },
];

export const ECOSYSTEM_JOURNEYS: readonly EcosystemJourney[] = [
  {
    id: "participate",
    title: "Participate in my community",
    description: "Explore a local access challenge, understand a venue or journey, and consider travel and support.",
    serviceIds: ["challenges", "access", "day", "transport", "care", "cripsquare"],
    participantControl: "Nothing is published or shared across services by following these links.",
  },
  {
    id: "work",
    title: "Get to work",
    description: "Explore jobs and reasonable adjustments, then consider transport, support and daily planning.",
    serviceIds: ["employment", "access", "transport", "care", "day"],
    participantControl: "Only the job seeker may choose what adjustments or disability information to disclose.",
  },
  {
    id: "equipment",
    title: "Find equipment",
    description: "Compare assistive-technology options, find relevant providers and ask community questions.",
    serviceIds: ["marketplace", "providers", "cripsquare", "ndis-guidance"],
    participantControl: "Listings are not proof of product safety, supplier quality or NDIS fundability.",
  },
  {
    id: "support",
    title: "Organise support for my day",
    description: "Find providers, understand worker-screening pathways and connect planning to Care and Transport.",
    serviceIds: ["providers", "worker-screening", "care", "day", "transport"],
    participantControl: "No worker is assigned and no service is booked or cancelled without a separate authorised action.",
  },
];

export function getEcosystemService(id: EcosystemServiceId): EcosystemService {
  const service = ECOSYSTEM_SERVICES.find((entry) => entry.id === id);
  if (!service) throw new Error(`Unknown ecosystem service: ${id}`);
  return service;
}

export function getJourneyServiceDetails(
  journey: EcosystemJourney,
): EcosystemService[] {
  return journey.serviceIds.map(getEcosystemService);
}
