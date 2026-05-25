import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { toDriverDeliveryDTO } from "@/lib/foods/access-control";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  const deliveries = await prisma.foodDeliveryAssignment.findMany({ where: { driverUserId: user.id }, include: { order: { include: { items: true } } }, orderBy: { assignedAt: "desc" } });
  return jsonOk({ deliveries: await Promise.all(deliveries.map((d) => toDriverDeliveryDTO(d, user.id))) });
}
