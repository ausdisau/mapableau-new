import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listParticipantOrders } from "@/lib/foods/order-service";

export default async function FoodOrdersPage() {
  const user = await requirePermission("foods:read:self");
  const orders = await listParticipantOrders(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My orders</h1>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/foods/orders/${o.id}`} className="block rounded-lg border p-3">
              {o.id.slice(0, 8)} — {o.status} — ${(o.totalAmount / 100).toFixed(2)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
