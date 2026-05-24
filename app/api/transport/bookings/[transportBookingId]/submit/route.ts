import { jsonError, jsonOk } from "@/lib/api/response";
import { submitTransportWithBooking } from "@/lib/modules/transport-facade";
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

  const auth = await requireTransportApi({ participantId: tb.participantId });
  if (auth instanceof Response) return auth;
  if (auth.user.id !== tb.participantId && !auth.access.viewAsDelegate) {
    return jsonError("Only the participant can submit this trip", 403);
  }

  const updated = await submitTransportWithBooking(
    transportBookingId,
    auth.user.id,
  );
  return jsonOk({ transportBooking: updated });
}
