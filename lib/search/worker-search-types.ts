export type WorkerSearchFilters = {
  serviceRegion?: string;
  serviceType?: string;
  wheelchairAccessible?: boolean;
  verificationStatus?: string;
  language?: string;
  organisationType?: string;
  query?: string;
};

export type WorkerMarketplaceCandidate = {
  id: string;
  kind: "worker" | "provider";
  displayName: string;
  serviceTypes: string[];
  serviceRegions: string[];
  languages: string[];
  verificationStatus: string | null;
  summary: string | null;
  score?: number;
};

export type WorkerSearchStreamStage =
  | "received_query"
  | "parsed_filters"
  | "fetched_workers"
  | "fetched_providers"
  | "ranking_candidates"
  | "finalized_results";

export type WorkerSearchStreamEvent = {
  stage: WorkerSearchStreamStage;
  message: string;
  payload?: Record<string, unknown>;
};

export type WorkerSearchStreamResult = {
  filters: WorkerSearchFilters;
  candidates: WorkerMarketplaceCandidate[];
};
