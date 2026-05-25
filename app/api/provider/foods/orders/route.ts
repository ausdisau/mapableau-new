import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonOk } from "@/lib/api/response";
import { toVendorOrderDTO } from "@/lib/foods/access-control";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("foods:read:org");
  if (user instanceof Response) return user;
  const orgIds = await getUserOrganisationIds(user.id);
  const orders = await prisma.foodOrder.findMany({ where: { organisationId: { in: orgIds } }, include: { items: true, vendor: true, assignment: true }, orderBy: { createdAt: "desc" } });
  return jsonOk({ orders: await Promise.all(orders.map((order) => toVendorOrderDTO(order, user.id))) });
}
