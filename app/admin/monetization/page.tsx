import Link from "next/link";

import { AdminMonetizationClient } from "@/components/admin/AdminMonetizationClient";
import { getRevenueSnapshot } from "@/lib/monetization/revenue-dashboard-service";

export const metadata = { title: "Monetization dashboard" };

export default async function AdminMonetizationPage() {
  const snapshot = await getRevenueSnapshot();

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Monetization dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Stripe billing, subscriptions, Ads Manager, and marketplace revenue signals.
          </p>
        </div>
        <Link href="/admin/billing" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Billing admin
        </Link>
      </div>
      <AdminMonetizationClient snapshot={snapshot} />
    </main>
  );
}
