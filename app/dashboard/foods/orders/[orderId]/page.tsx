import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { getFoodOrderForParticipant } from "@/lib/foods/food-order-service";

type Props = { params: Promise<{ orderId: string }> };

export default async function FoodOrderDetailPage({ params }: Props) {
  const user = await requireAuth();
  const { orderId } = await params;
  const order = await getFoodOrderForParticipant(orderId, user.id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/foods/orders"
        className="text-sm text-primary hover:underline"
      >
        ← Orders
      </Link>
      <header className="flex flex-wrap justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold">Food order</h1>
        <StatusTextBadge status={order.status} />
      </header>
      <ul className="space-y-2">
        {order.items.map((line) => (
          <li key={line.id} className="text-sm">
            {line.quantity}× {line.menuItem.name}
          </li>
        ))}
      </ul>
      {order.invoiceSplit ? (
        <p className="text-sm text-muted-foreground">
          {order.invoiceSplit.plainLanguageNote}
        </p>
      ) : null}
      {order.deliveryAddress ? (
        <p className="text-sm">Delivery: {order.deliveryAddress}</p>
      ) : null}
    </div>
  );
}
