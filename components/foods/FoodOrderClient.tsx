"use client";

import { useState } from "react";

import { AllergyWarningPanel } from "@/components/foods/AllergyWarningPanel";
import { MenuItemCard } from "@/components/foods/MenuItemCard";

type MenuRow = {
  id: string;
  name: string;
  description: string | null;
  textureLevel: string;
  allergens?: { allergy: { label: string } }[];
};

export function FoodOrderClient({ menu }: { menu: MenuRow[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function placeOrder() {
    setMessage(null);
    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) {
      setMessage("Add at least one item.");
      return;
    }
    if (!allergyConfirmed) {
      setMessage("Confirm you have reviewed allergens.");
      return;
    }
    const res = await fetch("/api/foods/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        deliveryAddress: deliveryAddress || undefined,
        allergyConfirmed: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Order failed");
      return;
    }
    setConflicts(data.conflicts ?? []);
    setOrderId(data.order?.id ?? null);
    setMessage("Order created. Submit when ready.");
  }

  async function submitOrder() {
    if (!orderId) return;
    const res = await fetch(`/api/foods/orders/${orderId}/submit`, {
      method: "POST",
    });
    setMessage(res.ok ? "Order submitted to kitchen partner." : "Submit failed");
  }

  return (
    <div className="space-y-6">
      <AllergyWarningPanel conflicts={conflicts} />
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={allergyConfirmed}
          onChange={(e) => setAllergyConfirmed(e.target.checked)}
        />
        I have reviewed allergens and ingredients for this order.
      </label>
      <div>
        <label htmlFor="delivery" className="block text-sm font-medium">
          Delivery address
        </label>
        <input
          id="delivery"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          className="mt-1 w-full max-w-md min-h-10 rounded-lg border border-border px-3"
        />
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {menu.map((item) => (
          <li key={item.id}>
            <MenuItemCard
              item={item}
              quantity={quantities[item.id] ?? 0}
              onQuantityChange={(q) =>
                setQuantities((prev) => ({ ...prev, [item.id]: q }))
              }
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={placeOrder}
          className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          Create order
        </button>
        {orderId ? (
          <button
            type="button"
            onClick={submitOrder}
            className="min-h-11 rounded-lg border border-border px-4 font-medium"
          >
            Submit to kitchen
          </button>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
