import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createDraftInvoiceFromTrip } from "@/lib/transport-osm/trip-invoice-foundation";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;

  try {
    const invoice = await createDraftInvoiceFromTrip(
      transportBookingId,
      user.id
    );
    return jsonOk({ invoice }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "TRIP_NOT_COMPLETED") {
      return jsonError("Trip must be completed first", 400);
    }
    return jsonError("Invoice create failed", 500);
  }
}
