import { requireApiSession } from "@/lib/api/auth-handler";
import { participantTransportWhere, providerTransportWhere } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { quoteId } = await params;

  const quote = await prisma.transportTripQuote.findUnique({
    where: { id: quoteId },
    include: { transportBooking: true },
  });
  if (!quote) return jsonError("Not found", 404);

  const tb = quote.transportBooking;
  if (!isAdminRole(user.primaryRole)) {
    if (tb.participantId === user.id) {
      /* ok */
    } else {
      const orgWhere = await providerTransportWhere(user);
      const allowed = await prisma.transportBooking.findFirst({
        where: { id: tb.id, ...orgWhere },
      });
      if (!allowed) return jsonError("Forbidden", 403);
    }
  }

  return jsonOk({ quote });
}
