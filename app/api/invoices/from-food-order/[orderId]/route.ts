import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createInvoiceFromFoodOrder } from "@/lib/foods/food-invoice-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ orderId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const order = await prisma.foodOrder.findFirst({
    where: { id: orderId, participantId: user.id },
  });
  if (!order) return jsonError("Not found", 404);
  try {
    const invoice = await createInvoiceFromFoodOrder(orderId, user.id);
    return jsonOk({ invoice }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "INVOICE_SPLIT_MISSING") {
      return jsonError("Invoice split not ready", 400);
    }
    return jsonError("Invoice creation failed", 500);
  }
}
