import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminFoodOrdersPage() {
  await requirePermission("foods:admin");
  const orders = await prisma.foodOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Food orders</h1>
      <ul className="mt-4 space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/foods/orders/${o.id}`} className="block rounded border p-3">
              {o.id.slice(0, 8)} — {o.status} — {o.paymentStatus}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
