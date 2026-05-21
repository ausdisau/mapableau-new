"use client";

import { useCallback, useEffect, useState } from "react";

import { formatAudCents, formatInvoiceDate, formatInvoiceStatus } from "@/lib/billing/format";

type AdminInvoice = {
  id: string;
  userId: string;
  providerId: string | null;
  status: string;
  totalCents: number;
  createdAt: string;
  user: { name: string; email: string };
  fundingSource: { type: string; label: string } | null;
  payments: { status: string }[];
};

export function AdminBillingConsole() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [flags, setFlags] = useState({
    failedPayments: 0,
    disputes: 0,
    exportErrors: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (query) params.set("q", query);
    const res = await fetch(`/api/billing/admin/invoices?${params}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices ?? []);
      if (data.flags) setFlags(data.flags);
    }
    setLoading(false);
  }, [statusFilter, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8" id="main-content">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin billing</h1>
        <p className="mt-2 text-muted-foreground">
          Search invoices, review failed payments, disputes, and export errors.
        </p>
      </header>

      <section
        aria-label="Billing alerts"
        className="mb-6 grid gap-4 sm:grid-cols-3"
      >
        <div className="rounded-lg border p-4" role="status">
          <p className="text-sm text-muted-foreground">Failed payments</p>
          <p className="text-2xl font-bold">{flags.failedPayments}</p>
        </div>
        <div className="rounded-lg border p-4" role="status">
          <p className="text-sm text-muted-foreground">Disputes</p>
          <p className="text-2xl font-bold">{flags.disputes}</p>
        </div>
        <div className="rounded-lg border p-4" role="status">
          <p className="text-sm text-muted-foreground">Export errors</p>
          <p className="text-2xl font-bold">{flags.exportErrors}</p>
        </div>
      </section>

      <form
        className="mb-6 flex flex-wrap gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        role="search"
        aria-label="Search invoices"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span>Status</span>
          <select
            className="min-h-11 rounded-md border px-3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by invoice status"
          >
            <option value="">All</option>
            <option value="failed">Failed</option>
            <option value="paid">Paid</option>
            <option value="pending_payment">Pending payment</option>
            <option value="disputed">Disputed</option>
            <option value="exported">Exported</option>
          </select>
        </label>
        <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-sm">
          <span>Search ID or booking</span>
          <input
            type="search"
            className="min-h-11 rounded-md border px-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search by invoice or booking ID"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 self-end rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p role="status">Loading invoices…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Invoices">
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4">
                  Invoice
                </th>
                <th scope="col" className="py-2 pr-4">
                  User
                </th>
                <th scope="col" className="py-2 pr-4">
                  Status
                </th>
                <th scope="col" className="py-2 pr-4">
                  Amount
                </th>
                <th scope="col" className="py-2">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td className="py-3 pr-4 font-mono text-xs">{inv.id.slice(0, 8)}…</td>
                  <td className="py-3 pr-4">
                    {inv.user.name}
                    <span className="block text-muted-foreground">
                      {inv.user.email}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {formatInvoiceStatus(inv.status)}
                    {inv.payments[0]?.status === "disputed" && (
                      <span className="ml-2 text-destructive" role="alert">
                        Disputed
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{formatAudCents(inv.totalCents)}</td>
                  <td className="py-3">{formatInvoiceDate(inv.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
