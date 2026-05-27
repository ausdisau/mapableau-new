import {
  searchWorkerMarketplaceCandidates,
} from "@/lib/search/provider-search-service";
import {
  type WorkerMarketplaceCandidate,
  type WorkerSearchFilters,
  type WorkerSearchStreamEvent,
  type WorkerSearchStreamResult,
} from "@/lib/search/worker-search-types";

type StreamParams = {
  query: string;
  filters?: WorkerSearchFilters;
  onEvent?: (event: WorkerSearchStreamEvent) => void | Promise<void>;
};

const SERVICE_KEYWORDS = [
  "personal care",
  "transport",
  "therapy",
  "nursing",
  "support coordination",
];

const LANGUAGE_KEYWORDS = [
  "english",
  "arabic",
  "mandarin",
  "cantonese",
  "hindi",
  "vietnamese",
  "spanish",
];

export async function runWorkerSearchStream({
  query,
  filters,
  onEvent,
}: StreamParams): Promise<WorkerSearchStreamResult> {
  const normalizedQuery = query.trim();
  await emit(onEvent, {
    stage: "received_query",
    message: "Received your worker search request.",
    payload: { query: normalizedQuery },
  });

  const mergedFilters = mergeFilters(
    inferFiltersFromQuery(normalizedQuery),
    filters ?? {},
    normalizedQuery,
  );

  await emit(onEvent, {
    stage: "parsed_filters",
    message: "Parsed your preferences and search filters.",
    payload: mergedFilters as unknown as Record<string, unknown>,
  });

  const allCandidates = await searchWorkerMarketplaceCandidates(mergedFilters);
  const workerCount = allCandidates.filter((item) => item.kind === "worker").length;
  const providerCount = allCandidates.filter((item) => item.kind === "provider").length;

  await emit(onEvent, {
    stage: "fetched_workers",
    message: `Found ${workerCount} worker profile matches.`,
    payload: { count: workerCount },
  });
  await emit(onEvent, {
    stage: "fetched_providers",
    message: `Found ${providerCount} provider and agency matches.`,
    payload: { count: providerCount },
  });

  await emit(onEvent, {
    stage: "ranking_candidates",
    message: "Ranking candidates by relevance and profile fit.",
  });

  const ranked = rankCandidates(allCandidates, mergedFilters, normalizedQuery);

  await emit(onEvent, {
    stage: "finalized_results",
    message: `Prepared ${ranked.length} ranked results.`,
    payload: { count: ranked.length },
  });

  return {
    filters: mergedFilters,
    candidates: ranked,
  };
}

function inferFiltersFromQuery(query: string): WorkerSearchFilters {
  const lower = query.toLowerCase();
  const inferred: WorkerSearchFilters = {};

  const serviceType = SERVICE_KEYWORDS.find((keyword) => lower.includes(keyword));
  if (serviceType) inferred.serviceType = serviceType;

  const language = LANGUAGE_KEYWORDS.find((keyword) => lower.includes(keyword));
  if (language) inferred.language = language;

  const inRegionMatch = lower.match(/\bin\s+([a-z\s]{2,40})$/i);
  if (inRegionMatch?.[1]) {
    inferred.serviceRegion = inRegionMatch[1].trim();
  }

  return inferred;
}

function mergeFilters(
  inferred: WorkerSearchFilters,
  explicit: WorkerSearchFilters,
  query: string,
): WorkerSearchFilters {
  return {
    query: explicit.query ?? query,
    serviceType: explicit.serviceType ?? inferred.serviceType,
    language: explicit.language ?? inferred.language,
    serviceRegion: explicit.serviceRegion ?? inferred.serviceRegion,
    verificationStatus: explicit.verificationStatus,
    organisationType: explicit.organisationType,
    wheelchairAccessible: explicit.wheelchairAccessible,
  };
}

function rankCandidates(
  candidates: WorkerMarketplaceCandidate[],
  filters: WorkerSearchFilters,
  query: string,
): WorkerMarketplaceCandidate[] {
  return [...candidates]
    .map((candidate) => ({
      ...candidate,
      score: computeCandidateScore(candidate, filters, query),
    }))
    .sort((a, b) => {
      if ((b.score ?? 0) !== (a.score ?? 0)) {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      return a.displayName.localeCompare(b.displayName);
    });
}

function computeCandidateScore(
  candidate: WorkerMarketplaceCandidate,
  filters: WorkerSearchFilters,
  query: string,
): number {
  let score = candidate.kind === "worker" ? 20 : 15;
  const lowerQuery = query.toLowerCase();

  if (lowerQuery) {
    if (candidate.displayName.toLowerCase().includes(lowerQuery)) score += 20;
    if ((candidate.summary ?? "").toLowerCase().includes(lowerQuery)) score += 12;
  }

  if (filters.serviceType && candidate.serviceTypes.includes(filters.serviceType)) {
    score += 18;
  }
  if (filters.language && candidate.languages.includes(filters.language)) {
    score += 12;
  }
  if (
    filters.serviceRegion &&
    candidate.serviceRegions.some(
      (region) => region.toLowerCase() === filters.serviceRegion?.toLowerCase(),
    )
  ) {
    score += 16;
  }

  if (candidate.verificationStatus === "verified") score += 6;

  return score;
}

async function emit(
  onEvent: StreamParams["onEvent"],
  event: WorkerSearchStreamEvent,
) {
  if (!onEvent) return;
  await onEvent(event);
}
