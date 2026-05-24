import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { participantTransportWhere } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createTripQuote } from "@/lib/transport-osm/trip-quote-service";
import { createTripQuoteSchema } from "@/lib/validation/transport-osm";

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;

  try {
    const { transportBookingId } = createTripQuoteSchema.parse(await req.json());
    const booking = await prisma.transportBooking.findFirst({
      where: { id: transportBookingId, ...participantTransportWhere(user) },
    });
    if (!booking) return jsonError("Not found", 404);

    const result = await createTripQuote(transportBookingId, user.id);
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Quote failed", 500);
  }
}
