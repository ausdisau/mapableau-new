import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listDriverDeliveries } from "@/lib/foods/delivery-service";

export default async function DriverFoodDeliveriesPage() {
  const user = await requirePermission("foods:deliver:assigned");
  const deliveries = await listDriverDeliveries(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Food deliveries</h1>
      <ul className="space-y-2">
        {deliveries.map((d) => (
          <li key={d.id}>
            <Link href={`/driver/food-deliveries/${d.id}`} className="block rounded-lg border p-3">
              {d.id.slice(0, 8)} — {d.status}
              {d.order?.deliveryAddressSuburb
                ? ` — ${d.order.deliveryAddressSuburb}`
                : ""}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
