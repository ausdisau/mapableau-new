import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getDispatchRecommendations } from "@/lib/transport-osm/dispatch-recommendation-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("dispatch:manage");
  if (user instanceof Response) return user;

  const bookingId = new URL(req.url).searchParams.get("bookingId");
  if (!bookingId) return jsonError("bookingId required", 400);

  const recommendations = await getDispatchRecommendations(bookingId);
  return jsonOk({ recommendations });
}
