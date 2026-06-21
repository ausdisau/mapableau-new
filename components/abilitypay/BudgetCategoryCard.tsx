import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatCents } from "./utils";

export function BudgetCategoryCard({
  name,
  description,
  allocatedCents,
  spentCents,
}: {
  name: string;
  description?: string | null;
  allocatedCents: number;
  spentCents: number;
}) {
  const remaining = allocatedCents - spentCents;
  const usedPct =
    allocatedCents > 0 ? Math.round((spentCents / allocatedCents) * 100) : 0;

  return (
    <Card variant="interactive">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Spent</span>
          <span className="font-medium">{formatCents(spentCents)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Allocated</span>
          <span>{formatCents(allocatedCents)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-primary">
          <span>Remaining</span>
          <span>{formatCents(remaining)}</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={usedPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${usedPct}% of ${name} budget used`}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(usedPct, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
