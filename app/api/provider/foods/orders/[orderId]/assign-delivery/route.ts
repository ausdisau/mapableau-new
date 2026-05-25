import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { assignDelivery } from "@/lib/foods/delivery-service";
import { prisma } from "@/lib/prisma";
import { assignDeliverySchema } from "@/lib/validation/foods";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return jsonError("Vendor not found", 403);
  const { orderId } = await params;
  const order = await prisma.foodOrder.findFirst({
    where: { id: orderId, vendorId },
  });
  if (!order) return jsonError("Order not found", 404);
  const body = await req.json();
  const parsed = assignDeliverySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const assignment = await assignDelivery(
    orderId,
    parsed.data.driverUserId,
    user.id
  );
  return jsonOk({ assignment });
}
