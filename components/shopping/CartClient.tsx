"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { formatShopMoney } from "@/lib/shopping/format";
import type { ShopCartView } from "@/types/shopping";

import { ShoppingSafetyNotice } from "./ShoppingSafetyNotice";

export function CartClient() {
  const [cart, setCart] = useState<ShopCartView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shopping/cart");
      if (res.status === 401) {
        setError("Sign in to view your cart.");
        setCart(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load cart");
        return;
      }
      setCart(data.cart);
    } catch {
      setError("Could not load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  async function updateQuantity(productId: string, quantity: number) {
    const res = await fetch("/api/shopping/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (res.ok) {
      setCart(data.cart);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading cart…</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p>{error}</p>
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="space-y-4">
        <p>Your cart is empty.</p>
        <Link href="/shopping" className="underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {cart.lines.map((line) => (
          <li
            key={line.productId}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link
                href={`/shopping/products/${line.slug}`}
                className="font-medium hover:underline"
              >
                {line.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatShopMoney(line.unitAmountCents, cart.totals.currency)} each
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor={`qty-${line.productId}`}>
                Quantity for {line.title}
              </label>
              <input
                id={`qty-${line.productId}`}
                type="number"
                min={0}
                max={99}
                value={line.quantity}
                onChange={(e) =>
                  void updateQuantity(line.productId, Number(e.target.value))
                }
                className="w-20 rounded-md border border-input px-2 py-2"
              />
              <p className="min-w-[5rem] text-right font-medium">
                {formatShopMoney(line.lineSubtotalCents, cart.totals.currency)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <aside className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatShopMoney(cart.totals.subtotalCents, cart.totals.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>GST</dt>
            <dd>{formatShopMoney(cart.totals.gstCents, cart.totals.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Platform fee</dt>
            <dd>
              {formatShopMoney(cart.totals.platformFeeCents, cart.totals.currency)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatShopMoney(cart.totals.totalCents, cart.totals.currency)}</dd>
          </div>
        </dl>
        <ShoppingSafetyNotice compact />
        <Link
          href="/shopping/checkout"
          className="flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
