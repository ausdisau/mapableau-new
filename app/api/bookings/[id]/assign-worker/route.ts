import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assertProviderOwnsBooking,
  assertWorkerBelongsToProvider,
} from "@/lib/bookings/booking-access";
import { onWorkerAssigned } from "@/lib/orchestration/booking-orchestrator";
import { prisma } from "@/lib/prisma";
import { assignWorkerSchema } from "@/lib/validation/booking";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id: bookingId } = await params;

  try {
    const parsed = assignWorkerSchema.parse(await req.json());
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { assignedOrganisationId: true },
    });
    if (!booking?.assignedOrganisationId) {
      return jsonError("Booking has no assigned provider", 400);
    }

    const membership = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId: booking.assignedOrganisationId },
    });
    if (!membership) return jsonError("Forbidden", 403);

    await assertProviderOwnsBooking(bookingId, booking.assignedOrganisationId);
    await assertWorkerBelongsToProvider(
      parsed.workerUserId,
      booking.assignedOrganisationId
    );

    const updated = await onWorkerAssigned({
      bookingId,
      workerUserId: parsed.workerUserId,
      actorUserId: user.id,
    });

    return jsonOk({ booking: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "WORKER_NOT_IN_ORGANISATION") {
      return jsonError("Worker does not belong to this provider", 400);
    }
    if (e instanceof Error && e.message === "FORBIDDEN_PROVIDER") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Assign worker failed", 500);
  }
}
