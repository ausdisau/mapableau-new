"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type Campaign = {
  id: string;
  name: string;
  status: string;
  budgetCents: number;
  spentCents: number;
  billingInvoice?: { status: string } | null;
};

type Report = {
  totals: { impressions: number; clicks: number; ctrPercent: number };
  byDay: { date: string; impressions: number; clicks: number }[];
};

export function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cRes, rRes] = await Promise.all([
      fetch(`/api/ads/campaigns/${campaignId}`),
      fetch(`/api/ads/campaigns/${campaignId}/report`),
    ]);
    const cData = await cRes.json();
    const rData = await rRes.json();
    if (!cRes.ok) {
      setError(cData.error ?? "Not found");
      return;
    }
    setCampaign(cData.campaign);
    if (rRes.ok) setReport(rData.report);
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pay() {
    const res = await fetch(`/api/ads/campaigns/${campaignId}/checkout`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setError(data.error ?? "Checkout unavailable");
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!campaign) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">{campaign.name}</h2>
          <StatusBadge status={campaign.status} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Budget ${(campaign.budgetCents / 100).toFixed(2)} AUD · Spent{" "}
          {campaign.spentCents} impression units
        </p>
        {campaign.status === "pending_payment" ? (
          <Button variant="default" size="default" className="mt-4" onClick={() => void pay()}>
            Pay with Stripe
          </Button>
        ) : null}
        {campaign.status === "pending_review" ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Awaiting MapAble admin approval before ads go live.
          </p>
        ) : null}
      </Card>

      {report ? (
        <Card className="p-6">
          <h3 className="font-semibold">Aggregate reporting</h3>
          <p className="mt-2 text-sm">
            Impressions: {report.totals.impressions} · Clicks:{" "}
            {report.totals.clicks} · CTR: {report.totals.ctrPercent}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Anonymous daily aggregates only — no participant-level data.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
