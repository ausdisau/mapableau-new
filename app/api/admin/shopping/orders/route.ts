import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const orders = await prisma.shopOrder.findMany({
    include: {
      billingInvoice: {
        select: {
          id: true,
          totalCents: true,
          currency: true,
          status: true,
        },
      },
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return jsonOk({
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      userId: order.userId,
      userEmail: order.user.email,
      userName: order.user.name,
      billingInvoiceId: order.billingInvoiceId,
      invoiceStatus: order.billingInvoice.status,
      totalCents: order.billingInvoice.totalCents,
      currency: order.billingInvoice.currency,
      shippingName: order.shippingName,
      shippingEmail: order.shippingEmail,
      createdAt: order.createdAt.toISOString(),
    })),
  });
}
