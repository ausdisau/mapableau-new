"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AttentionResponse = {
  projection?: {
    organisationId: string;
    generatedAt: string;
    items: Array<{
      id: string;
      kind: string;
      title: string;
      why: string;
      owner: string;
      ifUnresolved: string;
      participantFieldsExposed: string[];
      freshness: string;
    }>;
    isReadOnly: true;
  };
  error?: string;
};

export default function ProviderAttentionQueuePage() {
  const [data, setData] = useState<AttentionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/provider-ops/attention?fixture=taylor");
    const json = (await res.json()) as AttentionResponse;
    if (!res.ok) {
      setError(json.error ?? "Attention queue unavailable");
      setData(null);
    } else {
      setData(json);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm">
        <Link href="/provider" className="underline">
          Provider
        </Link>
        {" / "}
        Daily attention
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Daily Attention Queue</h1>
      <p className="mt-2 max-w-prose text-neutral-700">
        What needs human attention today, why, who owns it, and what may happen
        if it stays unresolved. Read-only projection — not a second source of
        truth.
      </p>

      {error && (
        <div className="mt-6 rounded border border-amber-700 bg-amber-50 p-4" role="alert">
          <p>{error}</p>
          <p className="mt-2 text-sm">
            Enable <code>MAPABLE_PROVIDER_OPS_ENABLED</code> and{" "}
            <code>MAPABLE_PROVIDER_ATTENTION_QUEUE_ENABLED</code>.
          </p>
        </div>
      )}

      {data?.projection && (
        <ul className="mt-8 space-y-4">
          {data.projection.items.map((item) => (
            <li key={item.id} className="border-b border-neutral-200 pb-4">
              <h2 className="text-lg font-medium">{item.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{item.kind}</p>
              <p className="mt-2">{item.why}</p>
              <p className="mt-2 text-sm">
                <strong>Owner:</strong> {item.owner}
              </p>
              <p className="mt-1 text-sm">
                <strong>If unresolved:</strong> {item.ifUnresolved}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Participant fields exposed:{" "}
                {item.participantFieldsExposed.length
                  ? item.participantFieldsExposed.join(", ")
                  : "none"}{" "}
                · Freshness: {item.freshness}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
