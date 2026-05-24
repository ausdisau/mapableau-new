"use client";

import { useCallback, useEffect, useState } from "react";

import { AdModerationPanel } from "@/components/admin/AdModerationPanel";
import { Card } from "@/components/ui/card";

type Campaign = {
  id: string;
  name: string;
  status: string;
  advertiser: {
    category: string;
    organisation: { name: string };
  };
  creatives: {
    headline: string;
    body: string | null;
    altText: string;
    ctaLabel: string;
    landingUrl: string;
  }[];
  billingInvoice?: { status: string } | null;
};

export function AdminAdsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<{
    pendingReview: number;
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
  } | null>(null);

  const load = useCallback(async () => {
    const [qRes, sRes] = await Promise.all([
      fetch("/api/admin/ads/campaigns"),
      fetch("/api/admin/ads/campaigns?view=summary"),
    ]);
    const qData = await qRes.json();
    const sData = await sRes.json();
    if (qRes.ok) setCampaigns(qData.campaigns ?? []);
    if (sRes.ok) setSummary(sData.summary);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Pending review</p>
            <p className="text-2xl font-bold">{summary.pendingReview}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{summary.activeCampaigns}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Impressions</p>
            <p className="text-2xl font-bold">{summary.totalImpressions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Clicks</p>
            <p className="text-2xl font-bold">{summary.totalClicks}</p>
          </Card>
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-semibold">Moderation queue</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaigns pending review.</p>
        ) : (
          campaigns.map((c) => (
            <AdModerationPanel key={c.id} campaign={c} onUpdated={() => void load()} />
          ))
        )}
      </section>
    </div>
  );
}
