import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { providerAcceptBookingMvp } from "@/lib/bookings/booking-mvp-service";
import { getProviderOrganisationForUser } from "@/lib/providers/provider-org-profile-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const membership = await getProviderOrganisationForUser(user.id);
  if (!membership) return jsonError("Forbidden", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const booking = await providerAcceptBookingMvp(
      id,
      membership.organisationId,
      user.id,
      body.note
    );
    return jsonOk({ booking });
  } catch (e) {
    if (e instanceof Error && e.message === "PROVIDER_NOT_ELIGIBLE") {
      return jsonError("Provider is not booking eligible", 403);
    }
    return jsonError("Accept failed", 500);
  }
}
