/**
 * Pluggable vector search over Access reviews/reports.
 * v1: no-op — keyword/structured search is used instead.
 */

export type AccessEvidenceVectorHit = {
  placeId: string;
  score: number;
  snippet?: string;
};

export type AccessEvidenceVectorFilters = {
  placeIds?: string[];
  limit?: number;
};

export interface AccessEvidenceVectorStore {
  search(
    queryEmbedding: number[],
    filters?: AccessEvidenceVectorFilters,
  ): Promise<AccessEvidenceVectorHit[]>;
  isEnabled(): boolean;
}

export class NoOpAccessEvidenceVectorStore implements AccessEvidenceVectorStore {
  isEnabled(): boolean {
    return false;
  }

  async search(
    _queryEmbedding: number[],
    _filters?: AccessEvidenceVectorFilters,
  ): Promise<AccessEvidenceVectorHit[]> {
    return [];
  }
}

let store: AccessEvidenceVectorStore = new NoOpAccessEvidenceVectorStore();

export function getAccessEvidenceVectorStore(): AccessEvidenceVectorStore {
  return store;
}

/** Test / future wiring. */
export function setAccessEvidenceVectorStore(
  next: AccessEvidenceVectorStore,
): void {
  store = next;
}
