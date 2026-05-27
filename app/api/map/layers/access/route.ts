import { getAccessMapLayerGeoJson } from "@/lib/map/layers/access-map-layer-service";
import { parseMapBboxFromSearchParams } from "@/lib/map/map-layer-query";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(request: Request) {
  const bbox = parseMapBboxFromSearchParams(new URL(request.url).searchParams);
  if (!bbox) {
    return jsonError("minLat, minLng, maxLat, and maxLng are required", 400);
  }

  const geojson = await getAccessMapLayerGeoJson(bbox);
  return jsonOk(geojson);
}
