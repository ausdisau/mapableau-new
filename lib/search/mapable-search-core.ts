/**
 * MapAble Search: pure public-discovery contract. No registration or worker
 * screening inference, no user profiles and no external calls.
 */
export type MapAbleVertical = "all" | "providers" | "care" | "transport" | "jobs";
export type MapAbleResultKind = "module" | "provider_outlet";

export type MapAbleSearchInput = {
  q: string;
  vertical: MapAbleVertical;
  state?: string;
  postcode?: string;
};

export type MapAbleSearchHit = {
  id: string;
  kind: MapAbleResultKind;
  vertical: Exclude<MapAbleVertical, "all">;
  title: string;
  description: string;
  href: string;
  provenance: "mapable_navigation" | "local_ndis_directory_import";
  sourceLabel: string;
  sourceUrl?: string;
  directoryUpdatedAt?: string;
  registration: "not_independently_verified";
  workerScreening: "not_independently_verified";
  accessFit: "unknown";
  availability: "unknown";
};

export type MapAbleSearchResponse = {
  results: MapAbleSearchHit[];
  sourceState: "navigation_only" | "imported_provider_index" | "partial";
  providerIndexEnabled: boolean;
  warnings: string[];
  resultCount: number;
};

export type ImportedNdisProviderRow = {
  source_id: string;
  provider_name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  services?: string[] | null;
  updated_at?: string | Date | null;
  is_demo?: boolean;
};

type ModuleDefinition = {
  id: string;
  vertical: Exclude<MapAbleVertical, "all">;
  title: string;
  description: string;
  href: string;
  terms: readonly string[];
};

const MODULES: readonly ModuleDefinition[] = [
  {
    id: "provider-finder",
    vertical: "providers",
    title: "Provider Finder",
    description: "Explore NDIS provider directory outlets and check the evidence before contacting a service.",
    href: "/provider-finder",
    terms: ["provider", "find", "ndis", "service", "organisation", "support", "outlet"],
  },
  {
    id: "care",
    vertical: "care",
    title: "MapAble Care",
    description: "Explore disability support and coordination pathways. Service matching remains human-controlled.",
    href: "/care",
    terms: ["care", "support", "worker", "personal", "daily", "home", "aac", "communication"],
  },
  {
    id: "transport",
    vertical: "transport",
    title: "MapAble Transport",
    description: "Explore accessible journey and transport options. Verify vehicle and assistance requirements before booking.",
    href: "/transport",
    terms: ["transport", "travel", "journey", "wheelchair", "vehicle", "driver", "bus", "train", "taxi", "mobility", "work"],
  },
  {
    id: "jobs",
    vertical: "jobs",
    title: "MapAble Employment",
    description: "Explore inclusive employment pathways with job-seeker disclosure and adjustments under their control.",
    href: "/employment",
    terms: ["job", "jobs", "work", "employment", "career", "employer", "adjustment", "workplace", "inclusive"],
  },
];

export function searchTokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 1)
    .slice(0, 24);
}

function matchesQuery(module: ModuleDefinition, q: string): boolean {
  if (!q.trim()) return true;
  const haystack = [module.title, module.description, ...module.terms].join(" ").toLowerCase();
  return searchTokens(q).some((term) => haystack.includes(term));
}

/** No personal records, accounts, model calls or external network fetches. */
export function navigationSearch(input: MapAbleSearchInput): MapAbleSearchHit[] {
  return MODULES.filter(
    (module) =>
      (input.vertical === "all" || input.vertical === module.vertical) &&
      matchesQuery(module, input.q),
  ).map((module) => ({
    id: module.id,
    kind: "module",
    vertical: module.vertical,
    title: module.title,
    description: module.description,
    href: module.href,
    provenance: "mapable_navigation",
    sourceLabel: "MapAble public module navigation",
    registration: "not_independently_verified",
    workerScreening: "not_independently_verified",
    accessFit: "unknown",
    availability: "unknown",
  }));
}

function validDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

/** Preserve outlet identity; directory import is not live Commission registration. */
export function importedProviderHits(rows: ImportedNdisProviderRow[]): MapAbleSearchHit[] {
  const seen = new Set<string>();
  const hits: MapAbleSearchHit[] = [];
  for (const row of rows) {
    if (row.is_demo || !row.source_id?.trim() || !row.provider_name?.trim()) continue;
    if (seen.has(row.source_id)) continue;
    seen.add(row.source_id);
    const locality = [row.suburb, row.state, row.postcode].filter(Boolean).join(" ");
    hits.push({
      id: `ndis-outlet:${row.source_id}`,
      kind: "provider_outlet",
      vertical: "providers",
      title: row.provider_name,
      description: locality
        ? `Directory listing in ${locality}. Access features, availability and current registration need confirmation.`
        : "Imported provider outlet. Location, availability and registration require confirmation.",
      href: `/provider-finder?q=${encodeURIComponent(row.provider_name)}`,
      provenance: "local_ndis_directory_import",
      sourceLabel: "Locally imported NDIS Provider Finder outlet (not a live Commission check)",
      sourceUrl: "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder",
      directoryUpdatedAt: validDate(row.updated_at),
      registration: "not_independently_verified",
      workerScreening: "not_independently_verified",
      accessFit: "unknown",
      availability: "unknown",
    });
  }
  return hits;
}

export function combineSearchHits(
  modules: MapAbleSearchHit[],
  providerOutlets: MapAbleSearchHit[],
): MapAbleSearchHit[] {
  const seen = new Set<string>();
  return [...providerOutlets, ...modules].filter((hit) => {
    if (seen.has(hit.id)) return false;
    seen.add(hit.id);
    return true;
  });
}
