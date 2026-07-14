import { getMarkerSummary } from "@/lib/access-markers/marker-summary-service";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const summary = await getMarkerSummary(placeId);
  if (!summary) return jsonError("Place not found", 404);
  return jsonOk({ summary });
}
