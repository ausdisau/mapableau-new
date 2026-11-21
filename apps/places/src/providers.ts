/**
 * Local-only search over a privacy-minimised public provider-directory snapshot.
 * Organisation listing != current NDIS registration != individual worker clearance.
 * No network calls, persistent search history or GPS access are made here.
 */
export type OfflineProvider = {
  id: string;
  name: string;
  suburb: string;
  state: string;
  postcode: string;
  categories: string[];
};
export type ProviderDirectory = {
  schema: "mapable.offline-provider-directory.v1";
  generatedAt: string;
  source: string;
  disclaimer: string;
  inputRows: number;
  excludedRows: number;
  providerCount: number;
  providers: OfflineProvider[];
};

export type ServiceFilter = "all" | "daily-life" | "coordination" | "therapy" | "transport" | "housing" | "employment";
export type SearchFilters = {
  query: string;
  state: string;
  service: ServiceFilter;
};
export const SERVICE_OPTIONS: { value: ServiceFilter; label: string }[] = [
  { value: "all", label: "All supports" },
  { value: "daily-life", label: "Daily life" },
  { value: "coordination", label: "Coordination" },
  { value: "therapy", label: "Therapy" },
  { value: "transport", label: "Transport" },
  { value: "housing", label: "Housing / SDA" },
  { value: "employment", label: "Employment" },
];

/** Source categories are NDIS registration-group labels from the imported
 * snapshot, not assurance of live accreditation, funding or availability. */
const SERVICE_TERMS: Record<Exclude<ServiceFilter, "all">, RegExp> = {
  "daily-life": /daily (personal|life)|household tasks|group (and|\/) centre/i,
  coordination: /coordinating or managing life stages|support coordination/i,
  therapy: /therapeutic supports|exercise physiology/i,
  transport: /travel\/transport arrangements|driving training/i,
  housing: /specialist disability accommodation|accommodation \/ tenancy/i,
  employment: /employment|education/i,
};

const ALIASES: [RegExp, Exclude<ServiceFilter, "all">][] = [
  [/\b(support worker|carer|personal care|daily living|personal support)\b/i, "daily-life"],
  [/\b(support coordinat|coordination|support navigator)\w*/i, "coordination"],
  [/\b(therap|occupational therap|physiotherap|speech therap|allied health)\w*/i, "therapy"],
  [/\b(transport|travel assistance|driver)\b/i, "transport"],
  [/\b(sda|housing|accommodation|independent living)\b/i, "housing"],
  [/\b(job|jobs|employment|workplace)\b/i, "employment"],
];

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];

export function interpretProviderQuestion(question: string): {
  state: string | null; postcode: string | null; service: ServiceFilter; nameTerms: string;
} {
  const value = question.trim().slice(0, 300);
  const service = ALIASES.find(([pattern]) => pattern.test(value))?.[1] ?? "all";
  const postcode = value.match(/\b\d{4}\b/)?.[0] ?? null;
  const state = STATES.find(s => new RegExp("\\b" + s + "\\b", "i").test(value)) ?? null;
  // Words are used as local text terms only; no external model or endpoint.
  const nameTerms = value.replace(/\b(?:find|show|me|near|in|around|for|the|please|with|providers?|services?|organisations?|workers?|support|and|a|an)\b/gi, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/\b(?:NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b/gi, " ")
    .replace(/\s+/g, " ").trim();
  return { state, postcode, service, nameTerms: service !== "all" ? "" : nameTerms };
}

export function matchingProviders(
  providers: readonly OfflineProvider[],
  filters: SearchFilters,
): OfflineProvider[] {
  const query = filters.query.trim().toLocaleLowerCase("en-AU");
  const state = filters.state.toUpperCase();
  const service = filters.service;
  return providers.filter(provider => {
    if (state !== "ALL" && provider.state !== state) return false;
    if (service !== "all" && !provider.categories.some(label => SERVICE_TERMS[service].test(label))) return false;
    const haystack = [provider.name, provider.suburb, provider.postcode, provider.state, ...provider.categories]
      .join(" ").toLocaleLowerCase("en-AU");
    return !query || query.split(/\s+/).every(word => haystack.includes(word));
  });
}

export function publicOpenStreetMapSearch(provider: OfflineProvider): string {
  // Suburb-only lookup: never invent a street location or show a private address.
  const location = [provider.suburb, provider.state, provider.postcode, "Australia"]
    .filter(Boolean).join(", ");
  return "https://www.openstreetmap.org/search?query=" + encodeURIComponent(location);
}
