"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    await fetch("/api/foods/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={loading}
      className="inline-flex min-h-11 items-center rounded-lg bg-orange-600 px-5 font-semibold text-white disabled:opacity-50"
    >
      {loading ? "Adding..." : "Add to cart"}
    </button>
  );
}

export function FoodCartItemActions({ itemId }: { itemId: string }) {
  const router = useRouter();

  async function remove() {
    await fetch("/api/foods/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} className="min-h-11 rounded-lg border px-4">
      Remove
    </button>
  );
}
