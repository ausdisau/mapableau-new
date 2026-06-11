import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatCents } from "./utils";

export function SpendingForecastPanel({
  remainingCents,
  monthsRemaining,
}: {
  remainingCents: number;
  monthsRemaining: number;
}) {
  const monthlyBand =
    monthsRemaining > 0
      ? Math.round(remainingCents / monthsRemaining)
      : remainingCents;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending guide</CardTitle>
        <CardDescription>
          Informational only — not financial advice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          If you spread your remaining budget evenly over about{" "}
          <strong>{monthsRemaining}</strong> months, you might spend around{" "}
          <strong>{formatCents(monthlyBand)}</strong> per month. Your actual
          spending will depend on your supports.
        </p>
      </CardContent>
    </Card>
  );
}
