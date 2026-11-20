import { ZodError } from "zod";

import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import { zodErrorResponse } from "@/lib/api/response";
import {
  assertProviderCanManageBooking,
  assignBooking,
  getBookingForUser,
} from "@/lib/bookings/booking-service";
import { assignBookingSchema } from "@/lib/validation/booking-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    const parsed = assignBookingSchema.parse(await req.json());
    const bookingRecord = await assertProviderCanManageBooking(
      user!,
      bookingId,
      parsed.organisationId
    );

    const orgId = parsed.organisationId ?? bookingRecord.assignedOrganisationId!;
    const result = await assignBooking({
      bookingId,
      assigneeUserId: parsed.assigneeUserId,
      assigneeRole: parsed.assigneeRole,
      organisationId: orgId,
      assignedById: user!.id,
      notes: parsed.notes,
    });
    const refreshed = await getBookingForUser(user!, bookingId);
    return bookingOk({ ...result, booking: refreshed });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBookingRouteError(e);
  }
}
