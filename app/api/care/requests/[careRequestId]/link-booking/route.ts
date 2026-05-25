import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { linkCareRequestToBooking } from "@/lib/modules/care-facade";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ careRequestId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const body = (await req.json().catch(() => ({}))) as { bookingId?: string };

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    select: { participantId: true },
  });
  if (!request) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && request.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const booking = await linkCareRequestToBooking({
    careRequestId,
    bookingId: body.bookingId,
    actorUserId: user.id,
  });
  return jsonOk({ booking });
}
