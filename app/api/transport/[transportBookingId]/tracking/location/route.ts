import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { recordTripLocation } from "@/lib/tracking/trip-tracking-service";

const schema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiPermission("tracking:update:driver");
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;

  try {
    const { lat, lng } = schema.parse(await req.json());
    await recordTripLocation(transportBookingId, lat, lng, user.id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return zodErrorResponse(e);
    return jsonError("Location update failed", 500);
  }
}
