"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BudgetCategory = {
  id: string;
  supportCategory: string;
  allocatedCents: number;
  spentCents: number;
  committedCents: number;
  usedPercent?: number;
  usedCents?: number;
};

function formatAud(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function BudgetUsagePanel({ categories }: { categories: BudgetCategory[] }) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No budget categories yet. Add categories from your NDIS plan to track usage.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const used = cat.usedCents ?? cat.spentCents + cat.committedCents;
        const percent =
          cat.usedPercent ??
          (cat.allocatedCents > 0
            ? Math.round((used / cat.allocatedCents) * 100)
            : 0);
        const warning = percent >= 85;

        return (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle className="text-base">{cat.supportCategory}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label={`${cat.supportCategory}: ${percent}% used`}
              >
                <div
                  className={`h-full ${warning ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <p className="text-sm">
                {formatAud(used)} used of {formatAud(cat.allocatedCents)} allocated (
                {percent}%)
              </p>
              {warning ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This category is nearing its limit. A coordinator may review spending
                  with you.
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
