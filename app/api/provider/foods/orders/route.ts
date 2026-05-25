import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (
    user.primaryRole !== "provider_admin" &&
    user.primaryRole !== "mapable_admin"
  ) {
    return jsonError("Forbidden", 403);
  }
  const status = new URL(req.url).searchParams.get("status");
  const orders = await prisma.foodOrder.findMany({
    where: status
      ? { status: status as never }
      : {
          status: {
            in: ["submitted", "scheduled", "in_delivery", "allergy_pending"],
          },
        },
    include: {
      participant: { select: { id: true, name: true, email: true } },
      items: { include: { menuItem: true } },
      safetyEvents: true,
      deliveryRun: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return jsonOk({ orders });
}
