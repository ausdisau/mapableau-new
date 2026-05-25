import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { confirmTransportTrip } from "@/lib/transport-mvp/participant-confirmation-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const trip = await confirmTransportTrip(id, user.id);
    return jsonOk({ trip });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Trip not found", 404);
    }
    return jsonError("Confirm failed", 400);
  }
}
