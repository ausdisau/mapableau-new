import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { userCanAccessBooking } from "@/lib/bookings/booking-access";
import { onServiceCompleted } from "@/lib/orchestration/booking-orchestrator";
import { completeBookingSchema } from "@/lib/validation/booking";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id: bookingId } = await params;

  if (!(await userCanAccessBooking(user, bookingId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const parsed = completeBookingSchema.parse(await req.json());
    const updated = await onServiceCompleted({
      bookingId,
      actorUserId: user.id,
      actualStartAt: new Date(parsed.actualStartAt),
      actualEndAt: new Date(parsed.actualEndAt),
      completionNotes: parsed.completionNotes,
      deliveredSupports: parsed.deliveredSupports,
      actualTotalCents: parsed.actualTotalCents,
    });
    return jsonOk({ booking: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Complete booking failed", 500);
  }
}
