"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

type QuoteFixture = {
  id: string;
  operatorName: string;
  accessFit: string;
  accessFitReasons: string[];
  totalCents: number;
  currency: string;
  isEstimate: boolean;
  sandbox: boolean;
  advisory: boolean;
  fareBreakdownCents: Record<string, number>;
  validUntil: string;
  source: string;
  generatedAt: string;
};

type Props = { tripId: string };

export function TransportQuoteOptions({ tripId }: Props) {
  const router = useRouter();
  const liveId = useId();
  const [quotes, setQuotes] = useState<QuoteFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnnouncement("Loading transport options…");
    try {
      const res = await fetch(`/api/transport/trips/${tripId}/quotes`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load quotes");
      setQuotes(data.quotes ?? []);
      setAnnouncement(
        data.sandbox
          ? "Sandbox transport options loaded. These are not live providers."
          : "Transport options loaded."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setAnnouncement("Failed to load transport options.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function acceptSandbox(quote: QuoteFixture) {
    setAccepting(quote.id);
    setError(null);
    try {
      const idempotencyKey = `sandbox-accept-${tripId}-${quote.id}-${crypto.randomUUID()}`;
      const res = await fetch(
        `/api/transport/trips/${tripId}/sandbox-quotes/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sandboxQuoteId: quote.id,
            idempotencyKey,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ??
            "Could not confirm this option. Request human help if no fit is available."
        );
      }
      setAnnouncement("Quote accepted. Opening trip details.");
      router.push(`/transport/trips/${tripId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accept failed");
      setAnnouncement("Quote acceptance failed.");
    } finally {
      setAccepting(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading options…
      </p>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby={`${liveId}-heading`}>
      <h2 id={`${liveId}-heading`} className="text-lg font-semibold">
        Transport options
      </h2>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <p className="text-sm text-muted-foreground">
        Access fit is shown first. Prices are estimates unless an operator
        confirms a quote. Sandbox options are labelled and are not live
        providers. Funding is not verified from plan type alone.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {quotes.length === 0 ? (
        <div className="space-y-2 rounded-lg border p-4">
          <p role="status">No fitting options are available automatically.</p>
          <p className="text-sm text-muted-foreground">
            You can request a manual review from your provider, or update your
            access profile and try again.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {quotes.map((q) => (
            <li key={q.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{q.operatorName}</h3>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {q.sandbox ? "Sandbox" : "Provider"} · {q.accessFit}
                  {q.advisory ? " · Advisory" : ""}
                </span>
              </div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {q.accessFitReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="text-sm">
                {q.isEstimate ? "Estimate" : "Quoted"}:{" "}
                {(q.totalCents / 100).toLocaleString("en-AU", {
                  style: "currency",
                  currency: q.currency,
                })}{" "}
                · Funding eligibility not verified
              </p>
              <p className="text-xs text-muted-foreground">
                Source: {q.source} · Generated {new Date(q.generatedAt).toLocaleString("en-AU")}
              </p>
              <button
                type="button"
                disabled={accepting === q.id || q.accessFit === "fail"}
                onClick={() => void acceptSandbox(q)}
                className="inline-flex min-h-12 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                {accepting === q.id ? "Confirming…" : "Accept this option"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
