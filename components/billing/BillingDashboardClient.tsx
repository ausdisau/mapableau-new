"use client";

import { useCallback, useEffect, useState } from "react";

import { BillingInvoiceCard } from "@/components/billing/BillingInvoiceCard";
import type { BillingFundingSource, BillingInvoice } from "@prisma/client";

type InvoiceRow = BillingInvoice & { fundingSource: BillingFundingSource | null };

export function BillingDashboardClient() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/billing/invoices");
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function payNow(invoiceId: string) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    if (data.checkout?.instruction) {
      setMessage(data.checkout.instruction);
    } else if (data.error) {
      setMessage(data.error);
    }
    setBusy(false);
  }

  async function planManagerExport(invoiceId: string) {
    setBusy(true);
    const res = await fetch("/api/billing/invoices/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, format: "plan_manager" }),
    });
    const data = await res.json();
    if (data.payload) {
      setMessage(
        `Ready for plan manager (${data.payload.planManager?.email ?? "add email in funding source"}).`
      );
    }
    setBusy(false);
    void load();
  }

  async function downloadCsv(invoiceId: string) {
    setBusy(true);
    const res = await fetch("/api/billing/invoices/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, format: "csv" }),
    });
    const data = await res.json();
    if (data.content) {
      const blob = new Blob([data.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setBusy(false);
    void load();
  }

  function viewStatus(invoice: InvoiceRow) {
    const latest = invoice.status;
    setMessage(`Payment status: ${latest.replace(/_/g, " ")}. Paid only when confirmed by Stripe webhook.`);
  }

  return (
    <div>
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-lg border border-border bg-muted/50 p-4 text-sm"
        >
          {message}
        </div>
      )}

      {loading ? (
        <p aria-busy="true">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <p>No invoices yet.</p>
      ) : (
        <ul className="space-y-6" aria-label="Your invoices">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <BillingInvoiceCard
                invoice={inv}
                busy={busy}
                onPay={() => void payNow(inv.id)}
                onPlanManager={() => void planManagerExport(inv.id)}
                onDownload={() => void downloadCsv(inv.id)}
                onStatus={() => viewStatus(inv)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
