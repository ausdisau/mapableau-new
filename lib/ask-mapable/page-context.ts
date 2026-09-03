/**
 * Typed page context for Ask MapAble — never send DOM/HTML to the model.
 */

export type MapAbleModule =
  | "access"
  | "care"
  | "transport"
  | "jobs"
  | "foods"
  | "moves"
  | "marketplace"
  | "core"
  | "billing"
  | "ask";

export type AskPageContext = {
  pathname: string;
  mapableModule?: MapAbleModule;
};

export type AskStarter = {
  id: string;
  label: string;
  prompt: string;
  href?: string;
};

const MODULE_BY_PREFIX: Array<{ prefix: string; module: MapAbleModule }> = [
  { prefix: "/access", module: "access" },
  { prefix: "/accessibility-map", module: "access" },
  { prefix: "/go", module: "transport" },
  { prefix: "/transport", module: "transport" },
  { prefix: "/care", module: "care" },
  { prefix: "/jobs", module: "jobs" },
  { prefix: "/employment", module: "jobs" },
  { prefix: "/foods", module: "foods" },
  { prefix: "/moves", module: "moves" },
  { prefix: "/marketplace", module: "marketplace" },
  { prefix: "/billing", module: "billing" },
  { prefix: "/ask", module: "ask" },
  { prefix: "/provider-finder", module: "care" },
  { prefix: "/my", module: "core" },
];

export function resolveMapAbleModule(pathname: string): MapAbleModule {
  const path = pathname.split("?")[0] || "/";
  for (const row of MODULE_BY_PREFIX) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.module;
    }
  }
  return "core";
}

export function parseAskPageContext(raw: unknown): AskPageContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const pathname = typeof o.pathname === "string" ? o.pathname.slice(0, 200) : "";
  if (!pathname) return undefined;
  const mapableModule =
    typeof o.mapableModule === "string" &&
    [
      "access",
      "care",
      "transport",
      "jobs",
      "foods",
      "moves",
      "marketplace",
      "core",
      "billing",
      "ask",
    ].includes(o.mapableModule)
      ? (o.mapableModule as MapAbleModule)
      : resolveMapAbleModule(pathname);
  return { pathname, mapableModule };
}

const DEFAULT_STARTERS: AskStarter[] = [
  {
    id: "find-place",
    label: "Find an accessible place",
    prompt:
      "Help me find an accessible place. I need step-free entrance and an accessible toilet.",
  },
  {
    id: "plan-journey",
    label: "Plan an accessible journey",
    prompt: "Help me plan an accessible journey with my access requirements kept as hard requirements.",
  },
  {
    id: "describe-support",
    label: "Help me describe the support I need",
    prompt: "Help me describe the support I need in plain language without asking for a diagnosis.",
  },
  {
    id: "explain-options",
    label: "Explain my MapAble options",
    prompt: "Explain my MapAble options for accessibility, care, transport and jobs.",
  },
  {
    id: "talk-person",
    label: "Talk to a person",
    prompt: "I want to talk to a person from MapAble support.",
    href: "/contact",
  },
];

const BY_MODULE: Partial<Record<MapAbleModule, AskStarter[]>> = {
  access: [
    {
      id: "find-place",
      label: "Find an accessible place",
      prompt:
        "Find an accessible place. Keep all of my access requirements as hard requirements.",
    },
    {
      id: "explain-evidence",
      label: "Explain accessibility evidence",
      prompt:
        "Explain how MapAble shows accessibility evidence and what UNKNOWN or CONFLICTING means.",
    },
    {
      id: "report-barrier",
      label: "Report an access barrier",
      prompt: "Help me report an access barrier I experienced.",
      href: "/access",
    },
    {
      id: "talk-person",
      label: "Talk to a person",
      prompt: "I want to talk to a person from MapAble support.",
      href: "/contact",
    },
  ],
  transport: [
    {
      id: "plan-journey",
      label: "Plan an accessible journey",
      prompt: "Plan an accessible journey. Do not relax my hard access requirements.",
    },
    {
      id: "transport-options",
      label: "Explain transport options",
      prompt: "Explain accessible transport options on MapAble.",
    },
    {
      id: "check-access",
      label: "Check my access requirements",
      prompt: "Help me check that my access requirements will be preserved for this trip.",
    },
    {
      id: "talk-person",
      label: "Talk to a person",
      prompt: "I want to talk to a person from MapAble support.",
      href: "/contact",
    },
  ],
  jobs: [
    {
      id: "inclusive-work",
      label: "Find inclusive work",
      prompt: "Help me find inclusive work and discuss workplace adjustments without inferring capability from disability.",
    },
    {
      id: "workplace-adjustments",
      label: "Discuss workplace adjustments",
      prompt: "Help me describe workplace adjustments I may need.",
    },
    {
      id: "transport-to-work",
      label: "Plan transport to work",
      prompt: "Help me plan accessible transport to work.",
    },
    {
      id: "talk-person",
      label: "Talk to a person",
      prompt: "I want to talk to a person from MapAble support.",
      href: "/contact",
    },
  ],
  care: [
    {
      id: "describe-support",
      label: "Help me describe the support I need",
      prompt: "Help me describe the support I need using functional needs, not diagnosis.",
    },
    {
      id: "find-provider",
      label: "Find a provider",
      prompt: "Help me find a suitable provider near me.",
      href: "/provider-finder",
    },
    {
      id: "talk-person",
      label: "Talk to a person",
      prompt: "I want to talk to a person from MapAble support.",
      href: "/contact",
    },
  ],
  billing: [
    {
      id: "explain-invoice",
      label: "Explain an invoice",
      prompt: "Help me understand an invoice in plain language. Do not approve or submit any claim.",
    },
    {
      id: "talk-person",
      label: "Talk to a person",
      prompt: "I want to talk to a person from MapAble support.",
      href: "/contact",
    },
  ],
};

export function startersForPageContext(
  context?: AskPageContext | null,
): AskStarter[] {
  const mod = context?.mapableModule ?? (context?.pathname
    ? resolveMapAbleModule(context.pathname)
    : "core");
  return BY_MODULE[mod] ?? DEFAULT_STARTERS;
}

export const ASK_MAPABLE_EMPTY_STATE = {
  title: "What would you like help with?",
  body: "You can ask about accessibility, transport, support, MapAble services, NDIS information, jobs or your existing MapAble account information.",
  subtitle: "Accessible information, planning and support across MapAble.",
} as const;
