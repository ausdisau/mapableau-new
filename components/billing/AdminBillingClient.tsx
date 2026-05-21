"use client";

import { useCallback, useState } from "react";

type AdminInvoice = {
  id: string;
  userId: string;
  providerId: string | null;
  status: string;
  totalCents: number;
  serviceType: string;
  createdAt: string;
  payments: { status: string }[];
};

export function AdminBillingClient() {
  const [status, setStatus] = useState("");
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [flagged, setFlagged] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/billing/invoices?${params}`);
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setFlagged(data.flagged ?? []);
    setLoading(false);
  }, [status]);

  return (
    <div>
      <form
        className="flex flex-wrap items-end gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 min-h-11 rounded-md border border-input bg-background px-3"
          >
            <option value="">All</option>
            <option value="failed">Failed</option>
            <option value="pending_payment">Pending payment</option>
            <option value="paid">Paid</option>
            <option value="exported">Exported</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground"
        >
          Search invoices
        </button>
      </form>

      {flagged.length > 0 && (
        <section className="mt-8" aria-labelledby="flagged-heading">
          <h2 id="flagged-heading" className="text-lg font-semibold text-destructive">
            Flagged ({flagged.length})
          </h2>
          <ul className="mt-4 space-y-2">
            {flagged.map((inv) => (
              <li key={inv.id} className="rounded border border-destructive/30 p-3 text-sm">
                {inv.id} — {inv.status} — {inv.totalCents / 100} AUD
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="results-heading">
        <h2 id="results-heading" className="text-lg font-semibold">
          Results {loading && "(loading…)"}
        </h2>
        <table className="mt-4 w-full text-left text-sm">
          <caption className="sr-only">Billing invoices</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2">
                Invoice
              </th>
              <th scope="col" className="p-2">
                User
              </th>
              <th scope="col" className="p-2">
                Status
              </th>
              <th scope="col" className="p-2">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-2 font-mono text-xs">{inv.id.slice(0, 10)}…</td>
                <td className="p-2">{inv.userId.slice(0, 8)}…</td>
                <td className="p-2">{inv.status}</td>
                <td className="p-2">${(inv.totalCents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
