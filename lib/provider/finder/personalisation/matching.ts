import type { CopilotProviderResult } from "@/lib/copilot/types";

export type FinderSearchScope = "providers" | "workers" | "both";

export type FinderSavedPreference = {
  enabled: boolean;
  location: string | null;
  supportType: string | null;
  language: string | null;
};

export type FinderDiscoveryMatch = {
  kind: "provider" | "worker";
  id: string;
  name: string;
  location: string;
  services: string[];
  reasons: string[];
  source: string;
  caution: string;
};

export type FinderDiscoveryPayload = {
  matches: FinderDiscoveryMatch[];
  scope: FinderSearchScope;
  personalised: boolean;
  workerNotice: string;
};

export type WorkerPublicCandidate = {
  id: string;
  displayName: string;
  profileSummary: string | null;
  serviceTypes: string[];
  serviceRegions: string[];
  languages: string[];
};

export function norm(value: string): string {
  return value.toLowerCase().normalize("NFKC").replace(/[_-]/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function containsPhrase(values: string[], query: string): boolean {
  const q = norm(query);
  if (!q) return false;
  return values.some((value) => {
    const n = norm(value);
    return n === q || n.includes(q) || q.includes(n) && n.length >= 4;
  });
}

function isGenericWorkerTerm(value: string): boolean {
  return /^(support workers?|care workers?|workers?|ndis support|care support)$/i.test(value.trim());
}

export function rankPublishedWorker(
  candidate: WorkerPublicCandidate,
  criteria: {
    explicitService?: string;
    explicitLocation?: string;
    preferredService?: string | null;
    preferredLocation?: string | null;
    preferredLanguage?: string | null;
  },
): { score: number; reasons: string[] } | null {
  const service = criteria.explicitService?.trim() ?? "";
  const location = criteria.explicitLocation?.trim() ?? "";
  const services = candidate.serviceTypes;
  const regions = candidate.serviceRegions;

  if (service && !isGenericWorkerTerm(service) && !containsPhrase(services, service)) return null;
  if (location && !containsPhrase(regions, location)) return null;

  const reasons: string[] = [];
  let score = 0;
  if (service && !isGenericWorkerTerm(service) && containsPhrase(services, service)) {
    score += 10;
    reasons.push("Worker-declared service matches the request");
  }
  if (location && containsPhrase(regions, location)) {
    score += 10;
    reasons.push("Worker-declared service region matches the request");
  }
  if (criteria.preferredService && containsPhrase(services, criteria.preferredService)) {
    score += 4;
    reasons.push("Matches saved service preference");
  }
  if (criteria.preferredLocation && containsPhrase(regions, criteria.preferredLocation)) {
    score += 3;
    reasons.push("Matches saved region preference");
  }
  if (criteria.preferredLanguage && containsPhrase(candidate.languages, criteria.preferredLanguage)) {
    score += 2;
    reasons.push("Matches saved language preference");
  }
  if (!reasons.length) reasons.push("Worker opted in to directory discovery");
  return { score, reasons };
}

export function rankDirectoryProvider(
  provider: CopilotProviderResult,
  preference: FinderSavedPreference | null,
): { score: number; match: FinderDiscoveryMatch } {
  let score = 0;
  const reasons: string[] = ["Returned by the NDIS directory search"];
  if (preference?.enabled && preference.location &&
    containsPhrase([provider.locationLabel ?? "", provider.suburb ?? "", provider.state ?? "", provider.postcode ?? ""], preference.location)) {
    score += 4;
    reasons.push("Matches saved broad location");
  }
  if (preference?.enabled && preference.supportType &&
    containsPhrase([...provider.services, ...provider.registrationGroups], preference.supportType)) {
    score += 5;
    reasons.push("Matches saved support type");
  }
  return {
    score,
    match: {
      kind: "provider",
      id: provider.id,
      name: provider.name,
      location: provider.locationLabel ?? "Location not specified",
      services: provider.services,
      reasons,
      source: "Imported NDIS Provider Finder record",
      caution: "Directory presence does not establish current registration, accessibility, capacity or suitability.",
    },
  };
}
