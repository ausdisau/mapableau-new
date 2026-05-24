import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { recordTransportTrackingPing } from "@/lib/geo/tracking";
import { requireTransportApi } from "@/lib/modules/module-api-auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  lat: z.number(),
  lng: z.number(),
  driverProfileId: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> },
) {
  const { transportBookingId } = await params;
  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    select: { participantId: true, operatorOrganisationId: true },
  });
  if (!tb) return jsonError("Not found", 404);

  const auth = await requireTransportApi({
    participantId: tb.participantId,
    operatorOrganisationId: tb.operatorOrganisationId,
  });
  if (auth instanceof Response) return auth;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const ping = await recordTransportTrackingPing({
    transportBookingId,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    driverProfileId: parsed.data.driverProfileId,
  });

  return jsonOk({ ping });
}
