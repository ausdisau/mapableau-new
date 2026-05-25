import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { scheduleFoodDeliveryViaTransport } from "@/lib/foods/food-delivery-adapter";
import { prisma } from "@/lib/prisma";
import { scheduleDeliverySchema } from "@/lib/validation/foods";

type Params = { params: Promise<{ orderId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  try {
    const parsed = scheduleDeliverySchema.parse(await req.json());
    const owned = await prisma.foodOrder.findFirst({
      where: { id: orderId, participantId: user.id },
    });
    if (!owned) return jsonError("Not found", 404);
    const result = await scheduleFoodDeliveryViaTransport({
      foodOrderId: orderId,
      participantId: user.id,
      actorUserId: user.id,
      scheduledAt: new Date(parsed.scheduledAt),
      deliveryAddress: parsed.deliveryAddress,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Schedule failed", 500);
  }
}
