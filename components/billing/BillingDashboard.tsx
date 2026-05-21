"use client";

import { useCallback, useEffect, useState } from "react";

import { BillingInvoiceCard, type BillingInvoiceSummary } from "@/components/billing/BillingInvoiceCard";

export function BillingDashboard() {
  const [invoices, setInvoices] = useState<BillingInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/invoices/list");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to load invoices");
        return;
      }
      const data = await res.json();
      setInvoices(data.invoices ?? []);
    } catch {
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8" id="main-content">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 text-muted-foreground">
          View invoices, funding sources, and payment options. All amounts in AUD.
        </p>
      </header>

      {loading && (
        <p role="status" aria-live="polite">
          Loading your invoices…
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && invoices.length === 0 && (
        <p>No invoices yet. Invoices appear here when you book care, transport, or marketplace services.</p>
      )}

      <ul className="space-y-6" aria-label="Your invoices">
        {invoices.map((inv) => (
          <li key={inv.id}>
            <BillingInvoiceCard invoice={inv} onRefresh={load} />
          </li>
        ))}
      </ul>

      <nav className="mt-10" aria-label="Billing actions">
        <button
          type="button"
          className="min-h-11 rounded-lg border px-5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={async () => {
            const res = await fetch("/api/billing/customer-portal", { method: "POST" });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
        >
          Manage payment methods (Stripe portal)
        </button>
      </nav>
    </main>
  );
}
