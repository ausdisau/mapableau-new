"use client";

import { useId, useState } from "react";

type AdvertiserOption = { id: string; name: string };

type Opportunity = {
  opportunityId: string;
  channel: string;
  providerId: string;
  externalInventoryId: string;
  availabilityState: string;
  priceEstimateMinor: number;
  buyable: boolean;
  geoRegion: string;
  inventorySource: string;
  sourceObservedAt: string;
};

type QuoteResponse = {
  id: string;
  termsHash: string;
  expiresAt: string;
  price: {
    amountMinor: number;
    mediaMinor: number;
    taxMinor: number;
    mapAbleFeesMinor: number;
    partnerFeesMinor: number;
    currency: string;
  };
  capabilityStatus: string;
};

type OrderResponse = {
  id: string;
  status: string;
  freezeRetry: boolean;
  operationId?: string;
};

export function PlacementPlannerClient(props: {
  advertisers: AdvertiserOption[];
  placementApiEnabled: boolean;
  discoveryEnabled: boolean;
  doohSandboxEnabled: boolean;
}) {
  const formId = useId();
  const [advertiserId, setAdvertiserId] = useState(props.advertisers[0]?.id ?? "");
  const [budgetMinor, setBudgetMinor] = useState(250000);
  const [mapableCap, setMapableCap] = useState(100000);
  const [doohCap, setDoohCap] = useState(150000);
  const [status, setStatus] = useState<string>("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [exclusions, setExclusions] = useState<
    Array<{ opportunityId: string; reasonCodes: string[] }>
  >([]);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [deliveryCsv, setDeliveryCsv] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function searchPlacements() {
    if (!props.placementApiEnabled) {
      setStatus("Placement API flag is off.");
      return;
    }
    setBusy(true);
    setStatus("Searching eligible placements…");
    try {
      const channels = ["mapable"] as string[];
      if (props.doohSandboxEnabled) channels.push("dooh");
      const res = await fetch("/api/ads/v1/placements/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels,
          region: { country: "AU", state: "NSW", locality: "Sydney" },
          flight: {
            start: "2026-12-01",
            end: "2026-12-15",
            timeZone: "Australia/Sydney",
          },
          budget: { amountMinor: budgetMinor, currency: "AUD" },
          creative: { format: "image", aspectRatio: "16:9", captioned: true },
          targeting: { kind: "contextual", dayparts: ["morning"] },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Search failed");
        return;
      }
      setOpportunities(data.opportunities ?? []);
      setExclusions(data.exclusions ?? []);
      setStatus(
        `Found ${data.opportunities?.length ?? 0} eligible opportunities (planning only; buyable=false).`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function createQuote(opportunity: Opportunity) {
    setBusy(true);
    setStatus("Creating indicative quote…");
    try {
      const res = await fetch("/api/ads/v1/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          advertiserId,
          opportunityId: opportunity.opportunityId,
          channel: opportunity.channel,
          providerId: opportunity.providerId,
          mediaMinor: opportunity.priceEstimateMinor,
          buyingMode:
            opportunity.channel === "dooh" ? "guaranteed" : "owned_reservation",
          quoteKind: "indicative",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Quote failed");
        return;
      }
      setQuote(data);
      setStatus(`Quote ${data.id} created — expires ${data.expiresAt}`);
    } finally {
      setBusy(false);
    }
  }

  async function dispatchMockOrder() {
    if (!quote) return;
    setBusy(true);
    setStatus("Authorising spend (mock) and dispatching…");
    try {
      const res = await fetch("/api/ads/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          advertiserId,
          quoteId: quote.id,
          approvedAmountMinor: quote.price.amountMinor,
          creativeReviewApproved: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Order failed");
        return;
      }
      setOrder(data);
      setStatus(
        `Order ${data.id} status=${data.status}${data.freezeRetry ? " (retry frozen)" : ""}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function reconcileAndExport() {
    if (!order) return;
    setBusy(true);
    setStatus("Reconciling delivery evidence…");
    try {
      const res = await fetch(
        `/api/ads/v1/orders/${order.id}/reconciliation?advertiserId=${encodeURIComponent(advertiserId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Reconciliation failed");
        return;
      }
      const rows = (data.deliveryEvidence ?? []) as Array<{
        metric: string;
        value: number;
        evidenceKind: string;
        asOf: string;
      }>;
      const csv = [
        "metric,value,evidenceKind,asOf",
        ...rows.map(
          (r) => `${r.metric},${r.value},${r.evidenceKind},${r.asOf}`,
        ),
      ].join("\n");
      setDeliveryCsv(csv);
      setStatus("Reconciliation complete. CSV ready below.");
    } finally {
      setBusy(false);
    }
  }

  async function syncDiscovery() {
    if (!props.discoveryEnabled) {
      setStatus("Provider discovery flag is off.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ads/v1/discovery/sync", { method: "POST" });
      const data = await res.json();
      setStatus(
        res.ok
          ? `Catalogue synced (seed=${data.seedUpserted}, remoteOk=${data.remote?.ok})`
          : data.error ?? "Sync failed",
      );
    } finally {
      setBusy(false);
    }
  }

  const allocationSum = mapableCap + doohCap;
  const allocationValid = allocationSum <= budgetMinor;

  return (
    <div className="space-y-8">
      <section aria-labelledby={`${formId}-budget`} className="space-y-4">
        <h2 id={`${formId}-budget`} className="text-lg font-semibold">
          Budget (AUD cents)
        </h2>
        <p className="text-sm text-muted-foreground">
          Use labelled numeric fields — drag allocation is not required.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Advertiser
            <select
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              value={advertiserId}
              onChange={(e) => setAdvertiserId(e.target.value)}
            >
              {props.advertisers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Total budget (minor units)
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              value={budgetMinor}
              onChange={(e) => setBudgetMinor(Number(e.target.value))}
              aria-describedby={`${formId}-budget-hint`}
            />
          </label>
          <label className="block text-sm">
            MapAble channel cap
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              value={mapableCap}
              onChange={(e) => setMapableCap(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            DOOH sandbox channel cap
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              value={doohCap}
              onChange={(e) => setDoohCap(Number(e.target.value))}
              disabled={!props.doohSandboxEnabled}
            />
          </label>
        </div>
        <p
          id={`${formId}-budget-hint`}
          role="status"
          className={allocationValid ? "text-sm" : "text-sm text-destructive"}
        >
          Channel caps sum {allocationSum}{" "}
          {allocationValid ? "≤" : ">"} budget {budgetMinor}.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            onClick={() => void searchPlacements()}
            disabled={busy || !allocationValid || !props.placementApiEnabled}
          >
            Search placements
          </button>
          <button
            type="button"
            className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() => void syncDiscovery()}
            disabled={busy || !props.discoveryEnabled}
          >
            Sync provider catalogue
          </button>
        </div>
      </section>

      <section aria-labelledby={`${formId}-results`} className="space-y-3">
        <h2 id={`${formId}-results`} className="text-lg font-semibold">
          Eligible opportunities
        </h2>
        <p className="text-sm" role="status" aria-live="polite">
          {status}
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">
              Placement opportunities with availability and estimated price
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4">
                  Opportunity
                </th>
                <th scope="col" className="py-2 pr-4">
                  Channel
                </th>
                <th scope="col" className="py-2 pr-4">
                  Availability
                </th>
                <th scope="col" className="py-2 pr-4">
                  Estimate (cents)
                </th>
                <th scope="col" className="py-2 pr-4">
                  Buyable
                </th>
                <th scope="col" className="py-2">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((row) => (
                <tr key={row.opportunityId} className="border-b border-border">
                  <td className="py-2 pr-4">{row.externalInventoryId}</td>
                  <td className="py-2 pr-4">{row.channel}</td>
                  <td className="py-2 pr-4">
                    <span className="sr-only">Availability </span>
                    {row.availabilityState}
                  </td>
                  <td className="py-2 pr-4">{row.priceEstimateMinor}</td>
                  <td className="py-2 pr-4">{row.buyable ? "Yes" : "No"}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="underline disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void createQuote(row)}
                    >
                      Quote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {exclusions.length > 0 ? (
          <details className="text-sm">
            <summary>Excluded inventory ({exclusions.length})</summary>
            <ul className="mt-2 list-disc pl-5">
              {exclusions.map((ex) => (
                <li key={ex.opportunityId}>
                  {ex.opportunityId}: {ex.reasonCodes.join(", ")}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {quote ? (
        <section aria-labelledby={`${formId}-quote`} className="space-y-3">
          <h2 id={`${formId}-quote`} className="text-lg font-semibold">
            Quote
          </h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Quote ID</dt>
              <dd>{quote.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total (cents)</dt>
              <dd>{quote.price.amountMinor}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fees / tax</dt>
              <dd>
                platform {quote.price.mapAbleFeesMinor}, partner{" "}
                {quote.price.partnerFeesMinor}, tax {quote.price.taxMinor}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Capability</dt>
              <dd>{quote.capabilityStatus}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Sponsored placements remain labelled Sponsored and do not affect
            accessibility scores.
          </p>
          <button
            type="button"
            className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            disabled={busy}
            onClick={() => void dispatchMockOrder()}
          >
            Authorise spend (mock) and dispatch
          </button>
        </section>
      ) : null}

      {order ? (
        <section aria-labelledby={`${formId}-order`} className="space-y-3">
          <h2 id={`${formId}-order`} className="text-lg font-semibold">
            Order
          </h2>
          <p className="text-sm">
            Status: {order.status}
            {order.freezeRetry ? " — retries frozen pending reconcile" : ""}
          </p>
          <button
            type="button"
            className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
            disabled={busy}
            onClick={() => void reconcileAndExport()}
          >
            Reconcile and export CSV
          </button>
          {deliveryCsv ? (
            <div>
              <h3 className="text-sm font-medium">Delivery evidence CSV</h3>
              <pre className="mt-2 overflow-x-auto rounded border border-border bg-muted/30 p-3 text-xs">
                {deliveryCsv}
              </pre>
              <a
                className="mt-2 inline-block text-sm underline"
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(deliveryCsv)}`}
                download={`ads-delivery-${order.id}.csv`}
              >
                Download CSV
              </a>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
