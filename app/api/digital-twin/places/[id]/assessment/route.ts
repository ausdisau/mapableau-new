import { getAssessment } from "@/lib/digital-twin/digital-twin-service";
import { jsonError, jsonOk } from "@/lib/api/response";

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/digital-twin/places/[id]/assessment */
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const assessment = getAssessment(id);
  if (!assessment) return jsonError("Assessment not found", 404);
  return jsonOk({ assessment });
}
