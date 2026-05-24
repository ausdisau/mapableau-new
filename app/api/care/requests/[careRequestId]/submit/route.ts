import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { submitCareRequestWithBooking } from "@/lib/modules/care-facade";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;

  const existing = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!existing || existing.participantId !== user.id) {
    return jsonError("Not found", 404);
  }

  const request = await submitCareRequestWithBooking(careRequestId, user.id);
  return jsonOk({ request });
}
