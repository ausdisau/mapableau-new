export type LiveFeedSourceKind = "bms_http" | "demo" | "manual" | "last_known";

/** Operational feed status (distinct from LiveIncident.status). */
export type LiveFeedStatus =
  | "operational"
  | "degraded"
  | "unavailable"
  | "unknown"
  | "resolved";

export type LiveStatusObservation = {
  placeId: string;
  subjectKind: "feature" | "element" | "segment" | "place";
  subjectId: string;
  status: LiveFeedStatus;
  summary: string;
  observedAt: string;
  sourceKind: LiveFeedSourceKind;
  sourceId: string;
  confidence: number;
  payload?: Record<string, unknown>;
};

export type LiveStatusQuery = {
  placeId: string;
  subjectKind?: LiveStatusObservation["subjectKind"];
  subjectId?: string;
};

/**
 * Typed adapter contract for building-management / status feeds.
 * Implementations must never throw for missing upstream data — return [] and let
 * the resolver fall back to last-known evidence.
 */
export interface LiveStatusAdapter {
  readonly id: string;
  readonly kind: LiveFeedSourceKind;
  fetchObservations(query: LiveStatusQuery): Promise<LiveStatusObservation[]>;
}

export type ResolvedLiveStatus = {
  observation: LiveStatusObservation | null;
  resolution: "live" | "last_known_snapshot" | "last_known_evidence" | "unavailable";
  reason: string;
};

export function feedKeyForSubject(
  subjectKind: LiveStatusObservation["subjectKind"],
  subjectId: string,
): string {
  return `${subjectKind}:${subjectId}`;
}
