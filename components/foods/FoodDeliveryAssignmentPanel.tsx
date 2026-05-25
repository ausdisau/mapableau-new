"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function FoodDeliveryAssignmentPanel({
  orders,
}: {
  orders: Array<{ id: string; status: string }>;
}) {
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id} className="rounded-lg border p-4">
          <p className="font-medium">Order {o.id.slice(0, 8)} — {o.status}</p>
          <form
            className="mt-2 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await fetch(`/api/provider/foods/orders/${o.id}/assign-delivery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driverUserId: fd.get("driverUserId") }),
              });
            }}
          >
            <input
              name="driverUserId"
              required
              placeholder="Driver user ID"
              className={formInputClass}
              aria-label={`Assign driver for order ${o.id.slice(0, 8)}`}
            />
            <Button type="submit" variant="default" size="sm">
              Assign
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
