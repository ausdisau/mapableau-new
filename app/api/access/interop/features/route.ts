import { jsonError, jsonOk } from "@/lib/api/response";
import { buildPublicFeatureListResponse } from "@/lib/access/interop/project";
import {
  parseBboxFromSearchParams,
  parsePaginationFromSearchParams,
  featureInBbox,
} from "@/lib/access/interop/api-helpers";
import { openInfrastructureFlags } from "@/lib/integrations/access/flags";
import { listAccessQuests } from "@/lib/access/quests/types";
import {
  createUnverifiedProvenance,
  normalizedObservationSchema,
} from "@/lib/integrations/access/contracts";
import { projectObservationToPublicFeature } from "@/lib/access/interop/project";

export const dynamic = "force-dynamic";

/** Demo projection from quest definitions — not live GAIS persistence. */
function demoPublicFeatures() {
  const quests = listAccessQuests();
  return quests.slice(0, 5).map((quest, i) => {
    const observation = normalizedObservationSchema.parse({
      featureType: quest.concept,
      attribute: quest.attribute,
      value: "UNKNOWN",
      valueQualifier: "UNKNOWN",
      provenance: createUnverifiedProvenance({
        sourceProvider: "mapable_quests",
        sourceReference: quest.id,
      }),
      claimStrength: "observation",
    });
    return projectObservationToPublicFeature(observation, `demo-feature-${i}`);
  });
}

export async function GET(req: Request) {
  if (!openInfrastructureFlags.publicInteropApi) {
    return jsonError("Public interop API disabled", 404);
  }
  const params = new URL(req.url).searchParams;
  const pagination = parsePaginationFromSearchParams(params);
  const bbox = parseBboxFromSearchParams(params);

  let features = demoPublicFeatures();
  if (bbox) {
    features = features.filter((f) => featureInBbox(f, bbox));
  }

  const start = (pagination.page - 1) * pagination.pageSize;
  const pageFeatures = features.slice(start, start + pagination.pageSize);

  const response = buildPublicFeatureListResponse({
    features: pageFeatures,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: features.length,
    bbox: bbox
      ? [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat]
      : undefined,
  });

  return jsonOk(response);
}
