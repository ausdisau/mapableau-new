import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { releasePilotReservation } from "@/lib/pilot/limits/pilot-reservation-service";

const bodySchema = z.object({
  reservationId: z.string().cuid(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/limits/release */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:reconciliation:resolve");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const reservation = await releasePilotReservation({
      reservationId: parsed.data.reservationId,
    });
    if (reservation.pilotId !== pilotId) {
      return jsonNdisError("Reservation not found for pilot", 404);
    }
    return jsonNdisOk({
      reservation: {
        id: reservation.id,
        status: reservation.status,
        amountCents: reservation.amountCents,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
