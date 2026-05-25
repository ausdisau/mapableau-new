import { reportPlaceSchema } from "@/types/access-map";
import { reportAccessPlace } from "@/lib/access-map/access-place-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const reporterId = user.id;

  const body = await req.json();
  const parsed = reportPlaceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  await reportAccessPlace({
    placeId,
    reporterId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  return jsonOk({ ok: true });
}
