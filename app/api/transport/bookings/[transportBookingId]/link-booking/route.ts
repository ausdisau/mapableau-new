import { jsonError, jsonOk } from "@/lib/api/response";
import { linkBookingToTransport } from "@/lib/modules/transport-facade";
import { requireTransportApi } from "@/lib/modules/module-api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
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

  const updated = await linkBookingToTransport(transportBookingId, auth.user.id);
  return jsonOk({ transportBooking: updated });
}
