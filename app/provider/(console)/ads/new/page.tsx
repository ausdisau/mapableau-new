"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdvertiserOption = { id: string; name: string };

export default function NewAdsCampaignPage() {
  const router = useRouter();
  const [advertisers, setAdvertisers] = useState<AdvertiserOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/ads/manager")
      .then((r) => r.json())
      .then((body) => {
        const list =
          body?.data?.advertisers ?? body?.advertisers ?? [];
        setAdvertisers(
          list.map((row: { advertiser: AdvertiserOption }) => row.advertiser),
        );
      })
      .catch(() => setError("Failed to load advertisers"));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const placementCodes = fd.getAll("placementCodes").map(String);
    const payload = {
      advertiserId: String(fd.get("advertiserId")),
      name: String(fd.get("name")),
      bidModel: String(fd.get("bidModel")),
      maxBidAud: String(fd.get("maxBidAud")),
      dailyBudgetAud: String(fd.get("dailyBudgetAud") || "") || undefined,
      lifetimeBudgetAud: String(fd.get("lifetimeBudgetAud") || "") || undefined,
      region: String(fd.get("region") || "national"),
      category: String(fd.get("category") || "") || undefined,
      placementCodes,
      creative: {
        format: String(fd.get("format") || "text_card"),
        headline: String(fd.get("headline")),
        body: String(fd.get("body")),
        destinationUrl: String(fd.get("destinationUrl")),
        businessName: String(fd.get("businessName") || "") || undefined,
        altText: String(fd.get("altText") || "") || undefined,
      },
    };

    try {
      const res = await fetch("/api/ads/manager/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create campaign");
        return;
      }
      router.push("/provider/ads");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">New Ads campaign</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You will never be charged more than your maximum bid. Actual price may
          be lower depending on competing eligible ads and MapAble placement
          reserve prices. Impression volume is not guaranteed.
        </p>
      </header>

      <aside className="text-sm text-muted-foreground" aria-label="Pricing guidance">
        <p>Reference floors (CPM): Map Pin A$16 · Map Card A$18 · Access Results A$20 · Provider Finder A$24–28.</p>
      </aside>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="advertiserId" className="block text-sm font-medium">
            Advertiser
          </label>
          <select
            id="advertiserId"
            name="advertiserId"
            required
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          >
            <option value="">Select…</option>
            {advertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Campaign name
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Pricing mode</legend>
          <div className="mt-2 flex gap-4">
            <label className="inline-flex min-h-11 items-center gap-2">
              <input type="radio" name="bidModel" value="CPM" defaultChecked />
              CPM
            </label>
            <label className="inline-flex min-h-11 items-center gap-2">
              <input type="radio" name="bidModel" value="CPC" />
              CPC
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="maxBidAud" className="block text-sm font-medium">
            Maximum bid (AUD)
          </label>
          <input
            id="maxBidAud"
            name="maxBidAud"
            required
            inputMode="decimal"
            placeholder="22.00"
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dailyBudgetAud" className="block text-sm font-medium">
              Daily budget (AUD)
            </label>
            <input
              id="dailyBudgetAud"
              name="dailyBudgetAud"
              inputMode="decimal"
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
            />
          </div>
          <div>
            <label
              htmlFor="lifetimeBudgetAud"
              className="block text-sm font-medium"
            >
              Lifetime budget (AUD)
            </label>
            <input
              id="lifetimeBudgetAud"
              name="lifetimeBudgetAud"
              inputMode="decimal"
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
            />
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Placements</legend>
          <div className="mt-2 space-y-2">
            {[
              "access.map.sponsored-marker",
              "access.map.sponsored-card",
              "access.results.inline",
              "provider-finder.map.sponsored-card",
              "provider-finder.results.inline",
              "provider-finder.sidebar",
            ].map((code) => (
              <label key={code} className="flex min-h-11 items-center gap-2">
                <input type="checkbox" name="placementCodes" value={code} />
                <span className="text-sm">{code}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="region" className="block text-sm font-medium">
              Region
            </label>
            <input
              id="region"
              name="region"
              defaultValue="national"
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium">
              Category
            </label>
            <input
              id="category"
              name="category"
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="headline" className="block text-sm font-medium">
            Creative headline
          </label>
          <input
            id="headline"
            name="headline"
            required
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-medium">
            Creative body
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="destinationUrl" className="block text-sm font-medium">
            Destination URL
          </label>
          <input
            id="destinationUrl"
            name="destinationUrl"
            type="url"
            required
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          />
        </div>
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium">
            Business name
          </label>
          <input
            id="businessName"
            name="businessName"
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          />
        </div>
        <input type="hidden" name="format" value="text_card" />
        <input type="hidden" name="altText" value="" />

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Saving…" : "Create draft campaign"}
        </button>
      </form>
    </div>
  );
}
