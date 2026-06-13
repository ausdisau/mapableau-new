"use client";

import { useState } from "react";

type Props = {
  productId: string;
  productTitle: string;
};

export function AddToCartButton({ productId, productTitle }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addToCart() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/shopping/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Could not add to cart");
        return;
      }
      setStatus(`${productTitle} added to cart`);
    } catch {
      setStatus("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-20 rounded-md border border-input px-2 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addToCart}
          disabled={loading}
          className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add to cart"}
        </button>
      </div>
      {status ? (
        <p className="text-sm" role="status">
          {status}{" "}
          <a href="/shopping/cart" className="underline">
            View cart
          </a>
        </p>
      ) : null}
    </div>
  );
}
