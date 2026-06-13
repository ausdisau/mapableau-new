import { getPublishedIndoorForPlace } from "@/lib/access-indoor/indoor-service";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const indoor = await getPublishedIndoorForPlace(placeId);

  if (!indoor) {
    return jsonOk({ placeId, buildings: [] });
  }

  return jsonOk(indoor);
}
