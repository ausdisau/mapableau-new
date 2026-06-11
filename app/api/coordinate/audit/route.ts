import { jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import { listCoordinateAuditEvents } from "@/lib/coordinate/audit-service";

export async function GET(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "coordinate:audit:read")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const participantIdParam = searchParams.get("participantId");
    const participantId = participantIdParam
      ? resolveParticipantIdFromRequest(user, searchParams)
      : undefined;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "50");

    const events = await listCoordinateAuditEvents({
      participantId,
      cursor,
      limit,
    });
    return jsonOk({ events });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
