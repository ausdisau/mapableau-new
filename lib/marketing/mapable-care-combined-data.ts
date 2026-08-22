export type SupportArea =
  | "All"
  | "Care"
  | "Transport"
  | "NDIS Help"
  | "Jobs"
  | "Places";
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
  /** First-party labelled partners only — footer monetization uses AdUnit inventory. */
  placement: "primary" | "search";
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
    label: "Care",
    href: "/care",
    description:
      "Consent-aware support coordination for participants and providers.",
  },
  {
    label: "Transport",
    href: "/transport",
    description: "Accessible trip requests with safety and eligibility checks.",
  },
  {
    label: "Employment",
    href: "/employment",
    description: "Inclusive work pathways and workplace adjustment support.",
  },
  {
    label: "Accessible places",
    href: "/accessibility-map",
    description:
      "Explore venues with access notes, quiet spaces and community guidance.",
  },
  {
    label: "List your service",
    href: "/for-providers",
    description:
      "Join MapAble as a support worker, provider or transport partner.",
  },
  {
    label: "Help Centre",
    href: "/help",
    description: "Support for pilot interest, privacy and access requests.",
  },
];

export const homepageHeroCopy = {
  eyebrow: "Empowering Independence",
  headline: "Accessibility you can plan around.",
  subheading:
    "Explore evidence-based accessibility information today, and register interest in MapAble's Care, Transport and Employment programmes.",
  primaryCta: "Explore the accessibility map",
  secondaryCta: "Pre-register interest",
  tertiaryCta: "How MapAble works",
};

/** Informational-release CTAs — splash page anchors + public informational destinations. */
export const homepageHeroCtas = [
  { label: "Explore the accessibility map", href: "/accessibility-map" },
  { label: "Pre-register interest", href: "#pre-register" },
  { label: "How MapAble works", href: "/about" },
] as const;

export const homepageCategoryChips = [
  { label: "Care", href: "/provider-finder?area=Care" },
  { label: "Transport", href: "/provider-finder?area=Transport" },
  { label: "NDIS Guidance", href: "/ask" },
  { label: "Jobs", href: "/provider-finder?area=Jobs" },
  { label: "Access", href: "/accessibility-map" },
];

export const homepageTrustStripItems = [
  "Evidence-based access notes",
  "Accessible-first design",
  "Pilot interest for participants & providers",
  "Built with lived experience",
];

/**
 * Public surfaces that exist in-repo today (informational / discovery).
 * Keep claims aligned with fail-closed feature flags — no bookings/claims GA.
 */
export const homepageExploreFeatures = [
  {
    eyebrow: "Places",
    title: "Accessibility map",
    body: "Browse venues with access notes, measurements, confidence, and sources — so you can plan before you go.",
    href: "/accessibility-map",
  },
  {
    eyebrow: "Care",
    title: "Care programme explainer",
    body: "Learn how MapAble approaches consent-aware care coordination. Public pages explain the programme; bookings stay separately governed.",
    href: "/care",
  },
  {
    eyebrow: "Transport",
    title: "Transport programme explainer",
    body: "Read how accessible journey planning is intended to work. Live matching and trip booking are not generally available on this site.",
    href: "/transport",
  },
  {
    eyebrow: "Jobs",
    title: "Employment pathways",
    body: "Explore inclusive employment programme information and pathways MapAble is building with partners.",
    href: "/employment",
  },
  {
    eyebrow: "Providers",
    title: "Provider discovery",
    body: "Find providers and services through public discovery pages. Enquiry and listing interest is available; live marketplace checkout is not.",
    href: "/providers",
  },
  {
    eyebrow: "Guidance",
    title: "NDIS guidance",
    body: "Ask MapAble for practical NDIS-aware guidance. This is informational support — not NDIA claim submission.",
    href: "/ask",
  },
] as const;

export type EcosystemStatusKind = "live" | "pilot";

export type EcosystemPathway = {
  id: "access" | "care" | "transport" | "jobs";
  title: string;
  kicker: string;
  body: string;
  status: string;
  statusKind: EcosystemStatusKind;
  href: string;
  linkLabel: string;
};

export const homepageEcosystemPathways: EcosystemPathway[] = [
  {
    id: "access",
    title: "Access",
    kicker: "Know before you go.",
    body: "Explore evidence-based accessibility information for places — measurements, confidence, and sources you can plan around.",
    status: "Available now",
    statusKind: "live",
    href: "/accessibility-map",
    linkLabel: "Open the accessibility map",
  },
  {
    id: "care",
    title: "Care",
    kicker: "Understand support pathways.",
    body: "Read how consent-aware care coordination is intended to work. Public pages explain the programme; bookings stay separately governed.",
    status: "Programme information / controlled pilot",
    statusKind: "pilot",
    href: "/care",
    linkLabel: "Care programme information",
  },
  {
    id: "transport",
    title: "Transport",
    kicker: "Plan accessible journeys.",
    body: "Learn how accessible journey planning is designed. Live matching and trip booking are not generally available on this site.",
    status: "Programme information / controlled pilot",
    statusKind: "pilot",
    href: "/transport",
    linkLabel: "Transport programme information",
  },
  {
    id: "jobs",
    title: "Jobs",
    kicker: "Explore inclusive employment.",
    body: "Explore inclusive employment programme information and workplace adjustment pathways MapAble is building with partners.",
    status: "Programme information / controlled pilot",
    statusKind: "pilot",
    href: "/employment",
    linkLabel: "Employment programme information",
  },
];

export const homepageMapProofExample = {
  label: "Example accessibility record",
  name: "Harbour Community Centre",
  confidence: "High",
  lastChecked: "12 Aug 2026",
  features: [
    "Step-free entrance",
    "Accessible toilet",
    "Accessible parking",
    "Quiet area",
    "Assistance animals welcome",
  ],
  doorClearWidth: "910 mm",
  evidence: "Community review + verified measurement",
  accreditationExample: "Silver — Highly Accessible (example tier only)",
} as const;

export type AudiencePathwayGroup = {
  heading: string;
  items: { title: string; href: string; description: string }[];
};

export const homepageAudiencePathways: AudiencePathwayGroup[] = [
  {
    heading: "If you are looking for information or support",
    items: [
      {
        title: "I'm looking for accessibility information",
        href: "/accessibility-map",
        description: "Explore places with access notes, measurements, and sources.",
      },
      {
        title: "I'm looking for support",
        href: "/care",
        description:
          "Read Care programme information, then pre-register interest for the controlled pilot.",
      },
      {
        title: "I'm planning accessible transport",
        href: "/transport",
        description:
          "Understand how accessible journeys are intended to work. Matching is not generally available here.",
      },
      {
        title: "I'm exploring inclusive work",
        href: "/employment",
        description: "Explore employment programme information and workplace adjustment pathways.",
      },
    ],
  },
  {
    heading: "If you coordinate, provide, or hire",
    items: [
      {
        title: "I'm a support coordinator",
        href: "/ask",
        description: "Use NDIS-aware guidance and public discovery tools. You remain the decision partner.",
      },
      {
        title: "I'm a provider",
        href: "/for-providers",
        description: "Explore listing interest and programme explainers. Marketplace checkout is not generally available.",
      },
      {
        title: "I'm an employer",
        href: "/employment",
        description: "Explore inclusive hiring pathways and workplace adjustment information.",
      },
    ],
  },
];

export const parentBrandTrustCopy = {
  eyebrow: "Australian Disability Ltd",
  headline: "An Australian Disability Ltd initiative",
  body: "We're for a fair, dignified and equal society for all people with disabilities. MapAble is the product identity; Australian Disability Ltd is the parent organisation and trust anchor.",
};

/** @deprecated Hidden from homepage splash — retained for legacy imports/tests. */
export const homepageProofMetrics: TrustMetric[] = [
  { value: "Pilot target", label: "Places mapped" },
  { value: "Pilot target", label: "Access details verified" },
  { value: "Demo", label: "Providers accepting enquiries" },
  { value: "Pilot target", label: "Transport-ready journeys" },
];

export const competitorContrastCards: DifferenceCard[] = [
  {
    title: "Evidence before assumption",
    body: "See measurements, confidence, last checked dates, and evidence sources — not a colour-only rating or a guess.",
    badge: "Evidence, not guesswork",
  },
  {
    title: "Access across the journey",
    body: "MapAble connects place access with Care, Transport, and Employment programme information so people can plan a visit, not only read a listing.",
    badge: "Connected journeys",
  },
  {
    title: "Designed around participant choice",
    body: "MapAble suggests, compares, and explains. People review options and confirm what happens next — MapAble does not assign support or make clinical decisions.",
    badge: "Participant decision ownership",
  },
  {
    title: "Built to connect, not control",
    body: "Public pages share evidence and programme explainers. Bookings, matching, and NDIS claims stay separately governed in controlled pilots.",
    badge: "Built with lived experience",
  },
];

export const homepageMapPreviewFilters = [
  "Step-free entry",
  "Accessible toilet",
  "Accessible parking",
  "Quiet/sensory-friendly",
  "Assistance animal welcome",
  "Public transport nearby",
  "Access notes with confidence",
  "Evidence sources listed",
] as const;

export const homepageSupportJourneySteps: JourneyStep[] = [
  {
    number: "01",
    title: "Find a place",
    body: "Search venues and services with access notes that matter to you.",
  },
  {
    number: "02",
    title: "Check access",
    body: "Review measurements, confidence, sources, and what still needs confirming.",
  },
  {
    number: "03",
    title: "Understand support",
    body: "Explore Care programme information and compare options. MapAble does not assign providers.",
  },
  {
    number: "04",
    title: "Plan accessible transport",
    body: "Read how accessible journeys are intended to work. Live matching is not generally available here.",
  },
  {
    number: "05",
    title: "Attend appointment, activity or work",
    body: "Share access notes with the people you choose — coordinator, driver, carer, or employer.",
  },
  {
    number: "06",
    title: "Share updated access information",
    body: "Report changes so the next person has better evidence. You stay in control of what is shared.",
  },
];

export const homepageProviderPitch = {
  headline: "Grow by being useful, trusted, and accessible.",
  body: "Providers can explore MapAble’s public discovery pages and pre-register interest for pilot listing workflows. Live availability badges, marketplace checkout, and NDIA claim submission remain separately gated.",
  points: [
    "Public provider discovery",
    "Access-readiness profiles (pilot)",
    "Interest registration for listings",
    "Programme explainers for Care & Transport",
    "Consent-aware coordination (pilot)",
  ],
  ctaLabel: "Register provider interest",
  ctaHref: "/for-providers",
};

export const homepageFinalCta = {
  headline: "Help build Australia’s access layer.",
  body: "Pre-register for the pilot, read how MapAble works, or contact us. Public pages do not open general bookings or NDIS claims.",
  ctas: [
    { label: "Pre-register interest", href: "#pre-register" },
    { label: "Accessibility statement", href: "/accessibility-statement" },
    { label: "Contact MapAble", href: "/contact" },
    { label: "Help Centre", href: "/help" },
  ],
};

export const guidedSearchPanelCopy = {
  eyebrow: "Guided support search",
  heading: "Build your support pathway",
  intro:
    "Describe what you need in plain language. MapAble will help you compare care, transport, funding and practical next steps in one guided conversation.",
  inputLabel: "What support do you need?",
  placeholder: "Example: I need transport to therapy",
  submitLabel: "Search",
  ctaLabel: "Start guided search",
  previewHint:
    "Your guided conversation will appear here once you start searching. Use the prompts above or type your own need.",
};

export const guidedSearchPromptChips = [
  {
    label: "Find a support worker",
    prefill: "Find a support worker who understands wheelchair access",
  },
  {
    label: "Book accessible transport",
    prefill: "Accessible transport to an appointment tomorrow",
  },
  {
    label: "Understand NDIS options",
    prefill: "Help me understand NDIS transport funding",
  },
  {
    label: "Find inclusive jobs",
    prefill: "Remote jobs with flexible hours",
  },
];

export const pathwayPreviewSteps = [
  "Support worker shortlist",
  "Accessible transport buffer",
  "NDIS notes prepared",
];

export type PersonaEntry = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

export const personaEntries: PersonaEntry[] = [
  {
    title: "I'm looking for support",
    description:
      "Compare care, transport and practical help in one guided search.",
    href: "/provider-finder",
    cta: "Find support",
  },
  {
    title: "I'm a carer or family member",
    description:
      "Explore support workers and providers with clear access notes.",
    href: "/provider-finder?area=Care",
    cta: "Explore care options",
  },
  {
    title: "I'm a support coordinator",
    description: "Coordinate participant pathways with NDIS-aware guidance.",
    href: "/support-coordinator",
    cta: "Open coordinator tools",
  },
  {
    title: "I'm a provider",
    description:
      "List your service and connect with participants who need your support.",
    href: "/for-providers",
    cta: "List your service",
  },
  {
    title: "I'm an employer",
    description:
      "Build inclusive hiring pathways and workplace adjustment support.",
    href: "/employment",
    cta: "Explore employment",
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
    href: "/accessibility-map",
  },
];

export const trustMetrics: TrustMetric[] = homepageProofMetrics;

export const differenceCards: DifferenceCard[] = competitorContrastCards;

export const journeySteps: JourneyStep[] = homepageSupportJourneySteps;

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
    href: "/accessibility-map",
  },
];

export const footerPlatformLinks: FooterLink[] = [
  { label: "Care", href: "/care" },
  { label: "Transport", href: "/transport" },
  { label: "Employment", href: "/employment" },
  { label: "Providers", href: "/providers" },
  { label: "Accessible places", href: "/accessibility-map" },
  { label: "Provider finder", href: "/provider-finder" },
];

export const footerResourceLinks: FooterLink[] = [
  { label: "Resources", href: "/resources" },
  { label: "Help Centre", href: "/help" },
  { label: "Register provider interest", href: "/for-providers" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Accessibility", href: "/accessibility-statement" },
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
];

export const mapAbleCareCombinedDesignTests = [
  {
    name: "search field starts blank",
    expectedInitialQuery: "",
  },
  {
    name: "positioning uses combined care language",
    expectedHeadline: homepageHeroCopy.headline,
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
    name: "typography uses stable accessible brand typography",
    expectedTypography: "font-heading extra-bold without WavyText",
  },
  {
    name: "design includes clearly labelled sponsored partner placements",
    expectedSponsoredPlacements: sponsoredPlacements.map(
      (placement) => placement.placement,
    ),
  },
  {
    name: "footer monetization uses AdSense advertising unit",
    expectedFooterMonetization: "adsense.marketing.footer",
  },
  {
    name: "hero section is extracted to dedicated component",
    expectedDeclaration: "HeroSection",
  },
  {
    name: "guided landing includes primary homepage sections",
    expectedSections: [
      "HeroSection",
      "EcosystemNavigator",
      "AccessibilityMapProof",
      "ConnectedJourney",
      "CompetitorContrastStrip",
      "AudiencePathways",
      "PreRegistrationSection",
      "ParentBrandTrust",
      "HomepageFinalCta",
      "BoundaryNotice",
    ],
  },
  {
    name: "homepage has single pre-registration panel anchor",
    expectedPreRegistrationAnchor: "pre-register",
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
      const matchesArea =
        area === "All" ||
        result.category === area ||
        result.category === "Plan";
      const searchableText =
        `${result.title} ${result.category} ${result.description}`.toLowerCase();
      const matchesQuery =
        !lowerQuery ||
        lowerQuery
          .split(" ")
          .some((word) => word.length > 3 && searchableText.includes(word));
      return matchesArea && matchesQuery;
    })
    .slice(0, 4);
}

export function getSponsoredPlacement(
  area: SupportArea,
  placement: SponsoredPlacement["placement"],
) {
  return sponsoredPlacements.find(
    (item) =>
      item.placement === placement &&
      (item.contextAreas.includes(area) || item.contextAreas.includes("All")),
  );
}
