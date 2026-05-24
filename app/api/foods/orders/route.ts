import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createFoodOrder } from "@/lib/foods/food-order-service";
import { prisma } from "@/lib/prisma";
import { createFoodOrderSchema } from "@/lib/validation/foods";

export async function GET() {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const orders = await prisma.foodOrder.findMany({
    where: { participantId: user.id },
    include: {
      items: { include: { menuItem: true } },
      invoiceSplit: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ orders });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = createFoodOrderSchema.parse(await req.json());
    const result = await createFoodOrder({
      participantId: user.id,
      actorUserId: user.id,
      items: parsed.items,
      deliveryAddress: parsed.deliveryAddress,
      participantNotes: parsed.participantNotes,
      allergyConfirmed: parsed.allergyConfirmed,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "ALLERGY_CONFIRMATION_REQUIRED") {
      return jsonError("Allergy confirmation is required", 400);
    }
    return jsonError("Create order failed", 500);
  }
}
