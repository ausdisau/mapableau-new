"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueSnapshot } from "@/lib/monetization/revenue-dashboard-service";

function formatAud(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function AdminMonetizationClient({ snapshot }: { snapshot: RevenueSnapshot }) {
  const flags = [
    { label: "Stripe configured", ok: snapshot.stripeConfigured },
    { label: "AdSense enabled", ok: snapshot.adsenseEnabled },
    { label: "Partner marketplace", ok: snapshot.marketplaceEnabled },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {flags.map((flag) => (
          <Card key={flag.label}>
            <CardHeader className="pb-2">
              <CardDescription>{flag.label}</CardDescription>
              <CardTitle className="text-lg">{flag.ok ? "On" : "Off"}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paid invoices</CardTitle>
            <CardDescription>Billing-core totals (Connect + checkout)</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatAud(snapshot.totals.billingInvoicesPaidCents)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open pipeline</CardTitle>
            <CardDescription>Draft and awaiting payment</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatAud(snapshot.totals.billingInvoicesOpenCents)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {snapshot.totals.activeSubscriptions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ads Manager spend</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatAud(snapshot.totals.adCampaignSpendCents)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active ad campaigns</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {snapshot.totals.activeAdCampaigns}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Marketplace listings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {snapshot.totals.publishedMarketplaceListings}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
