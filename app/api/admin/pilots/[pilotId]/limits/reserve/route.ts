import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  getOptionalIdempotencyKey,
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { reservePilotLimit } from "@/lib/pilot/limits/pilot-reservation-service";
import { buildPilotIdempotencyKey } from "@/lib/pilot/runtime/pilot-idempotency";

const bodySchema = z.object({
  amountCents: z.number().int().positive(),
  participantId: z.string().cuid().nullable().optional(),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/limits/reserve */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:financial:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const headerKey = getOptionalIdempotencyKey(req);
  const idempotencyKey =
    parsed.data.idempotencyKey ??
    headerKey ??
    buildPilotIdempotencyKey({
      pilotId,
      operation: "reserve",
      subjectId: parsed.data.participantId ?? user.id,
      amountCents: parsed.data.amountCents,
      nonce: crypto.randomUUID(),
    });

  try {
    const reservation = await reservePilotLimit({
      pilotId,
      participantId: parsed.data.participantId,
      amountCents: parsed.data.amountCents,
      idempotencyKey,
      maxTransactionCents: pilot.maxTransactionCents,
      maxDailyExposureCents: pilot.maxDailyExposureCents,
      maxParticipantExposureCents: pilot.maxParticipantExposureCents,
      maxTotalExposureCents: pilot.maxTotalExposureCents,
    });
    return jsonNdisOk(
      {
        reservation: {
          id: reservation.id,
          amountCents: reservation.amountCents,
          status: reservation.status,
          idempotencyKey: reservation.idempotencyKey,
        },
      },
      201
    );
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
