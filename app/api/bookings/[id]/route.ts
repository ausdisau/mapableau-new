import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { userCanAccessBooking } from "@/lib/bookings/booking-access";
import { updateBooking } from "@/lib/bookings/booking-service";
import { listBookingTimeline } from "@/lib/bookings/timeline-service";
import { transitionBookingStatus } from "@/lib/orchestration/booking-orchestrator";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { updateBookingSchema } from "@/lib/validation/booking";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  if (!(await userCanAccessBooking(user, id))) {
    return jsonError("Forbidden", 403);
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      assignedOrganisation: true,
      assignedWorker: { select: { id: true, name: true, email: true } },
      assignedDriver: { select: { id: true, name: true, email: true } },
      conversations: { select: { id: true }, take: 1 },
      invoices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!booking) return jsonError("Not found", 404);

  const events = await listBookingTimeline(
    id,
    isAdminRole(user.primaryRole)
  );

  return jsonOk({
    booking: {
      ...booking,
      conversationId: booking.conversations[0]?.id ?? null,
      invoice: booking.invoices[0] ?? null,
    },
    events,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  if (!(await userCanAccessBooking(user, id))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const parsed = updateBookingSchema.parse(await req.json());

    if (parsed.status) {
      const booking = await transitionBookingStatus({
        bookingId: id,
        nextStatus: parsed.status,
        actorUserId: user.id,
        note: parsed.providerNotes,
      });
      return jsonOk({ booking });
    }

    const booking = await updateBooking(id, parsed, user.id);
    return jsonOk({ booking });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (
      e instanceof Error &&
      e.message.startsWith("INVALID_BOOKING_TRANSITION")
    ) {
      return jsonError("Invalid status transition", 400);
    }
    return jsonError("Update failed", 500);
  }
}
