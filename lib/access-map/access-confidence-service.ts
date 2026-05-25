import type { AccessConfidenceLevel, AccessPlaceSourceType } from "@prisma/client";

import { ACCESS_LABELS } from "@/lib/access-map/copy";

export function confidenceFromSource(
  sourceType: AccessPlaceSourceType,
  reviewCount: number,
  hasPublishedAccreditation: boolean
): AccessConfidenceLevel {
  if (hasPublishedAccreditation) return "mapable_accredited";
  if (sourceType === "mapable_verified" || sourceType === "manual_admin") {
    return "mapable_verified";
  }
  if (sourceType === "venue_claimed") return "venue_claimed";
  if (reviewCount >= 2) return "multiple_user_reports";
  if (reviewCount >= 1) return "user_reported";
  return "unknown";
}

export function confidenceLabel(level: AccessConfidenceLevel): string {
  switch (level) {
    case "user_reported":
      return ACCESS_LABELS.userReported;
    case "multiple_user_reports":
      return ACCESS_LABELS.communityReviewed;
    case "venue_claimed":
      return ACCESS_LABELS.venueClaimed;
    case "mapable_verified":
      return ACCESS_LABELS.mapableVerified;
    case "mapable_accredited":
      return ACCESS_LABELS.mapableAccreditedGold;
    default:
      return ACCESS_LABELS.unknown;
  }
}
