import { abrLookupConfig } from "@/lib/abn-lookup/config";
import type { OrganisationNameMatch } from "@/lib/abn-lookup/types";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(
    normalizeName(value)
      .split(" ")
      .filter((t) => t.length > 1)
  );
}

/** Jaccard similarity on word tokens. */
export function scoreNameMatch(
  abrName: string | null,
  organisationNames: (string | null | undefined)[]
): OrganisationNameMatch {
  if (!abrName?.trim()) {
    return {
      matchScore: 0,
      matchReason: "No entity name returned from ABR",
      passed: false,
    };
  }

  const abrTokens = tokenSet(abrName);
  if (abrTokens.size === 0) {
    return {
      matchScore: 0,
      matchReason: "ABR entity name empty after normalization",
      passed: false,
    };
  }

  let bestScore = 0;
  let bestLabel = "";

  for (const name of organisationNames) {
    if (!name?.trim()) continue;
    const orgTokens = tokenSet(name);
    if (orgTokens.size === 0) continue;

    const intersection = [...abrTokens].filter((t) => orgTokens.has(t)).length;
    const union = new Set([...abrTokens, ...orgTokens]).size;
    const score = union > 0 ? intersection / union : 0;

    const normAbr = normalizeName(abrName);
    const normOrg = normalizeName(name);
    const contains =
      normAbr.includes(normOrg) || normOrg.includes(normAbr) ? 0.15 : 0;
    const adjusted = Math.min(1, score + contains);

    if (adjusted > bestScore) {
      bestScore = adjusted;
      bestLabel = name;
    }
  }

  if (!bestLabel) {
    return {
      matchScore: 0,
      matchReason: "No organisation name on file to compare",
      passed: false,
    };
  }

  const passed = bestScore >= abrLookupConfig.nameMatchThreshold;
  return {
    matchScore: Math.round(bestScore * 1000) / 1000,
    matchReason: passed
      ? `Name match with "${bestLabel}" (${Math.round(bestScore * 100)}%)`
      : `Weak match with "${bestLabel}" (${Math.round(bestScore * 100)}%); threshold ${Math.round(abrLookupConfig.nameMatchThreshold * 100)}%`,
    passed,
  };
}
