/**
 * Deterministic public provider/directory search for ACS Stage 2.
 * Pre-filters to public fixtures only — never private participant records.
 */

import { isVirtualPersonaPublicSearchEnabled } from "@/lib/config/virtual-persona";

export type PublicSearchHit = {
  id: string;
  name: string;
  category: string;
  summary: string;
  evidenceStatus: "synthetic_fixture" | "public_directory";
  sourceLabel: string;
};

export type PublicSearchResult =
  | { ok: true; hits: PublicSearchHit[]; deniedPrivate: false }
  | {
      ok: false;
      reason: "private_query_denied" | "empty_query" | "flag_disabled";
      deniedPrivate: boolean;
    };

/** Queries that imply private/participant-bound retrieval — always deny. */
export const PRIVATE_QUERY_PATTERNS = [
  /\bmy\s+(plan|ndis|funding|roster|worker|address|medication)\b/i,
  /\bparticipant\s+record\b/i,
  /\bprivate\b/i,
  /\bcontact\s+my\s+family\b/i,
] as const;

const PUBLIC_DIRECTORY: PublicSearchHit[] = [
  {
    id: "pub-access-packaging",
    name: "Accessible packaging tips (public)",
    category: "self_support",
    summary:
      "Public guidance on opening packaging independently. Not a worker roster or clinical advice.",
    evidenceStatus: "synthetic_fixture",
    sourceLabel: "Synthetic public accessibility fixture",
  },
  {
    id: "pub-provider-directory",
    name: "Community support directory (public listing)",
    category: "directory",
    summary:
      "Public organisation listings only. Not screening, availability, or competency evidence.",
    evidenceStatus: "public_directory",
    sourceLabel: "Synthetic public directory fixture",
  },
  {
    id: "pub-ask-human",
    name: "Ask a human / non-AI path",
    category: "fallback",
    summary: "Use MapAble classic Ask pages or human support without this persona.",
    evidenceStatus: "synthetic_fixture",
    sourceLabel: "MapAble non-AI fallback",
  },
];

export { isVirtualPersonaPublicSearchEnabled };

/**
 * Search public fixtures only. Private-looking queries are denied before
 * candidate generation (ACS evidence-plane rule).
 */
export function searchPublicDirectory(
  query: string,
  options?: { requireFlag?: boolean },
): PublicSearchResult {
  if (options?.requireFlag && !isVirtualPersonaPublicSearchEnabled()) {
    return { ok: false, reason: "flag_disabled", deniedPrivate: false };
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { ok: false, reason: "empty_query", deniedPrivate: false };
  }

  if (PRIVATE_QUERY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, reason: "private_query_denied", deniedPrivate: true };
  }

  const lower = trimmed.toLowerCase();
  const hits = PUBLIC_DIRECTORY.filter(
    (hit) =>
      hit.name.toLowerCase().includes(lower) ||
      hit.category.toLowerCase().includes(lower) ||
      hit.summary.toLowerCase().includes(lower) ||
      lower.includes("provider") ||
      lower.includes("directory") ||
      lower.includes("packaging") ||
      lower.includes("public") ||
      lower.includes("search"),
  );

  return {
    ok: true,
    hits: hits.length > 0 ? hits : PUBLIC_DIRECTORY.slice(0, 2),
    deniedPrivate: false,
  };
}
