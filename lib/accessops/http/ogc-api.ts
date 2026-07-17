import { buildOgcCollection } from "@/lib/accessops/protocols/ogc-features/collections";
import { ogcFeaturesConformance } from "@/lib/accessops/protocols/ogc-features/conformance";
import { stripParticipantDataFromFeature } from "@/lib/accessops/protocols/ogc-features/items";
import { validateOgcFeaturesQuery } from "@/lib/accessops/protocols/ogc-features/query";
import { isAccessOpsFeatureEnabled } from "@/lib/accessops/feature-flags";
import { mapAccessAssetDto } from "@/lib/accessops/types";
import { prisma } from "@/lib/prisma";

import { toAccessAssetResponseDto, toFeatureObservationDto, toReliabilityMeasurementDto, toStatusEventDto } from "./dto";
import { accessOpsError, accessOpsJson, accessOpsSafe } from "./route-guards";

export type CollectionParams = {
  params: Promise<{ collectionId: string }>;
};
export type FeatureParams = {
  params: Promise<{ collectionId: string; featureId: string }>;
};

const COLLECTIONS = [
  buildOgcCollection("assets", "Access assets"),
  buildOgcCollection("features", "Access feature observations"),
  buildOgcCollection("status", "Operational status events"),
  buildOgcCollection("reliability", "Reliability measurements"),
];

function ensureOgcEnabled(): Response | null {
  if (isAccessOpsFeatureEnabled("ACCESSOPS_OPEN_DATA_EXPORTS_ENABLED")) {
    return null;
  }
  return accessOpsError(
    "OPEN_DATA_EXPORTS_DISABLED",
    "AccessOps open data exports are disabled.",
    404,
  );
}

function validateReadOnlyQuery(request: Request): Response | null {
  const decision = validateOgcFeaturesQuery(new URL(request.url).searchParams);
  if (decision.allowed) return null;
  return accessOpsError("OGC_QUERY_REJECTED", decision.reason, 400);
}

export function handleOgcLanding(): Response {
  const disabled = ensureOgcEnabled();
  if (disabled) return disabled;
  return accessOpsJson({
    title: "MapAble AccessOps OGC API Features",
    description: "Read-only public civic access projection.",
    links: [
      { href: "/api/ogc/conformance", rel: "conformance" },
      { href: "/api/ogc/collections", rel: "data" },
    ],
  });
}

export function handleOgcConformance(): Response {
  const disabled = ensureOgcEnabled();
  if (disabled) return disabled;
  return accessOpsJson({ conformsTo: [ogcFeaturesConformance(false)] });
}

export function handleOgcCollections(): Response {
  const disabled = ensureOgcEnabled();
  if (disabled) return disabled;
  return accessOpsJson({ collections: COLLECTIONS });
}

export async function handleOgcCollection(
  _request: Request,
  { params }: CollectionParams,
): Promise<Response> {
  const disabled = ensureOgcEnabled();
  if (disabled) return disabled;
  const { collectionId } = await params;
  const collection = COLLECTIONS.find((item) => item.id === collectionId);
  if (!collection) return accessOpsError("COLLECTION_NOT_FOUND", "Not found.", 404);
  return accessOpsJson({ collection });
}

export async function handleOgcItems(
  request: Request,
  { params }: CollectionParams,
): Promise<Response> {
  const disabled = ensureOgcEnabled();
  if (disabled) return disabled;
  const queryError = validateReadOnlyQuery(request);
  if (queryError) return queryError;
  const { collectionId } = await params;
  return accessOpsSafe(async () => ({
    type: "FeatureCollection",
    features: await loadCollectionItems(collectionId),
  }));
}

export async function handleOgcItem(
  request: Request,
  { params }: FeatureParams,
): Promise<Response> {
  const disabled = ensureOgcEnabled();
  if (disabled) return disabled;
  const queryError = validateReadOnlyQuery(request);
  if (queryError) return queryError;
  const { collectionId, featureId } = await params;
  return accessOpsSafe(async () => {
    const features = await loadCollectionItems(collectionId, featureId);
    return features[0] ?? null;
  });
}

async function loadCollectionItems(collectionId: string, id?: string) {
  if (collectionId === "assets") {
    const assets = await prisma.accessAsset.findMany({
      where: {
        ...(id ? { id } : {}),
        securityClassification: "public",
        publicVisibility: "public",
      },
      take: id ? 1 : 100,
    });
    return assets.map((asset) =>
      stripParticipantDataFromFeature({
        type: "Feature",
        id: asset.publicIdentifier,
        geometry: null,
        properties: toAccessAssetResponseDto(mapAccessAssetDto(asset)),
      }),
    );
  }
  if (collectionId === "features") {
    const rows = await prisma.accessFeatureObservation.findMany({
      where: id ? { id } : {},
      orderBy: { observedAt: "desc" },
      take: id ? 1 : 100,
    });
    return rows.map((row) =>
      stripParticipantDataFromFeature({
        type: "Feature",
        id: row.id,
        geometry: null,
        properties: toFeatureObservationDto(row),
      }),
    );
  }
  if (collectionId === "status") {
    const rows = await prisma.accessStatusEvent.findMany({
      where: id ? { id } : {},
      orderBy: { effectiveFrom: "desc" },
      take: id ? 1 : 100,
    });
    return rows.map((row) =>
      stripParticipantDataFromFeature({
        type: "Feature",
        id: row.id,
        geometry: null,
        properties: toStatusEventDto(row),
      }),
    );
  }
  if (collectionId === "reliability") {
    const rows = await prisma.accessReliabilityMeasurement.findMany({
      where: id ? { id } : {},
      orderBy: { windowEnd: "desc" },
      take: id ? 1 : 100,
    });
    return rows.map((row) =>
      stripParticipantDataFromFeature({
        type: "Feature",
        id: row.id,
        geometry: null,
        properties: toReliabilityMeasurementDto(row),
      }),
    );
  }
  throw new Error("COLLECTION_NOT_FOUND");
}
