"use client";

import { useEffect, useState } from "react";

export function InvoicePlaceholderCard({ tripId }: { tripId: string }) {
  const [placeholder, setPlaceholder] = useState<{
    disclaimer: string;
    lineItems: { description: string; note?: string }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/transport-mvp/trips/${tripId}/invoice-placeholder`)
      .then((r) => r.json())
      .then((d) => setPlaceholder(d.placeholder ?? null))
      .catch(() => setPlaceholder(null));
  }, [tripId]);

  if (!placeholder) return null;

  return (
    <section className="rounded-xl border border-dashed p-4" aria-labelledby="invoice-placeholder">
      <h2 id="invoice-placeholder" className="font-heading text-lg font-semibold">
        Invoice (placeholder)
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{placeholder.disclaimer}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {placeholder.lineItems.map((item) => (
          <li key={item.description} className="rounded-lg bg-muted/50 p-2">
            {item.description}
            {item.note ? <span className="block text-muted-foreground">{item.note}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
