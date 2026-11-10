/**
 * Retrieve Care blueprint requirement chunks.
 * Uses OpenSearch when configured; otherwise falls back to in-process seed
 * (so eng evals work without a cluster).
 */

import { isOpenSearchConfigured } from "@/lib/config/opensearch";
import {
  CARE_BLUEPRINT_INDEX_V1,
  CARE_BLUEPRINT_SEARCH_FIELDS,
  CARE_BLUEPRINT_SEED_CHUNKS,
} from "@/lib/search/care-blueprint-index";
import { openSearchFetch } from "@/lib/search/opensearch-client";

export type BlueprintHit = {
  sectionId: string;
  sectionTitle: string;
  category: string;
  content: string;
  invariants: string;
  score: number;
  source: "opensearch" | "seed";
};

function scoreSeed(query: string): BlueprintHit[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
  return CARE_BLUEPRINT_SEED_CHUNKS.map((chunk) => {
    const hay = `${chunk.sectionTitle} ${chunk.content} ${chunk.invariants}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (hay.includes(term)) score += chunk.invariants.toLowerCase().includes(term)
        ? 3
        : 1;
    }
    return {
      sectionId: chunk.sectionId,
      sectionTitle: chunk.sectionTitle,
      category: chunk.category,
      content: chunk.content,
      invariants: chunk.invariants,
      score,
      source: "seed" as const,
    };
  })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function retrieveCareBlueprintChunks(
  query: string,
  limit = 5,
): Promise<BlueprintHit[]> {
  if (!isOpenSearchConfigured()) {
    return scoreSeed(query).slice(0, limit);
  }

  const index =
    process.env.OPENSEARCH_CARE_BLUEPRINT_INDEX ?? CARE_BLUEPRINT_INDEX_V1;

  try {
    const res = await openSearchFetch(`/${index}/_search`, {
      method: "POST",
      body: JSON.stringify({
        size: limit,
        query: {
          multi_match: {
            query,
            fields: CARE_BLUEPRINT_SEARCH_FIELDS,
          },
        },
      }),
    });
    if (!res.ok) {
      return scoreSeed(query).slice(0, limit);
    }
    const body = (await res.json()) as {
      hits?: {
        hits?: Array<{
          _score?: number;
          _source?: {
            sectionId?: string;
            sectionTitle?: string;
            category?: string;
            content?: string;
            invariants?: string;
          };
        }>;
      };
    };
    const hits = (body.hits?.hits ?? []).map((h) => ({
      sectionId: h._source?.sectionId ?? "",
      sectionTitle: h._source?.sectionTitle ?? "",
      category: h._source?.category ?? "",
      content: h._source?.content ?? "",
      invariants: h._source?.invariants ?? "",
      score: h._score ?? 0,
      source: "opensearch" as const,
    }));
    return hits.length > 0 ? hits : scoreSeed(query).slice(0, limit);
  } catch {
    return scoreSeed(query).slice(0, limit);
  }
}
