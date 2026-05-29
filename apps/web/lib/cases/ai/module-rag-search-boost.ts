import {
  retrieveInterdependentModuleRag,
  type InterdependentRagResult,
} from "@/lib/rag";
import type { ConsentScope } from "@/lib/prms/types";
import { scoreText } from "@/lib/rag/scoring";

import { searchCases } from "./nl-search";
import type { AISearchHit, CaseSnapshot } from "./types";

export type CaseSearchOptions = {
  /** When set, loads interdependent RAG packs for the participant. */
  participantId?: string;
  grantedScopes?: ConsentScope[];
  /** Default true when participantId and scopes are provided. */
  useModuleRag?: boolean;
};

export async function searchCasesWithModuleRag(
  query: string,
  candidates: CaseSnapshot[],
  options?: CaseSearchOptions
): Promise<AISearchHit[]> {
  const baseline = searchCases(query, candidates);

  const useRag =
    options?.useModuleRag !== false &&
    Boolean(options?.participantId && options?.grantedScopes?.length);

  if (!useRag || !options?.participantId || !options.grantedScopes) {
    return baseline;
  }

  const rag = await retrieveInterdependentModuleRag({
    participantId: options.participantId,
    query,
    originModule: "cases",
    grantedScopes: options.grantedScopes,
  });

  return applyModuleRagBoost(baseline, candidates, rag);
}

export function applyModuleRagBoost(
  hits: AISearchHit[],
  candidates: CaseSnapshot[],
  rag: InterdependentRagResult
): AISearchHit[] {
  if (!rag.chunks.length || hits.length === 0) return hits;

  const boosted = hits.map((hit) => {
    const snapshot = candidates.find((c) => c.id === hit.caseId);
    if (!snapshot) return hit;

    let boost = 0;
    for (const chunk of rag.chunks) {
      const overlap = scoreText(
        `${snapshot.title} ${snapshot.description} ${snapshot.category}`,
        chunk.text
      );
      if (overlap > 0) boost += 0.35 * overlap;
      for (const term of hit.matchedTerms) {
        if (chunk.text.toLowerCase().includes(term.toLowerCase())) {
          boost += 0.2;
        }
      }
    }

    if (boost === 0) return hit;
    return {
      ...hit,
      score: Number((hit.score + boost).toFixed(2)),
      matchedTerms: [
        ...hit.matchedTerms,
        ...rag.modulesQueried.map((m) => `module:${m}`),
      ],
    };
  });

  return boosted.sort((a, b) => b.score - a.score);
}
