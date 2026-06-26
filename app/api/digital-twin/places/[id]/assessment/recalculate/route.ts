import { recalculateAssessment } from "@/lib/digital-twin/digital-twin-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

type RouteParams = { params: Promise<{ id: string }> };

/** POST /api/digital-twin/places/[id]/assessment/recalculate */
export async function POST(_req: Request, { params }: RouteParams) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const assessment = recalculateAssessment(id);
  if (!assessment) return jsonError("Place not found", 404);
  return jsonOk({ assessment });
}
