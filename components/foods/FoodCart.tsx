"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FoodCartItem } from "./FoodCartItem";

type CartItem = {
  id: string;
  quantity: number;
  product: { id: string; title: string; priceAmount: number };
};

export function FoodCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/foods/cart");
    const data = await res.json();
    setItems(data.cart?.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateQty(itemId: string, quantity: number) {
    setBusy(true);
    await fetch(`/api/foods/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await load();
    setBusy(false);
  }

  async function remove(itemId: string) {
    setBusy(true);
    await fetch(`/api/foods/cart/items/${itemId}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  const subtotal = items.reduce(
    (s, i) => s + i.product.priceAmount * i.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your cart</h1>
      {items.length === 0 ? (
        <p role="status">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => (
              <FoodCartItem
                key={item.id}
                id={item.id}
                title={item.product.title}
                quantity={item.quantity}
                unitPrice={item.product.priceAmount}
                busy={busy}
                onUpdate={(q) => updateQty(item.id, q)}
                onRemove={() => remove(item.id)}
              />
            ))}
          </ul>
          <p className="text-lg font-semibold" aria-live="polite">
            Subtotal: ${(subtotal / 100).toFixed(2)} AUD
          </p>
          <Link
            href="/foods/checkout"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Continue to checkout
          </Link>
        </>
      )}
    </div>
  );
}
