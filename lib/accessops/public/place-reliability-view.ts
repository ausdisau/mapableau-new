import type { AccessReliabilityMeasurement } from "@prisma/client";

import type { AccessAssetDto } from "../types";
import { toAccessAssetResponseDto } from "../http/dto";

export interface PublicPlaceReliabilityFeature {
  assetId: string;
  publicIdentifier: string;
  title: string;
  assetType: string;
  latestWindowEnd: Date | null;
  statusCoveragePercent: number | null;
  evidenceCompleteness: number | null;
  unknownMinutes: number | null;
  unavailableMinutes: number | null;
  disclaimer: string;
}

export interface PublicPlaceReliabilityView {
  placeId: string;
  features: PublicPlaceReliabilityFeature[];
  disclaimers: string[];
}

export function buildPublicPlaceReliabilityView(
  placeId: string,
  assets: AccessAssetDto[],
  measurements: AccessReliabilityMeasurement[],
): PublicPlaceReliabilityView {
  const latestByAsset = new Map<string, AccessReliabilityMeasurement>();
  for (const measurement of measurements) {
    const current = latestByAsset.get(measurement.assetId);
    if (!current || current.windowEnd.getTime() < measurement.windowEnd.getTime()) {
      latestByAsset.set(measurement.assetId, measurement);
    }
  }
  return {
    placeId,
    features: assets.map((asset) => {
      const safeAsset = toAccessAssetResponseDto(asset);
      const latest = latestByAsset.get(asset.id) ?? null;
      return {
        assetId: safeAsset.id,
        publicIdentifier: safeAsset.publicIdentifier,
        title: safeAsset.title,
        assetType: safeAsset.assetType,
        latestWindowEnd: latest?.windowEnd ?? null,
        statusCoveragePercent: latest?.statusCoveragePercent ?? null,
        evidenceCompleteness: latest?.evidenceCompleteness ?? null,
        unknownMinutes: latest?.unknownMinutes ?? null,
        unavailableMinutes: latest?.unavailableMinutes ?? null,
        disclaimer:
          "Feature reliability is informational; missing or stale data is not current access status.",
      };
    }),
    disclaimers: [
      "Accreditation is not live operational status.",
      "Missing data is not treated as accessible.",
      "Stale data is not treated as current.",
      "No universal access score is calculated.",
    ],
  };
}
