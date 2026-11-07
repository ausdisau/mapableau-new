import type { RaguStatus } from "@/lib/access-signals/ragu";

export type AccessDomain = "physical" | "sensory" | "cognitive";

export type DemoSegment = {
  id: string;
  number: number;
  name: string;
  status: RaguStatus;
  domain: AccessDomain;
  summary: string;
};

export type DemoRoute = {
  id: string;
  name: string;
  description: string;
  synthetic: true;
  published: false;
  segments: DemoSegment[];
};

export type RemediationIssue = {
  id: string;
  routeId: string;
  routeName: string;
  title: string;
  status: RaguStatus;
  domain: AccessDomain;
  domainLabel: string;
  source: string;
  observedOn: string;
  verification: "pending" | "verified_synthetic";
  owner: string;
  nextStep: string;
  reinspection: string;
  scopedClaim: string;
};

export const ACCESS_SIGNALS_DEMO_DATE_LABEL = "7 November 2026";

export const DEMO_ROUTES: readonly DemoRoute[] = [
  {
    id: "demo-route-a",
    name: "Demo route A",
    description:
      "From demo crossing to demo entrance. A short, fictional route with synthetic access findings for demonstration only.",
    synthetic: true,
    published: false,
    segments: [
      {
        id: "a-path",
        number: 1,
        name: "Path to entrance",
        status: "amber",
        domain: "physical",
        summary: "Assistance may be needed at a narrow point.",
      },
      {
        id: "a-approach",
        number: 2,
        name: "Entrance approach",
        status: "unknown",
        domain: "physical",
        summary: "Entrance approach needs an assessment.",
      },
      {
        id: "a-crossing",
        number: 3,
        name: "Crossing approach",
        status: "red",
        domain: "physical",
        summary: "Scoped route barrier at the crossing approach.",
      },
    ],
  },
  {
    id: "demo-route-b",
    name: "Demo route B",
    description: "Fictional wayfinding sample — not a real place.",
    synthetic: true,
    published: false,
    segments: [
      {
        id: "b-wayfinding",
        number: 1,
        name: "Wayfinding",
        status: "amber",
        domain: "cognitive",
        summary: "Information and navigation may need review.",
      },
    ],
  },
  {
    id: "demo-route-c",
    name: "Demo route C",
    description: "Fictional entrance sample — not a real place.",
    synthetic: true,
    published: false,
    segments: [
      {
        id: "c-entrance",
        number: 1,
        name: "Entrance",
        status: "unknown",
        domain: "physical",
        summary: "Access and circulation not yet verified.",
      },
    ],
  },
] as const;

export const REMEDIATION_ISSUES: readonly RemediationIssue[] = [
  {
    id: "issue-crossing",
    routeId: "demo-route-a",
    routeName: "Demo route A",
    title: "Crossing approach",
    status: "red",
    domain: "physical",
    domainLabel: "Physical access",
    source: "synthetic observation · 7 Nov 2026",
    observedOn: "7 Nov 2026",
    verification: "pending",
    owner: "not yet confirmed",
    nextStep: "investigate accessible crossing options",
    reinspection: "not scheduled",
    scopedClaim: "Red · scoped route barrier",
  },
  {
    id: "issue-wayfinding",
    routeId: "demo-route-b",
    routeName: "Demo route B",
    title: "Wayfinding",
    status: "amber",
    domain: "cognitive",
    domainLabel: "Information and navigation",
    source: "synthetic observation · 7 Nov 2026",
    observedOn: "7 Nov 2026",
    verification: "pending",
    owner: "not yet confirmed",
    nextStep: "review wayfinding cues and plain-language options",
    reinspection: "not scheduled",
    scopedClaim: "Amber · potential barrier",
  },
  {
    id: "issue-entrance",
    routeId: "demo-route-c",
    routeName: "Demo route C",
    title: "Entrance",
    status: "unknown",
    domain: "physical",
    domainLabel: "Access and circulation",
    source: "synthetic observation · 7 Nov 2026",
    observedOn: "7 Nov 2026",
    verification: "pending",
    owner: "not yet confirmed",
    nextStep: "collect entrance measurements and evidence",
    reinspection: "not scheduled",
    scopedClaim: "Unknown · evidence needed",
  },
] as const;

export function getDemoRoute(id: string): DemoRoute | undefined {
  return DEMO_ROUTES.find((route) => route.id === id);
}

export function assertDemoNeverPublished(
  routes: readonly DemoRoute[] = DEMO_ROUTES,
): boolean {
  return routes.every((route) => route.synthetic && route.published === false);
}
