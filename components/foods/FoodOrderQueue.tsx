"use client";

import { Button } from "@/components/ui/button";

export function FoodOrderQueue({
  orders,
}: {
  orders: Array<{ id: string; status: string; totalAmount: number; createdAt: string }>;
}) {
  async function action(orderId: string, path: string) {
    await fetch(`/api/provider/foods/orders/${orderId}/${path}`, { method: "POST" });
    window.location.reload();
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id} className="rounded-lg border p-4">
          <p className="font-medium">
            {o.id.slice(0, 8)} — {o.status} — ${(o.totalAmount / 100).toFixed(2)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {o.status === "submitted" ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => action(o.id, "confirm")}
              >
                Confirm
              </Button>
            ) : null}
            {o.status === "confirmed" ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => action(o.id, "mark-preparing")}
              >
                Preparing
              </Button>
            ) : null}
            {o.status === "preparing" ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => action(o.id, "mark-packed")}
              >
                Packed
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
