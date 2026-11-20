import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import {
  assertProviderCanManageBooking,
  getBookingForUser,
  providerDeclineBookingRequest,
} from "@/lib/bookings/booking-service";
import { providerResponseSchema } from "@/lib/validation/booking-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    const parsed = providerResponseSchema.parse(await req.json());
    const bookingRecord = await assertProviderCanManageBooking(
      user!,
      bookingId,
      parsed.organisationId
    );

    const orgId = parsed.organisationId ?? bookingRecord.assignedOrganisationId!;
    const booking = await providerDeclineBookingRequest(
      bookingId,
      orgId,
      user!.id,
      parsed.note
    );
    const refreshed = await getBookingForUser(user!, booking.id);
    return bookingOk({ booking: refreshed });
  } catch (e) {
    return handleBookingRouteError(e);
  }
}
