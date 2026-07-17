import { accessPlaceCanonicalRef } from "../canonical-refs";
import { isCivicFlagEnabled } from "../feature-flags";
import { getCivicAsset } from "./asset-registry-service";
import type { StaticAccessibilityProjection } from "../types";

/**
 * Static accessibility projection over registered Civic assets.
 * Preserves unknown / stale / disputed. Never invents a universal score.
 * Never reads participant journeys.
 */
export async function projectStaticAccessibility(
  assetId: string
): Promise<StaticAccessibilityProjection> {
  if (!isCivicFlagEnabled("assetRegistry")) {
    throw new Error("MAPABLE_CIVIC_DISABLED");
  }

  const asset = await getCivicAsset(assetId);
  const claims = asset.accessibilityClaims;

  const unknownClaimCount = claims.filter((c) => c.state === "unknown").length;
  const staleClaimCount = claims.filter((c) => c.state === "stale").length;
  const disputedClaimCount = claims.filter((c) => c.state === "disputed").length;
  const evidencedClaimCount = claims.filter(
    (c) => c.state === "evidenced" || c.state === "verified"
  ).length;

  const sourceDates = Array.from(
    new Set(
      claims
        .map((c) => c.sourceDate)
        .filter((d): d is string => typeof d === "string" && d.length > 0)
    )
  );

  const limitations: string[] = [
    "Imported geometry does not prove feature quality or current operation.",
    "Missing claims remain unknown — they are not treated as inaccessible or accessible.",
    "This projection is not a legal-compliance certificate.",
    "Personal fit is not computed in Wave 1 static projection.",
  ];

  if (unknownClaimCount > 0) {
    limitations.push(
      `${unknownClaimCount} accessibility claim(s) remain unknown.`
    );
  }
  if (staleClaimCount > 0) {
    limitations.push(`${staleClaimCount} accessibility claim(s) are stale.`);
  }
  if (disputedClaimCount > 0) {
    limitations.push(
      `${disputedClaimCount} accessibility claim(s) are disputed.`
    );
  }
  if (!asset.accessPlaceId) {
    limitations.push(
      "No AccessPlace binding — canonical place identity is unresolved."
    );
  }

  return {
    assetId: asset.id,
    stableKey: asset.stableKey,
    accessPlaceId: asset.accessPlaceId,
    accessPlaceRef: asset.accessPlaceId
      ? accessPlaceCanonicalRef(asset.accessPlaceId)
      : null,
    title: asset.title,
    plainLanguageTitle: asset.plainLanguageTitle,
    assetClass: asset.assetClass,
    assetType: asset.assetType,
    visibility: asset.visibility,
    jurisdictionCode: asset.jurisdictionCode,
    geometryImported: Boolean(asset.geometry && asset.geometry.type !== "unknown"),
    geometryProvesAccessibility: false,
    claims,
    unknownClaimCount,
    staleClaimCount,
    disputedClaimCount,
    evidencedClaimCount,
    sourceDates,
    lastVerifiedAt: asset.lastVerifiedAt?.toISOString() ?? null,
    nextReviewAt: asset.nextReviewAt?.toISOString() ?? null,
    externalReferences: asset.externalReferences.map((r) => ({
      system: r.system,
      externalId: r.externalId,
      canonicalRef: r.canonicalRef,
    })),
    limitations,
    generatedAt: new Date().toISOString(),
  };
}
