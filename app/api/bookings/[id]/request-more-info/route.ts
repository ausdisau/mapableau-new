import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { providerRequestMoreInfo } from "@/lib/bookings/booking-mvp-service";
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

  const body = await req.json();
  if (!body.note) return jsonError("note required", 400);

  const booking = await providerRequestMoreInfo(
    id,
    membership.organisationId,
    user.id,
    body.note
  );
  return jsonOk({ booking });
}
