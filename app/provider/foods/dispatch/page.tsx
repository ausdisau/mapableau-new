import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderFoodsDispatchPage() {
  const user = await requirePermission("foods:manage:org");
  const orgIds = await getUserOrganisationIds(user.id);
  const orders = await prisma.foodOrder.findMany({
    where: { organisationId: { in: orgIds }, assignment: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Food delivery dispatch</h1>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="rounded-xl border p-4">
            <Link href={`/provider/foods/orders/${order.id}`} className="text-primary hover:underline">
              Assign order for {order.deliveryAddressSuburb ?? "selected suburb"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
