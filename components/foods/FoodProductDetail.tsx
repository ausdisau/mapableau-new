"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableSectionCardClass } from "@/lib/brand/styles";

import { AllergyProfileNotice } from "./AllergyProfileNotice";

export function FoodProductDetail({
  product,
  profileAllergens = [],
}: {
  product: {
    id: string;
    title: string;
    description?: string | null;
    priceAmount: number;
    currency: string;
    dietaryTags: unknown;
    allergenTags: unknown;
    accessibilityTags: unknown;
  };
  profileAllergens?: string[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const allergens = (product.allergenTags as string[]) ?? [];
  const warnings = profileAllergens.filter((a) =>
    allergens.some((t) => t.toLowerCase() === a.toLowerCase())
  );

  async function addToCart() {
    const res = await fetch("/api/foods/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });
    setMessage(res.ok ? "Added to cart" : "Could not add to cart");
  }

  return (
    <article className={`${mapableSectionCardClass} p-6`}>
      <h1 className="text-2xl font-bold">{product.title}</h1>
      {product.description ? (
        <p className="mt-2 text-muted-foreground">{product.description}</p>
      ) : null}
      <p className="mt-4 text-xl font-semibold">
        ${(product.priceAmount / 100).toFixed(2)} {product.currency}
      </p>
      {warnings.length > 0 ? (
        <div className="mt-4">
          <AllergyProfileNotice allergens={profileAllergens} warnings={warnings} />
        </div>
      ) : null}
      <Button
        type="button"
        variant="default"
        size="default"
        className="mt-6 min-h-11"
        aria-label={`Add ${product.title} to cart`}
        onClick={() => void addToCart()}
      >
        Add to cart
      </Button>
      {message ? (
        <p role="status" className="mt-2 text-sm">
          {message}
        </p>
      ) : null}
    </article>
  );
}
