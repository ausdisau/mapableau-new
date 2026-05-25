"use client";

import Link from "next/link";

import { FoodOrderStatusTracker } from "./FoodOrderStatusTracker";

export function DriverFoodDeliveryScreen({
  delivery,
}: {
  delivery: {
    id: string;
    status: string;
    order?: {
      id: string;
      status: string;
      deliveryStatus: string;
      deliveryWindowStart?: string | null;
      deliveryWindowEnd?: string | null;
    };
  };
}) {
  async function status(path: string) {
    await fetch(`/api/driver/food-deliveries/${delivery.id}/${path}`, {
      method: "POST",
    });
    window.location.reload();
  }

  const order = delivery.order;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Delivery</h1>
      {order ? (
        <FoodOrderStatusTracker
          status={order.status}
          deliveryStatus={order.deliveryStatus}
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => status("picked-up")}
        >
          Picked up
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => status("out-for-delivery")}
        >
          Out for delivery
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => status("delivered")}
        >
          Delivered
        </button>
        <Link
          href={`/driver/food-deliveries/${delivery.id}/handover`}
          className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          Handover checklist
        </Link>
      </div>
    </div>
  );
}
