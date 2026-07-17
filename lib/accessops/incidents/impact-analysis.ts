export interface IncidentImpactInput {
  directlyBlockedAssets: string[];
  dependantAssets: string[];
  communityReports: number;
}

export function analyseIncidentImpact(input: IncidentImpactInput): {
  severity: "low" | "medium" | "high";
  affectedAssetIds: string[];
} {
  const affectedAssetIds = [
    ...new Set([...input.directlyBlockedAssets, ...input.dependantAssets]),
  ];
  const severity =
    affectedAssetIds.length > 5 || input.communityReports > 10
      ? "high"
      : affectedAssetIds.length > 1
        ? "medium"
        : "low";
  return { severity, affectedAssetIds };
}
