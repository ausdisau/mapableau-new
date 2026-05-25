import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { assertParticipantOwnsOrder, toParticipantOrderDTO } from "@/lib/foods/access-control";
import { listParticipantFoodOrders } from "@/lib/foods/order-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("foods:read:self");
  if (user instanceof Response) return user;
  const orders = await listParticipantFoodOrders(user.id);
  return jsonOk({ orders: orders.map(toParticipantOrderDTO) });
}
