import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatCents } from "./utils";

type Category = {
  id: string;
  name: string;
  allocatedCents: number;
  spentCents: number;
};

export function PlanWalletSummary({
  title,
  allocatedCents,
  spentCents,
  remainingCents,
  categories,
}: {
  title: string;
  allocatedCents: number;
  spentCents: number;
  remainingCents: number;
  categories: Category[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Money for your supports</CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Allocated</dt>
            <dd className="text-xl font-semibold">{formatCents(allocatedCents)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Spent</dt>
            <dd className="text-xl font-semibold">{formatCents(spentCents)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Remaining</dt>
            <dd className="text-xl font-semibold text-primary">
              {formatCents(remainingCents)}
            </dd>
          </div>
        </dl>

        {categories.length > 0 ? (
          <table className="w-full text-sm">
            <caption className="sr-only">Budget by category</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="py-2 pr-2">
                  Category
                </th>
                <th scope="col" className="py-2 pr-2">
                  Allocated
                </th>
                <th scope="col" className="py-2 pr-2">
                  Spent
                </th>
                <th scope="col" className="py-2">
                  Left
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border/40">
                  <td className="py-2 pr-2">{cat.name}</td>
                  <td className="py-2 pr-2">{formatCents(cat.allocatedCents)}</td>
                  <td className="py-2 pr-2">{formatCents(cat.spentCents)}</td>
                  <td className="py-2">
                    {formatCents(cat.allocatedCents - cat.spentCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No budget categories yet. Add them on the Budgets page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
