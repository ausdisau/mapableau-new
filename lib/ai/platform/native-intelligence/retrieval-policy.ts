import type {
  GovernedRetrievalHit,
  RetrievalProvenanceRecord,
} from "./types";

/**
 * Governed retrieval policy for MapAble domain knowledge.
 * Policies, accessibility evidence, public disability guidance, service info,
 * and approved domain docs — always with provenance.
 *
 * Does not teach unverified business-plan claims as operational truth.
 */

export const ALLOWED_RETRIEVAL_SOURCE_TYPES = [
  "policy",
  "accessibility_evidence",
  "public_disability_guidance",
  "service_info",
  "approved_domain_doc",
] as const;

export type ApprovedKnowledgeSeed = {
  chunkId: string;
  text: string;
  provenance: Omit<RetrievalProvenanceRecord, "retrievedAt">;
};

/** In-memory approved knowledge seeds for R&D — not a training data store. */
const APPROVED_SEEDS: ApprovedKnowledgeSeed[] = [
  {
    chunkId: "kb-policy-consent-1",
    text: "Participant consent is required before sharing personal access needs with a provider.",
    provenance: {
      sourceId: "mapable-policy-consent-v1",
      sourceType: "policy",
      title: "Consent before disclosure",
      version: "1.0.0",
      licenseOrBasis: "MapAble internal policy",
      operationalTruth: true,
    },
  },
  {
    chunkId: "kb-guidance-plain-1",
    text: "Use plain language. Avoid jargon. Offer Easy Read when the participant prefers it.",
    provenance: {
      sourceId: "public-a11y-plain-language",
      sourceType: "public_disability_guidance",
      title: "Plain language guidance",
      version: "2024",
      licenseOrBasis: "public guidance summary",
      operationalTruth: true,
    },
  },
  {
    chunkId: "kb-business-plan-claim-1",
    text: "Hypothetical future capability roadmap item — not operational.",
    provenance: {
      sourceId: "internal-business-plan-draft",
      sourceType: "approved_domain_doc",
      title: "Business plan draft (non-operational)",
      version: "draft",
      licenseOrBasis: "internal draft — not for operational truth",
      operationalTruth: false,
    },
  },
];

export function listApprovedKnowledgeSeeds(): ApprovedKnowledgeSeed[] {
  return APPROVED_SEEDS.map((s) => ({
    ...s,
    provenance: { ...s.provenance },
  }));
}

export function retrieveGovernedKnowledge(input: {
  query: string;
  includeNonOperational?: boolean;
  nowIso?: string;
}): {
  hits: GovernedRetrievalHit[];
  provenancePreserved: true;
  filteredNonOperational: number;
} {
  const now = input.nowIso ?? new Date().toISOString();
  const q = input.query.toLowerCase();
  let filteredNonOperational = 0;
  const hits: GovernedRetrievalHit[] = [];

  for (const seed of APPROVED_SEEDS) {
    if (!seed.provenance.operationalTruth && !input.includeNonOperational) {
      filteredNonOperational += 1;
      continue;
    }
    const hay = `${seed.text} ${seed.provenance.title}`.toLowerCase();
    if (!q || hay.includes(q) || q.split(/\s+/).some((t) => hay.includes(t))) {
      hits.push({
        chunkId: seed.chunkId,
        text: seed.text,
        score: scoreOverlap(q, hay),
        provenance: {
          ...seed.provenance,
          retrievedAt: now,
        },
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return { hits, provenancePreserved: true, filteredNonOperational };
}

export function assertProvenancePresent(
  hit: GovernedRetrievalHit
): { ok: true } | { ok: false; reason: string } {
  const p = hit.provenance;
  if (!p.sourceId || !p.sourceType || !p.version || !p.retrievedAt) {
    return { ok: false, reason: "missing_provenance_fields" };
  }
  if (
    !(ALLOWED_RETRIEVAL_SOURCE_TYPES as readonly string[]).includes(p.sourceType)
  ) {
    return { ok: false, reason: "source_type_not_allowed" };
  }
  return { ok: true };
}

function scoreOverlap(query: string, hay: string): number {
  if (!query) return 0.1;
  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0.1;
  const hits = terms.filter((t) => hay.includes(t)).length;
  return hits / terms.length;
}
