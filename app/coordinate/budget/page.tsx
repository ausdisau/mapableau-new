"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  coordinateFetch,
  participantQuery,
} from "@/components/coordinate/coordinate-client";
import { BudgetUsagePanel } from "@/components/coordinate/BudgetUsagePanel";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";

export default function CoordinateBudgetPage() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const query = participantQuery(participantId);

  const [categories, setCategories] = useState<
    Array<{
      id: string;
      supportCategory: string;
      allocatedCents: number;
      spentCents: number;
      committedCents: number;
      usedPercent?: number;
      usedCents?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plansRes = await coordinateFetch<{ plans: Array<{ id: string; status: string }> }>(
        `/api/coordinate/plans${query}`,
      );
      const plan = plansRes.plans.find((p) => ["draft", "active"].includes(p.status));
      if (!plan) {
        setCategories([]);
        return;
      }
      const budget = await coordinateFetch<{ categories: typeof categories }>(
        `/api/coordinate/plans/${plan.id}/budget${query}`,
      );
      setCategories(budget.categories);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader title="Budget tracker" />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      <BudgetUsagePanel categories={categories} />
    </div>
  );
}
