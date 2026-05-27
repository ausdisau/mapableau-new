import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCareMapLayerGeoJson } from "@/lib/map/layers/care-map-layer-service";
import { parseMapBboxFromSearchParams } from "@/lib/map/map-layer-query";

export async function GET(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const bbox = parseMapBboxFromSearchParams(new URL(request.url).searchParams);
  if (!bbox) {
    return jsonError("minLat, minLng, maxLat, and maxLng are required", 400);
  }

  const geojson = await getCareMapLayerGeoJson(user, bbox);
  return jsonOk(geojson);
}
