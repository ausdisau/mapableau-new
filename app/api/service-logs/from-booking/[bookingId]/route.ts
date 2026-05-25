import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createServiceLogFromBooking } from "@/lib/service-logs/service-log-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { bookingId } = await params;
  const body = await req.json();

  try {
    const log = await createServiceLogFromBooking(bookingId, user.id, body);
    return jsonOk({ serviceLog: log }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "BOOKING_NOT_READY") {
      return jsonError("Booking must be accepted or completed first", 400);
    }
    return jsonError("Create failed", 500);
  }
}
