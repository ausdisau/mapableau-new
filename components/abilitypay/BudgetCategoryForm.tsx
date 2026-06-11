"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BudgetCategoryForm({ planId }: { planId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [allocated, setAllocated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const allocatedCents = Math.round(parseFloat(allocated) * 100);
    if (Number.isNaN(allocatedCents) || allocatedCents < 0) {
      setError("Enter a valid amount.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/abilitypay/plans/${planId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, allocatedCents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not add category");
      }
      setName("");
      setAllocated("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add budget category</CardTitle>
        <CardDescription>
          Enter amounts manually for your MVP plan wallet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="cat-name" className="text-sm font-medium">
              Category name
            </label>
            <input
              id="cat-name"
              required
              className="mt-1 block min-h-11 w-full rounded-lg border border-input bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cat-allocated" className="text-sm font-medium">
              Allocated amount (AUD)
            </label>
            <input
              id="cat-allocated"
              required
              type="number"
              min="0"
              step="0.01"
              className="mt-1 block min-h-11 w-full rounded-lg border border-input bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={allocated}
              onChange={(e) => setAllocated(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="default"
            size="default"
            className="min-h-11"
            disabled={loading}
          >
            {loading ? "Saving…" : "Add category"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
