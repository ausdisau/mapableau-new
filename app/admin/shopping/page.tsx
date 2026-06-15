import { requireAdmin } from "@/lib/auth/guards";
import { isShoppingEnabled } from "@/lib/config/shopping";
import { prisma } from "@/lib/prisma";

export default async function AdminShoppingPage() {
  await requireAdmin();

  const [products, orders] = await Promise.all([
    prisma.shopProduct.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.shopOrder.findMany({
      include: {
        billingInvoice: { select: { totalCents: true, currency: true } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">MapAble Shopping</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilot catalogue and order fulfilment overview.
        </p>
      </div>

      {!isShoppingEnabled() ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
          SHOPPING_ENABLED is false — storefront routes return 404.
        </p>
      ) : null}

      <section aria-labelledby="products-heading">
        <h2 id="products-heading" className="text-lg font-semibold">
          Products ({products.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {products.map((product) => (
            <li key={product.id} className="rounded border p-3 text-sm">
              <span className="font-medium">{product.title}</span> —{" "}
              {product.category} ({product.status})
              {product.stockQuantity != null ? (
                <span className="text-muted-foreground">
                  {" "}
                  · stock {product.stockQuantity}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="text-lg font-semibold">
          Recent orders ({orders.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {orders.length === 0 ? (
            <li className="text-sm text-muted-foreground">No orders yet.</li>
          ) : (
            orders.map((order) => (
              <li key={order.id} className="rounded border p-3 text-sm">
                <span className="font-medium">{order.id.slice(0, 8)}</span> —{" "}
                {order.status}
                <span className="text-muted-foreground">
                  {" "}
                  · {order.user.email ?? order.user.name ?? order.userId}
                  {" · "}
                  {(order.billingInvoice.totalCents / 100).toFixed(2)}{" "}
                  {order.billingInvoice.currency}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
