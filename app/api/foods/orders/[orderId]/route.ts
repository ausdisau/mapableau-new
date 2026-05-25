import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { toParticipantOrderDTO } from "@/lib/foods/access-control";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:read:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const order = await prisma.foodOrder.findFirst({ where: { id: orderId, OR: [{ participantId: user.id }, { nomineeId: user.id }] }, include: { items: true, vendor: true, assignment: true } });
  if (!order) return jsonError("Not found", 404);
  return jsonOk({ order: toParticipantOrderDTO(order) });
}
