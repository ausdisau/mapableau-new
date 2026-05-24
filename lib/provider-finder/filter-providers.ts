import type {
  AccessNeed,
  ProviderProfile,
  ProviderSearchFilters,
  SupportArea,
} from "./types";

const SUPPORT_AREA_MATCH: Record<
  Exclude<SupportArea, "all">,
  (p: ProviderProfile) => boolean
> = {
  "personal-care": (p) =>
    /personal care|daily life|home help/i.test(`${p.category} ${p.description}`),
  transport: (p) => /transport/i.test(`${p.category} ${p.description}`),
  therapy: (p) => /therapy|OT|speech/i.test(`${p.category} ${p.description}`),
  employment: (p) => /employment|works/i.test(`${p.category} ${p.description}`),
  "home-help": (p) => /home help|daily life|modifications/i.test(`${p.category} ${p.description}`),
};

const ACCESS_LABELS: Record<AccessNeed, string> = {
  wheelchair: "wheelchair",
  auslan: "auslan",
  "low-sensory": "sensory",
  hoist: "hoist",
  complex: "complex",
};

const FUNDING_MATCH: Record<
  Exclude<ProviderSearchFilters["fundingType"], "all">,
  (p: ProviderProfile) => boolean
> = {
  ndis: (p) => /ndis registered/i.test(p.funding),
  "plan-managed": (p) => /plan-managed/i.test(p.funding),
  "self-managed": (p) => /self-managed/i.test(p.funding),
  private: (p) => /private/i.test(p.funding),
};

function matchesQuery(p: ProviderProfile, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    p.name,
    p.category,
    p.suburb,
    p.postcode,
    p.description,
    p.serviceArea,
    ...p.accessNeeds,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesLocation(p: ProviderProfile, location: string) {
  const loc = location.trim().toLowerCase();
  if (!loc) return true;
  return (
    p.suburb.toLowerCase().includes(loc) ||
    (p.postcode ?? "").includes(loc) ||
    (p.serviceArea ?? "").toLowerCase().includes(loc)
  );
}

export function filterProviders(
  providers: ProviderProfile[],
  filters: ProviderSearchFilters,
): ProviderProfile[] {
  return providers.filter((p) => {
    if (!matchesQuery(p, filters.query)) return false;
    if (!matchesLocation(p, filters.location)) return false;

    if (filters.supportArea !== "all") {
      if (!SUPPORT_AREA_MATCH[filters.supportArea](p)) return false;
    }

    for (const need of filters.accessNeeds) {
      const token = ACCESS_LABELS[need];
      const hasNeed = p.accessNeeds.some((a) => a.toLowerCase().includes(token));
      if (!hasNeed) return false;
    }

    if (filters.fundingType !== "all") {
      if (!FUNDING_MATCH[filters.fundingType](p)) return false;
    }

    return true;
  });
}

/** Pick at most one sponsored result to show after organic results. */
export function selectSponsoredResult(
  providers: ProviderProfile[],
): ProviderProfile | null {
  const sponsored = providers.filter((p) => p.featured);
  return sponsored[0] ?? null;
}
