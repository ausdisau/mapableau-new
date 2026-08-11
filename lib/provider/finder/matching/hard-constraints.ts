import { ACCESS_NEEDS } from "@/lib/provider/finder/filters";
import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";

export type HardConstraintInput = {
  requiredAccessNeedIds: string[];
  excludedProviderSourceIds: string[];
  requiredState?: string | null;
  requiredPostcode?: string | null;
  requiredService?: string | null;
  /** Max age of provider directory row in days; stale rows fail hard freshness. */
  maxDataAgeDays?: number;
  conflictOfInterestProviderSourceIds?: string[];
  now?: Date;
};

export type HardConstraintFailure = {
  sourceId: string;
  reasons: string[];
};

export type HardConstraintResult = {
  eligible: NdisProviderSearchRow[];
  rejected: HardConstraintFailure[];
  noMatch: boolean;
  /** True when safety constraints yielded zero results — must not be relaxed. */
  constraintsNotRelaxed: true;
};

function accessNeedKeywords(ids: string[]): string[] {
  const set = new Set(ids);
  return ACCESS_NEEDS.filter((need) => set.has(need.id)).flatMap(
    (need) => need.keywords,
  );
}

function providerText(row: NdisProviderSearchRow): string {
  return [
    row.provider_name,
    ...(row.services ?? []),
    ...(row.registration_groups ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Stage 1: deterministic hard constraints. Ranking must never override these.
 * Returns an explicit no-match instead of relaxing safety constraints.
 */
export function applyHardConstraints(
  providers: NdisProviderSearchRow[],
  constraints: HardConstraintInput,
): HardConstraintResult {
  const now = constraints.now ?? new Date();
  const maxAgeMs =
    (constraints.maxDataAgeDays ?? 365) * 24 * 60 * 60 * 1000;
  const keywords = accessNeedKeywords(constraints.requiredAccessNeedIds);
  const excluded = new Set(constraints.excludedProviderSourceIds);
  const conflicts = new Set(constraints.conflictOfInterestProviderSourceIds ?? []);
  const requiredState = constraints.requiredState?.trim().toUpperCase() || null;
  const requiredPostcode = constraints.requiredPostcode?.trim() || null;
  const requiredService = constraints.requiredService?.trim() || null;

  const eligible: NdisProviderSearchRow[] = [];
  const rejected: HardConstraintFailure[] = [];

  for (const provider of providers) {
    const reasons: string[] = [];

    if (excluded.has(provider.source_id)) {
      reasons.push("participant_exclusion");
    }
    if (conflicts.has(provider.source_id)) {
      reasons.push("conflict_of_interest");
    }
    if (requiredState && (provider.state ?? "").toUpperCase() !== requiredState) {
      reasons.push("geographic_state");
    }
    if (requiredPostcode && provider.postcode !== requiredPostcode) {
      reasons.push("geographic_postcode");
    }
    if (
      requiredService &&
      !(provider.services ?? []).some(
        (service) => service.toLowerCase() === requiredService.toLowerCase(),
      )
    ) {
      reasons.push("service_type");
    }
    if (provider.updated_at) {
      const age = now.getTime() - new Date(provider.updated_at).getTime();
      if (age > maxAgeMs) {
        reasons.push("stale_directory_data");
      }
    }
    if (keywords.length > 0) {
      const text = providerText(provider);
      const matched = keywords.some((keyword) => text.includes(keyword.toLowerCase()));
      if (!matched) {
        reasons.push("access_or_communication_requirement");
      }
    }

    if (reasons.length > 0) {
      rejected.push({ sourceId: provider.source_id, reasons });
    } else {
      eligible.push(provider);
    }
  }

  return {
    eligible,
    rejected,
    noMatch: eligible.length === 0,
    constraintsNotRelaxed: true,
  };
}
