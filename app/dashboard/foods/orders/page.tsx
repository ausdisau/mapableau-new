import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Food orders | MapAble Foods" };

export default async function FoodOrdersPage() {
  const user = await requireAuth();
  const orders = await prisma.foodOrder.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/foods" className="text-sm text-primary hover:underline">
        ← Foods
      </Link>
      <h1 className="font-heading text-2xl font-bold">My food orders</h1>
      {orders.length === 0 ? (
        <p role="status">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/dashboard/foods/orders/${o.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    Order {o.id.slice(0, 8)}
                  </span>
                  <StatusTextBadge status={o.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {o.createdAt.toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
