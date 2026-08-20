"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PLACEMENT_REGISTRY } from "@/lib/ads/placement-registry";

const PLACEMENT_OPTIONS = Object.keys(PLACEMENT_REGISTRY);

type Props = {
  organisationId: string;
  organisationName: string;
};

export function AdManagerPreRegisterForm({
  organisationId,
  organisationName,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [advertiserName, setAdvertiserName] = useState(organisationName);
  const [campaignName, setCampaignName] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("https://");
  const [businessName, setBusinessName] = useState("");
  const [placement, setPlacement] = useState("provider-finder.results.inline");
  const [submitForReview, setSubmitForReview] = useState(true);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const advRes = await fetch("/api/ads/manager/advertisers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: advertiserName, organisationId }),
      });
      if (!advRes.ok) {
        const d = (await advRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed to create advertiser");
      }
      const { advertiser } = (await advRes.json()) as {
        advertiser: { id: string };
      };

      const campRes = await fetch("/api/ads/manager/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserId: advertiser.id,
          name: campaignName || `${advertiserName} campaign`,
          placementCodes: [placement],
        }),
      });
      if (!campRes.ok) {
        const d = (await campRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed to create campaign");
      }
      const { campaign } = (await campRes.json()) as {
        campaign: { id: string };
      };

      const creRes = await fetch("/api/ads/manager/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          format: "text_card",
          headline,
          body,
          destinationUrl,
          businessName: businessName || advertiserName,
        }),
      });
      if (!creRes.ok) {
        const d = (await creRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed to create creative");
      }
      const { creative } = (await creRes.json()) as { creative: { id: string } };

      if (submitForReview) {
        const subRes = await fetch(
          `/api/ads/manager/creatives/${creative.id}/submit`,
          { method: "POST" },
        );
        if (!subRes.ok) {
          const d = (await subRes.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(d.error ?? "Failed to submit for review");
        }
      }

      router.push(`/provider/ads/campaigns/${campaign.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <p className="rounded border border-border bg-muted/40 p-3 text-sm">
        Submitted for MapAble review. Ads will not appear until approved and
        enabled by MapAble.
      </p>

      <label className="block text-sm font-medium">
        Advertiser name
        <input
          className="mt-1 w-full min-h-11 rounded border border-input px-3"
          value={advertiserName}
          onChange={(e) => setAdvertiserName(e.target.value)}
          required
          disabled={busy}
        />
      </label>

      <label className="block text-sm font-medium">
        Campaign name
        <input
          className="mt-1 w-full min-h-11 rounded border border-input px-3"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          disabled={busy}
        />
      </label>

      <label className="block text-sm font-medium">
        Placement
        <select
          className="mt-1 w-full min-h-11 rounded border border-input px-3"
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          disabled={busy}
        >
          {PLACEMENT_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Business name (display)
        <input
          className="mt-1 w-full min-h-11 rounded border border-input px-3"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          disabled={busy}
        />
      </label>

      <label className="block text-sm font-medium">
        Headline
        <input
          className="mt-1 w-full min-h-11 rounded border border-input px-3"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          required
          disabled={busy}
        />
      </label>

      <label className="block text-sm font-medium">
        Body
        <textarea
          className="mt-1 w-full min-h-24 rounded border border-input px-3 py-2"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          disabled={busy}
        />
      </label>

      <label className="block text-sm font-medium">
        Destination URL (HTTPS)
        <input
          type="url"
          className="mt-1 w-full min-h-11 rounded border border-input px-3"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          required
          disabled={busy}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={submitForReview}
          onChange={(e) => setSubmitForReview(e.target.checked)}
          disabled={busy}
        />
        Submit for MapAble review now
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="min-h-11 rounded bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <Link
          href="/provider/ads"
          className="inline-flex min-h-11 items-center text-sm underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
