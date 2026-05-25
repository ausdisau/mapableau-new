"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function FoodProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title"),
      description: fd.get("description"),
      category: fd.get("category"),
      productType: fd.get("productType"),
      priceAmount: Math.round(Number(fd.get("price")) * 100),
      dietaryTags: String(fd.get("dietaryTags") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      allergenTags: String(fd.get("allergenTags") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const url = productId
      ? `/api/provider/foods/products/${productId}`
      : "/api/provider/foods/products";
    const res = await fetch(url, {
      method: productId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    const data = await res.json();
    router.push(`/provider/foods/products/${data.product.id}/edit`);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">{productId ? "Edit product" : "New product"}</h1>
      <input name="title" required placeholder="Title" className={formInputClass} />
      <textarea name="description" placeholder="Description" className={formInputClass} rows={3} />
      <input name="category" required placeholder="Category" className={formInputClass} />
      <select name="productType" className={formInputClass} defaultValue="grocery">
        <option value="grocery">Grocery</option>
        <option value="prepared_meal">Prepared meal</option>
        <option value="meal_bundle">Meal bundle</option>
        <option value="household_essential">Household essential</option>
      </select>
      <input name="price" type="number" step="0.01" required placeholder="Price (AUD)" className={formInputClass} />
      <input name="dietaryTags" placeholder="Dietary tags, comma-separated" className={formInputClass} />
      <input name="allergenTags" placeholder="Allergen tags, comma-separated" className={formInputClass} />
      {error ? <p role="alert">{error}</p> : null}
      <Button type="submit" variant="default" size="default">
        Save
      </Button>
    </form>
  );
}
