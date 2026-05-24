import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "MapAble Foods | MapAble Core" };

export default async function FoodsDashboardPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">MapAble Foods</h1>
        <p className="text-muted-foreground">
          Partner-kitchen meals with allergy-aware ordering and split invoices.
        </p>
      </header>
      <nav aria-label="Foods sections" className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/foods/profile"
          className="min-h-11 rounded-lg border border-border px-4 inline-flex items-center font-medium hover:bg-muted"
        >
          Dietary profile
        </Link>
        <Link
          href="/dashboard/foods/menu"
          className="min-h-11 rounded-lg bg-primary px-4 inline-flex items-center font-medium text-primary-foreground"
        >
          Order meals
        </Link>
        <Link
          href="/dashboard/foods/orders"
          className="min-h-11 rounded-lg border border-border px-4 inline-flex items-center font-medium hover:bg-muted"
        >
          My orders
        </Link>
      </nav>
    </div>
  );
}
