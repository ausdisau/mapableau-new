"use client";

import { useState } from "react";

import { AdLabel } from "@/components/ads/AdLabel";
import { Button } from "@/components/ui/button";

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

export function AdModerationPanel({
  campaign,
  onUpdated,
}: {
  campaign: Campaign;
  onUpdated: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moderate(decision: "approved" | "rejected") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/ads/campaigns/${campaign.id}/moderate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, notes: notes || undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Moderation failed");
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const creative = campaign.creatives[0];

  return (
    <article className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <AdLabel />
          <h3 className="mt-2 font-semibold">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">
            {campaign.advertiser.organisation.name} · {campaign.advertiser.category}
          </p>
          <p className="text-xs text-muted-foreground">
            Invoice: {campaign.billingInvoice?.status ?? "n/a"}
          </p>
        </div>
      </div>

      {creative ? (
        <div className="mt-4 space-y-1 text-sm">
          <p>
            <strong>Headline:</strong> {creative.headline}
          </p>
          {creative.body ? <p>{creative.body}</p> : null}
          <p>
            <strong>Alt text:</strong> {creative.altText}
          </p>
          <p>
            <strong>CTA:</strong> {creative.ctaLabel}
          </p>
          <p>
            <strong>URL:</strong> {creative.landingUrl}
          </p>
        </div>
      ) : null}

      <label className="mt-4 block text-sm">
        Moderation notes
        <textarea
          className="mt-1 w-full rounded-lg border border-input px-3 py-2"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <Button
          variant="default"
          size="default"
          disabled={loading || campaign.billingInvoice?.status !== "paid"}
          onClick={() => void moderate("approved")}
        >
          Approve
        </Button>
        <Button
          variant="outline"
          size="default"
          disabled={loading}
          onClick={() => void moderate("rejected")}
        >
          Reject
        </Button>
      </div>
    </article>
  );
}
