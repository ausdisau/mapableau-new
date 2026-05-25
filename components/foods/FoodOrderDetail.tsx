"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { FoodOrderStatusTracker } from "./FoodOrderStatusTracker";
import { FoodOrderTimeline } from "./FoodOrderTimeline";
import { FoodPaymentStatus } from "./FoodPaymentStatus";

export function FoodOrderDetail({
  order,
}: {
  order: {
    id: string;
    status: string;
    deliveryStatus: string;
    paymentStatus: string;
    totalAmount: number;
    currency: string;
    items?: Array<{ titleSnapshot: string; quantity: number; totalAmount: number }>;
    events?: Array<{ id: string; title: string; createdAt: string }>;
  };
}) {
  const [msg, setMsg] = useState<string | null>(null);

  async function confirmDelivery() {
    const res = await fetch(`/api/foods/orders/${order.id}/confirm-delivery`, {
      method: "POST",
    });
    setMsg(res.ok ? "Delivery confirmed" : "Could not confirm");
  }

  async function pay() {
    const res = await fetch(`/api/foods/orders/${order.id}/create-payment-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setMsg(data.error ?? "Payment unavailable");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order {order.id.slice(0, 8)}</h1>
      <FoodOrderStatusTracker status={order.status} deliveryStatus={order.deliveryStatus} />
      <FoodPaymentStatus status={order.paymentStatus} totalCents={order.totalAmount} currency={order.currency} />
      <section>
        <h2 className="font-semibold">Items</h2>
        <ul className="mt-2 space-y-1">
          {(order.items ?? []).map((i, idx) => (
            <li key={idx} className="text-sm">
              {i.titleSnapshot} × {i.quantity} — ${(i.totalAmount / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      </section>
      {order.events ? <FoodOrderTimeline events={order.events} /> : null}
      <div className="flex flex-wrap gap-2">
        {order.paymentStatus === "unpaid" && order.status !== "cancelled" ? (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => void pay()}
            aria-label="Pay for order"
          >
            Pay now
          </Button>
        ) : null}
        {order.deliveryStatus === "delivered" ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void confirmDelivery()}
          >
            Confirm delivery
          </Button>
        ) : null}
      </div>
      {msg ? <p role="status">{msg}</p> : null}
    </div>
  );
}
