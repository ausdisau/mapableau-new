"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { mapableSearchInputClass } from "@/lib/brand/styles";

export function FoodSearchBar({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const q = String(fd.get("q") ?? "").trim();
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      router.push(`/foods/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <form onSubmit={onSubmit} role="search" aria-label="Search food products">
      <label htmlFor="food-search" className="sr-only">
        Search groceries and meals
      </label>
      <input
        id="food-search"
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Search groceries, meals, essentials…"
        className={mapableSearchInputClass}
        autoComplete="off"
      />
    </form>
  );
}
