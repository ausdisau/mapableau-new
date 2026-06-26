/**
 * MapAble vertical registry — source of truth for public vertical pages,
 * navigation cards, sitemap generation, and future feature flags.
 */

export type VerticalStatus = "existing" | "planned" | "proposed" | "pilot";
export type VerticalRisk = "low" | "medium" | "high";
export type VerticalComplexity = "low" | "medium" | "high";
export type VerticalPriority = 1 | 2 | 3 | 4 | 5;

export interface VerticalCta {
  label: string;
  href: string;
}

export interface MapAbleVertical {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  status: VerticalStatus;
  audience: string;
  oneLine: string;
  problem: string;
  solution: string;
  coreFeatures: string[];
  ecosystemLinks: string[];
  revenueModel: string;
  riskLevel: VerticalRisk;
  implementationComplexity: VerticalComplexity;
  priority: VerticalPriority;
  complianceNotes: string;
  primaryCta: VerticalCta;
  secondaryCta?: VerticalCta;
  themeIcon: string;
  href: string;
}

const existingVerticals: MapAbleVertical[] = [
  {
    id: "core",
    slug: "core",
    name: "MapAble Core",
    shortName: "Core",
    status: "existing",
    audience: "All MapAble users, providers, and partners",
    oneLine: "Shared identity, billing, messaging, privacy, and accessibility backbone.",
    problem:
      "Disability services are fragmented across disconnected apps, logins, and data silos.",
    solution:
      "MapAble Core provides one accessible account layer with consent, role-based access, and shared services across every vertical.",
    coreFeatures: [
      "Unified accounts and roles",
      "Consent and privacy controls",
      "Messaging and notifications",
      "Billing and API integration",
    ],
    ecosystemLinks: ["care", "transport", "jobs", "access-map", "planops"],
    revenueModel: "Platform subscription and transaction fees across modules",
    riskLevel: "medium",
    implementationComplexity: "high",
    priority: 1,
    complianceNotes: "Privacy by design; role-based access; audit-ready workflows.",
    primaryCta: { label: "Explore MapAble Core", href: "/core" },
    secondaryCta: { label: "View governance", href: "/governance" },
    themeIcon: "Layers",
    href: "/core",
  },
  {
    id: "care",
    slug: "care",
    name: "MapAble Care",
    shortName: "Care",
    status: "existing",
    audience: "Participants, families, support coordinators, and providers",
    oneLine: "Find and coordinate disability support with consent at the centre.",
    problem:
      "Support bookings, worker matching, and service records live in separate tools.",
    solution:
      "MapAble Care connects provider discovery, support requests, and service evidence in one consent-controlled workflow.",
    coreFeatures: [
      "Provider finder integration",
      "Support request workflows",
      "Consent-controlled records",
      "Coordinator visibility",
    ],
    ecosystemLinks: ["core", "transport", "planops", "access-pass"],
    revenueModel: "Provider subscriptions and booking fees",
    riskLevel: "medium",
    implementationComplexity: "high",
    priority: 1,
    complianceNotes: "NDIS-aware workflows; not a funding decision-maker.",
    primaryCta: { label: "Explore Care", href: "/care" },
    secondaryCta: { label: "Join pilot", href: "/contact" },
    themeIcon: "Heart",
    href: "/care",
  },
  {
    id: "transport",
    slug: "transport",
    name: "MapAble Transport",
    shortName: "Transport",
    status: "existing",
    audience: "Participants, drivers, transport providers, and coordinators",
    oneLine: "Book accessible transport with clear pickup and access details.",
    problem: "Accessible transport is hard to find, book, and coordinate with other supports.",
    solution:
      "MapAble Transport links wheelchair-accessible rides, route planning, and care appointments in one flow.",
    coreFeatures: [
      "Accessible vehicle booking",
      "Door-to-door scheduling",
      "Access preference notes",
      "Care appointment bundling",
    ],
    ecosystemLinks: ["core", "care", "access-map", "access-pass"],
    revenueModel: "Booking fees and provider partnerships",
    riskLevel: "medium",
    implementationComplexity: "high",
    priority: 2,
    complianceNotes: "Not an emergency transport service.",
    primaryCta: { label: "Explore Transport", href: "/transport" },
    themeIcon: "Bus",
    href: "/transport",
  },
  {
    id: "jobs",
    slug: "employment",
    name: "MapAble Jobs",
    shortName: "Jobs",
    status: "existing",
    audience: "Job seekers with disability, inclusive employers, and coordinators",
    oneLine: "Inclusive employment with workplace adjustment support.",
    problem: "Job seekers face unclear access information and fragmented workplace support.",
    solution:
      "MapAble Jobs connects inclusive employers, interview support, transport links, and adjustment guidance.",
    coreFeatures: [
      "Inclusive job matching",
      "Workplace adjustment notes",
      "Employer readiness",
      "Transport and care links",
    ],
    ecosystemLinks: ["core", "transport", "access-pass", "academy"],
    revenueModel: "Employer subscriptions and placement fees",
    riskLevel: "low",
    implementationComplexity: "medium",
    priority: 3,
    complianceNotes: "Not an employment agency guarantee.",
    primaryCta: { label: "Explore Jobs", href: "/employment" },
    themeIcon: "Briefcase",
    href: "/employment",
  },
  {
    id: "access-map",
    slug: "access",
    name: "MapAble Accessibility Map",
    shortName: "Access Map",
    status: "existing",
    audience: "People with disability, mappers, venues, and councils",
    oneLine: "Discover places with detailed, evidence-based access information.",
    problem: 'Venue pages often say only "wheelchair accessible" without useful detail.',
    solution:
      "MapAble Access collects structured access reviews, photos, and accreditation data people can trust.",
    coreFeatures: [
      "Place reviews and photos",
      "Structured access fields",
      "Community mapping",
      "Accreditation links",
    ],
    ecosystemLinks: ["core", "accreditation", "accessops", "intelligence"],
    revenueModel: "Venue listings and council partnerships",
    riskLevel: "low",
    implementationComplexity: "medium",
    priority: 2,
    complianceNotes: "Community data is not legal certification.",
    primaryCta: { label: "Explore places", href: "/access" },
    themeIcon: "MapPin",
    href: "/access",
  },
  {
    id: "accreditation",
    slug: "accreditation",
    name: "MapAble Accreditation",
    shortName: "Accreditation",
    status: "existing",
    audience: "Venues, assessors, councils, and participants",
    oneLine: "Structured accessibility assessment against MapAble criteria.",
    problem: "Accessibility claims are often vague and unverifiable.",
    solution:
      "MapAble Accreditation provides structured assessments, tiers, and published accessibility profiles.",
    coreFeatures: [
      "Assessment domains",
      "Bronze/Silver/Gold tiers",
      "Public accessibility pages",
      "Reassessment reminders",
    ],
    ecosystemLinks: ["access-map", "accessops", "academy", "intelligence"],
    revenueModel: "Assessment fees and venue subscriptions",
    riskLevel: "medium",
    implementationComplexity: "medium",
    priority: 3,
    complianceNotes: "MapAble assessment — not legal certification unless stated.",
    primaryCta: { label: "View accreditation", href: "/accreditation" },
    themeIcon: "Award",
    href: "/accreditation",
  },
  {
    id: "marketplace",
    slug: "marketplace",
    name: "MapAble Marketplace",
    shortName: "Marketplace",
    status: "existing",
    audience: "Participants, families, and equipment providers",
    oneLine: "Browse disability aids, equipment, and daily living essentials.",
    problem: "Finding NDIS-aligned equipment across vendors is time-consuming.",
    solution:
      "MapAble Marketplace connects participants with trusted suppliers of mobility aids and daily living products.",
    coreFeatures: [
      "Equipment catalogues",
      "Provider listings",
      "Care and home links",
      "Plan visibility via PlanOps",
    ],
    ecosystemLinks: ["core", "care", "home", "planops"],
    revenueModel: "Marketplace commissions and listings",
    riskLevel: "low",
    implementationComplexity: "medium",
    priority: 4,
    complianceNotes: "Product suitability requires professional advice where needed.",
    primaryCta: { label: "Explore Marketplace", href: "/marketplace" },
    themeIcon: "ShoppingBag",
    href: "/marketplace",
  },
  {
    id: "foods",
    slug: "foods",
    name: "MapAble Foods",
    shortName: "Foods",
    status: "existing",
    audience: "Participants, meal providers, and coordinators",
    oneLine: "Meal delivery and nutrition support tailored to access needs.",
    problem: "Meal services are rarely coordinated with care, transport, and health routines.",
    solution:
      "MapAble Foods links meal delivery, dietary preferences, and support scheduling.",
    coreFeatures: [
      "Meal delivery",
      "Dietary planning",
      "Care coordination",
      "Transition bundling",
    ],
    ecosystemLinks: ["core", "care", "transition", "ageing"],
    revenueModel: "Provider fees and delivery commissions",
    riskLevel: "low",
    implementationComplexity: "medium",
    priority: 4,
    complianceNotes: "Not clinical nutrition advice.",
    primaryCta: { label: "Explore Foods", href: "/foods" },
    themeIcon: "Utensils",
    href: "/foods",
  },
  {
    id: "kids",
    slug: "kids",
    name: "MapAble Kids",
    shortName: "Kids",
    status: "planned",
    audience: "Children with disability, families, and early intervention providers",
    oneLine: "Specialised support for children and families.",
    problem: "Children's services are scattered across therapy, school, and family systems.",
    solution:
      "MapAble Kids will connect early intervention, therapy, school support, and family programs.",
    coreFeatures: [
      "Early intervention",
      "Therapy services",
      "School support",
      "Family programs",
    ],
    ecosystemLinks: ["core", "care", "transition"],
    revenueModel: "Provider subscriptions",
    riskLevel: "medium",
    implementationComplexity: "high",
    priority: 5,
    complianceNotes: "Safeguarding and child privacy requirements apply.",
    primaryCta: { label: "Learn about Kids", href: "/kids" },
    themeIcon: "Baby",
    href: "/kids",
  },
  {
    id: "moves",
    slug: "moves",
    name: "MapAble Moves",
    shortName: "Moves",
    status: "planned",
    audience: "Participants seeking mobility and rehabilitation support",
    oneLine: "Physical therapy and mobility programs.",
    problem: "Rehabilitation and exercise programs are disconnected from daily support.",
    solution:
      "MapAble Moves will link physical therapy, exercise programs, and mobility training with care coordination.",
    coreFeatures: [
      "Physical therapy",
      "Exercise programs",
      "Mobility training",
      "Care integration",
    ],
    ecosystemLinks: ["core", "care", "life"],
    revenueModel: "Provider fees",
    riskLevel: "low",
    implementationComplexity: "medium",
    priority: 5,
    complianceNotes: "Not clinical advice.",
    primaryCta: { label: "Learn about Moves", href: "/moves" },
    themeIcon: "Activity",
    href: "/moves",
  },
];

const untappedVerticals: MapAbleVertical[] = [
  {
    id: "planops",
    slug: "planops",
    name: "MapAble PlanOps",
    shortName: "PlanOps",
    status: "pilot",
    audience: "Participants, families, support coordinators, providers, and plan managers",
    oneLine: "Turn support plans into clear daily action with one accessible dashboard.",
    problem:
      "Bookings, invoices, transport, goals, and service notes live in separate places — families and coordinators lose time reconciling information.",
    solution:
      "PlanOps unifies bookings, NDIS line items, invoice status, utilisation forecasts, and service gap alerts in one consent-controlled dashboard.",
    coreFeatures: [
      "Unified participant dashboard",
      "NDIS line item tagging",
      "Invoice status tracking",
      "Utilisation forecasting",
      "Service gap alerts",
      "CSV/Xero-style exports",
    ],
    ecosystemLinks: ["core", "care", "transport", "jobs", "access-pass", "intelligence"],
    revenueModel: "Coordinator and plan manager subscriptions",
    riskLevel: "medium",
    implementationComplexity: "high",
    priority: 1,
    complianceNotes:
      "Informational coordination only — not financial, legal, or NDIS funding advice.",
    primaryCta: { label: "Request PlanOps pilot access", href: "/planops#interest" },
    secondaryCta: { label: "Explore partner dashboard", href: "/for-providers" },
    themeIcon: "LayoutDashboard",
    href: "/planops",
  },
  {
    id: "home",
    slug: "home",
    name: "MapAble Home",
    shortName: "Home",
    status: "pilot",
    audience: "People with disability, families, housing providers, and OT assessors",
    oneLine: "Find, adapt, and understand accessible homes in one coordinated journey.",
    problem:
      "Housing searches lack real access detail; modifications involve many disconnected people and advice sources.",
    solution:
      "MapAble Home brings housing access, modifications, supports, transport, equipment, and local accessibility into one pathway.",
    coreFeatures: [
      "Accessible home profile",
      "Home modification pathway",
      "OT/assessor coordination",
      "Can I live here? address checks",
      "Document vault",
      "Neighbourhood access view",
    ],
    ecosystemLinks: ["care", "transport", "marketplace", "accreditation", "planops", "access-pass"],
    revenueModel: "Provider listings, assessor partnerships, council subscriptions",
    riskLevel: "medium",
    implementationComplexity: "high",
    priority: 1,
    complianceNotes:
      "Not legal, tenancy, building, or clinical advice. No public address display without consent.",
    primaryCta: { label: "Join the Home pilot", href: "/home#interest" },
    secondaryCta: { label: "Partner as a housing provider", href: "/home#interest" },
    themeIcon: "Home",
    href: "/home",
  },
  {
    id: "accessops",
    slug: "accessops",
    name: "MapAble AccessOps",
    shortName: "AccessOps",
    status: "pilot",
    audience: "Councils, venues, universities, health services, event organisers, and tourism operators",
    oneLine: "Make accessibility visible, measurable, and maintainable for organisations.",
    problem:
      'Accessibility information is vague; organisations need improvement pathways, not just criticism.',
    solution:
      "AccessOps turns assessments into ongoing infrastructure: audits, public pages, roadmaps, training records, and trust badges.",
    coreFeatures: [
      "Structured accessibility assessments",
      "Bronze/Silver/Gold tiers",
      "Venue dashboard",
      "Public accessibility guide pages",
      "Staff training log",
      "Reassessment reminders",
    ],
    ecosystemLinks: ["accreditation", "intelligence", "academy", "access-map"],
    revenueModel: "B2B/B2G venue and council subscriptions",
    riskLevel: "medium",
    implementationComplexity: "medium",
    priority: 1,
    complianceNotes: "Verification is not legal certification.",
    primaryCta: { label: "Request an AccessOps demo", href: "/accessops#interest" },
    secondaryCta: { label: "Start a venue assessment", href: "/accessops#interest" },
    themeIcon: "Building2",
    href: "/accessops",
  },
  {
    id: "life",
    slug: "life",
    name: "MapAble Life",
    shortName: "Life",
    status: "proposed",
    audience: "Adults with disability seeking community participation",
    oneLine: "Find accessible things to do, not just places to go.",
    problem:
      "Social isolation, unclear event access information, and transport/support planning barriers limit participation.",
    solution:
      "MapAble Life helps people discover community activities with clear access details and optional care and transport coordination.",
    coreFeatures: [
      "Accessible events directory",
      "Access need filters",
      "Support worker booking prompts",
      "Transport planning",
      "Quiet/sensory-friendly options",
      "Peer reviews",
    ],
    ecosystemLinks: ["access-map", "transport", "care", "access-pass", "academy"],
    revenueModel: "Event listings and council partnerships",
    riskLevel: "low",
    implementationComplexity: "medium",
    priority: 2,
    complianceNotes: "MapAble helps clarify access information; not responsible for every third-party event.",
    primaryCta: { label: "Suggest an accessible activity", href: "/life#interest" },
    secondaryCta: { label: "List an inclusive event", href: "/life#interest" },
    themeIcon: "Users",
    href: "/life",
  },
  {
    id: "transition",
    slug: "transition",
    name: "MapAble Transition",
    shortName: "Transition",
    status: "proposed",
    audience: "Participants, families, hospitals, rehab providers, and coordinators",
    oneLine: "When life changes, support should move with you.",
    problem:
      "Discharge and life transitions scatter tasks across equipment, transport, meals, care, and appointments.",
    solution:
      "MapAble Transition coordinates practical steps around discharge, home setup, transport, support workers, meals, and follow-up.",
    coreFeatures: [
      "Transition checklists",
      "Transport booking",
      "Temporary care schedules",
      "Equipment readiness checks",
      "Shared task board",
      "Document vault",
    ],
    ecosystemLinks: ["care", "transport", "foods", "home", "marketplace", "planops", "access-pass"],
    revenueModel: "Hospital and coordinator partnerships",
    riskLevel: "high",
    implementationComplexity: "high",
    priority: 2,
    complianceNotes:
      "Not emergency care, clinical advice, or discharge approval. Human review for high-risk workflows.",
    primaryCta: { label: "Join transition pilot", href: "/transition#interest" },
    secondaryCta: { label: "Partner with MapAble Transition", href: "/transition#interest" },
    themeIcon: "ArrowRightLeft",
    href: "/transition",
  },
  {
    id: "ageing",
    slug: "ageing",
    name: "MapAble Ageing",
    shortName: "Ageing",
    status: "proposed",
    audience: "Older people with disability, ageing carers, adult children, and aged care providers",
    oneLine: "Ageing with access, dignity, and practical support.",
    problem:
      "Systems are fragmented across disability, aged care, health, and community supports.",
    solution:
      "MapAble Ageing coordinates accessible transport, home support, meals, social participation, and family communication.",
    coreFeatures: [
      "Family dashboard",
      "Accessible transport options",
      "Meal support integration",
      "Home access checklist",
      "Social participation suggestions",
      "Consent-controlled sharing",
    ],
    ecosystemLinks: ["care", "transport", "foods", "home", "life", "planops", "access-pass"],
    revenueModel: "Aged care provider and council partnerships",
    riskLevel: "medium",
    implementationComplexity: "medium",
    priority: 3,
    complianceNotes: "General information only — not aged care funding eligibility advice.",
    primaryCta: { label: "Join Ageing pilot", href: "/ageing#interest" },
    secondaryCta: { label: "Partner with MapAble Ageing", href: "/ageing#interest" },
    themeIcon: "HeartHandshake",
    href: "/ageing",
  },
  {
    id: "academy",
    slug: "academy",
    name: "MapAble Academy",
    shortName: "Academy",
    status: "proposed",
    audience: "Support workers, providers, venues, drivers, employers, and councils",
    oneLine: "Build the skills behind accessible service.",
    problem:
      "Inconsistent training creates poor experiences; staff confidence and service quality matter.",
    solution:
      "MapAble Academy offers micro-courses, scenario modules, completion badges, and organisation dashboards.",
    coreFeatures: [
      "Micro-courses",
      "Scenario-based modules",
      "Completion badges",
      "Organisation dashboards",
      "Renewal reminders",
      "Role-based pathways",
    ],
    ecosystemLinks: ["accessops", "accreditation", "care", "transport", "jobs"],
    revenueModel: "Organisation training subscriptions",
    riskLevel: "low",
    implementationComplexity: "medium",
    priority: 3,
    complianceNotes:
      "Training supports awareness — does not replace legally required qualifications or clinical training.",
    primaryCta: { label: "Join Academy waitlist", href: "/academy#interest" },
    secondaryCta: { label: "Discuss organisation training", href: "/academy#interest" },
    themeIcon: "GraduationCap",
    href: "/academy",
  },
  {
    id: "access-pass",
    slug: "access-pass",
    name: "MapAble Access Pass",
    shortName: "Access Pass",
    status: "proposed",
    audience: "People with disability, workers, venues, employers, and transport partners",
    oneLine: "Share your access needs once, on your terms.",
    problem:
      "People repeatedly explain the same access needs; information gets lost between providers.",
    solution:
      "Access Pass stores access needs, communication preferences, and support notes with consent-controlled sharing.",
    coreFeatures: [
      "Personal access profile",
      "Communication preferences",
      "Mobility aid details",
      "Share links with expiry",
      "Role-based access",
      "Consent log",
    ],
    ecosystemLinks: ["care", "transport", "jobs", "home", "life", "ready"],
    revenueModel: "Premium profile features and partner integrations",
    riskLevel: "medium",
    implementationComplexity: "medium",
    priority: 4,
    complianceNotes: "User-owned profile; sharing is optional and revocable.",
    primaryCta: { label: "Join Access Pass pilot", href: "/access-pass#interest" },
    secondaryCta: { label: "Partner with Access Pass", href: "/access-pass#interest" },
    themeIcon: "IdCard",
    href: "/access-pass",
  },
  {
    id: "ready",
    slug: "ready",
    name: "MapAble Ready",
    shortName: "Ready",
    status: "proposed",
    audience: "Participants, families, providers, councils, and emergency management partners",
    oneLine: "Accessible readiness before things go wrong.",
    problem:
      "Emergency plans often miss access needs; equipment, transport, and support continuity matter.",
    solution:
      "MapAble Ready helps prepare evacuation plans, backup contacts, equipment needs, and support continuity information.",
    coreFeatures: [
      "Personal readiness checklist",
      "Power-dependent equipment notes",
      "Accessible transport backup",
      "Support continuity plan",
      "Emergency contact sharing",
      "Disruption notifications concept",
    ],
    ecosystemLinks: ["transport", "care", "home", "access-pass", "intelligence"],
    revenueModel: "Council and community organisation partnerships",
    riskLevel: "high",
    implementationComplexity: "medium",
    priority: 4,
    complianceNotes:
      "Planning tool only — not an emergency service. Call 000 in immediate danger.",
    primaryCta: { label: "Create a readiness checklist", href: "/ready#interest" },
    secondaryCta: { label: "Partner on community readiness", href: "/ready#interest" },
    themeIcon: "ShieldAlert",
    href: "/ready",
  },
  {
    id: "rights-navigator",
    slug: "rights-navigator",
    name: "MapAble Rights Navigator",
    shortName: "Rights Navigator",
    status: "proposed",
    audience: "People with disability, advocates, families, and coordinators",
    oneLine: "Organise concerns and find safer next steps.",
    problem:
      "Complaints are overwhelming; evidence is scattered; people may fear retaliation.",
    solution:
      "Rights Navigator helps record concerns, build evidence timelines, and share information with trusted advocates.",
    coreFeatures: [
      "Issue log",
      "Evidence timeline",
      "Plain-language complaint drafts",
      "Consent-controlled sharing",
      "Response tracker",
      "Escalation pathway information",
    ],
    ecosystemLinks: ["planops", "access-pass", "care", "transport", "intelligence"],
    revenueModel: "Advocacy organisation partnerships",
    riskLevel: "high",
    implementationComplexity: "medium",
    priority: 5,
    complianceNotes:
      "Organisation support only — not legal advice, emergency help, or substitute for an advocate.",
    primaryCta: { label: "Join Rights Navigator pilot", href: "/rights-navigator#interest" },
    secondaryCta: { label: "Partner as an advocacy organisation", href: "/rights-navigator#interest" },
    themeIcon: "Scale",
    href: "/rights-navigator",
  },
  {
    id: "intelligence",
    slug: "intelligence",
    name: "MapAble Intelligence",
    shortName: "Intelligence",
    status: "proposed",
    audience: "Councils, governments, providers, employers, venues, and social impact organisations",
    oneLine: "Turn access gaps into action with privacy-safe, aggregated insights.",
    problem:
      "Decision-makers lack real access data; gaps stay hidden until people complain.",
    solution:
      "MapAble Intelligence provides anonymised heatmaps, gap dashboards, and improvement tracking.",
    coreFeatures: [
      "Accessibility heatmaps",
      "Service gap dashboards",
      "Transport barrier reports",
      "Venue scorecards",
      "Community participation insights",
      "Policy brief exports",
    ],
    ecosystemLinks: [
      "access-map",
      "accreditation",
      "care",
      "transport",
      "jobs",
      "life",
      "accessops",
    ],
    revenueModel: "Council, government, and enterprise reporting subscriptions",
    riskLevel: "medium",
    implementationComplexity: "high",
    priority: 5,
    complianceNotes:
      "No identifying user data; aggregation thresholds; no sale of personal health/disability data.",
    primaryCta: { label: "Request an intelligence briefing", href: "/intelligence#interest" },
    secondaryCta: { label: "Discuss a council report", href: "/intelligence#interest" },
    themeIcon: "BarChart3",
    href: "/intelligence",
  },
];

/** All MapAble verticals — existing and untapped. */
export const verticals: MapAbleVertical[] = [...existingVerticals, ...untappedVerticals];

export function getAllVerticals(): MapAbleVertical[] {
  return verticals;
}

export function getVerticalBySlug(slug: string): MapAbleVertical | undefined {
  return verticals.find((v) => v.slug === slug);
}

export function getVerticalById(id: string): MapAbleVertical | undefined {
  return verticals.find((v) => v.id === id);
}

export function getPriorityVerticals(): MapAbleVertical[] {
  return verticals
    .filter((v) => v.priority <= 2 && (v.status === "proposed" || v.status === "pilot"))
    .sort((a, b) => a.priority - b.priority);
}

export function getProposedVerticals(): MapAbleVertical[] {
  return verticals.filter((v) => v.status === "proposed" || v.status === "pilot");
}

export function getExistingVerticals(): MapAbleVertical[] {
  return verticals.filter((v) => v.status === "existing" || v.status === "planned");
}

export function getVerticalsByIds(ids: string[]): MapAbleVertical[] {
  return ids
    .map((id) => getVerticalById(id))
    .filter((v): v is MapAbleVertical => v !== undefined);
}

/** Untapped verticals in strategic priority order (PlanOps first). */
export const UNTAPPED_PRIORITY_ORDER = [
  "planops",
  "home",
  "accessops",
  "life",
  "transition",
  "ageing",
  "academy",
  "access-pass",
  "ready",
  "rights-navigator",
  "intelligence",
] as const;

export function getUntappedVerticalsInPriorityOrder(): MapAbleVertical[] {
  return UNTAPPED_PRIORITY_ORDER.map((id) => getVerticalById(id)).filter(
    (v): v is MapAbleVertical => v !== undefined,
  );
}
