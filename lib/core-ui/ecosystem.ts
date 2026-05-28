export type CoreEcosystemStatus = "roadmap";

export type CoreEcosystemApp = {
  id: string;
  name: string;
  description: string;
  status: CoreEcosystemStatus;
  href?: never;
};

/** Satellite apps from the MapAble Master Business Plan — roadmap only (no live routes). */
export const CORE_ECOSYSTEM_APPS: CoreEcosystemApp[] = [
  {
    id: "independence",
    name: "MapAble Independence",
    description:
      "Daily living, assistive technology and skill-building tools so participants can live more independently with dignity.",
    status: "roadmap",
  },
  {
    id: "moves",
    name: "MapAble Moves",
    description:
      "Mobility and journey planning that connects with transport services — door-to-door, accessible vehicles and trip coordination.",
    status: "roadmap",
  },
  {
    id: "emergency",
    name: "MapAble Emergency",
    description:
      "Fast access to urgent help, safety contacts and escalation paths when something goes wrong — without replacing emergency services.",
    status: "roadmap",
  },
  {
    id: "foods",
    name: "MapAble Foods",
    description:
      "Meal delivery and nutrition support tailored to dietary needs, NDIS meal plans and accessible ordering.",
    status: "roadmap",
  },
  {
    id: "news",
    name: "MapAble News",
    description:
      "Disability news, policy updates and community stories in plain language — curated, not algorithmic.",
    status: "roadmap",
  },
];

export const CORE_ECOSYSTEM_SECTION = {
  id: "ecosystem",
  title: "Ecosystem roadmap",
  description:
    "Satellite apps interconnect through MapAble Core. These are planned extensions — not live products yet.",
} as const;
