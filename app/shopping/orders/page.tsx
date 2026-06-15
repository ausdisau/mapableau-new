import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { ShoppingNav } from "@/components/shopping/ShoppingNav";
import { isShoppingEnabled } from "@/lib/config/shopping";
import { formatShopMoney } from "@/lib/shopping/format";
import { listOrdersForUser } from "@/lib/shopping/order-service";

export const metadata = {
  title: "Your orders | MapAble Shopping",
  description: "View your MapAble Shopping order history.",
};

export default async function ShoppingOrdersPage() {
  if (!isShoppingEnabled()) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const orders = await listOrdersForUser(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Your orders</h1>
        <p className="text-muted-foreground">
          Order history for your MapAble Shopping purchases.
        </p>
        <ShoppingNav />
      </header>

      <section className="mt-8" aria-label="Order list">
        {orders.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-border p-6">
            <p>You have not placed any orders yet.</p>
            <Link href="/shopping" className="text-sm underline">
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/shopping/orders/${order.id}`}
                  className="block rounded-lg border border-border p-4 hover:bg-muted/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        Order {order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatShopMoney(order.totalCents, order.currency)}
                      </p>
                      <p className="text-sm capitalize text-muted-foreground">
                        {order.status.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
