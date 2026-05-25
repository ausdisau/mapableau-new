import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCareBookingForUser } from "@/lib/care/care-booking-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:read:self");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const booking = await getCareBookingForUser(id, user);
    if (!booking) return jsonError("Not found", 404);
    return jsonOk({ booking });
  } catch {
    return jsonError("Forbidden", 403);
  }
}
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isCareAccessError } from "@/lib/care/access-control";
import { getCareBookingForUser } from "@/lib/care/care-booking-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const booking = await getCareBookingForUser(user, id);
    return jsonOk({ booking });
  } catch (error) {
    if (isCareAccessError(error)) return jsonError("Forbidden", 403);
    if (error instanceof Error && error.message === "BOOKING_NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Load booking failed", 500);
  }
}
