import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { transportBookingId } = await params;
  const plan = await prisma.routePlan.findFirst({
    where: { transportBookingId },
    orderBy: { createdAt: "desc" },
    include: {
      stops: { orderBy: { sequence: "asc" } },
      travelEstimates: true,
      candidates: true,
    },
  });
  if (!plan) return jsonError("Not found", 404);
  return jsonOk(plan);
}
