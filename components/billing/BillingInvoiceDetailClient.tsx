"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";

import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type InvoiceDetail = {
  id: string;
  status: string;
  serviceType: string;
  totalCents: number;
  currency: string;
  dueAt: string | null;
  createdAt: string;
  fundingSource: { label: string; type: string } | null;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitAmountCents: number;
    totalAmountCents: number;
  }[];
  payments: { status: string; amountCents: number; createdAt: string }[];
};

function formatAud(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function BillingInvoiceDetailClient({ invoice }: { invoice: InvoiceDetail }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const planManaged = invoice.fundingSource?.type === "ndis_plan_managed";
  const canPay =
    !planManaged &&
    ["draft", "issued", "pending_payment", "failed"].includes(invoice.status);

  async function payNow() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    setError(data.checkout?.instruction ?? data.error ?? "Checkout unavailable.");
    setBusy(false);
  }

  async function exportInvoice(formatType: "plan_manager" | "csv") {
    setBusy(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/billing/invoices/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id, format: formatType }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(
        data.code === "INVOICE_NOT_APPROVED" || data.error?.includes("approved")
          ? "This invoice is waiting for administrator approval before it can be exported."
          : data.error ?? "Export failed",
      );
      setBusy(false);
      return;
    }
    if (formatType === "plan_manager" && data.payload) {
      setMessage("Export prepared for your plan manager.");
    }
    if (formatType === "csv" && data.content) {
      const blob = new Blob([data.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("CSV downloaded.");
    }
    setBusy(false);
  }

  async function submitDispute() {
    if (disputeReason.trim().length < 10) {
      setError("Please enter at least 10 characters explaining your dispute.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/billing/invoices/${invoice.id}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: disputeReason.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Dispute recorded. Our team will review.");
      setShowDisputeForm(false);
      setDisputeReason("");
    } else {
      setError(data.error ?? "Dispute failed");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/dashboard/billing/invoices"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to invoices
        </Link>
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <BillingStatusBadge status={invoice.status} />
          <h1 className="font-heading text-2xl font-bold capitalize">
            {invoice.serviceType} invoice
          </h1>
          <p className="text-2xl font-bold text-primary">
            {formatAud(invoice.totalCents, invoice.currency)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay ? (
            <Button type="button" variant="default" onClick={() => void payNow()} disabled={busy} size="lg">
              Pay now
            </Button>
          ) : null}
          {planManaged ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void exportInvoice("plan_manager")}
              disabled={busy}
              size="lg"
            >
              Send to plan manager
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportInvoice("csv")}
            disabled={busy}
            size="lg"
          >
            Download CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDisputeForm((v) => !v)}
            disabled={busy}
            size="lg"
          >
            Dispute invoice
          </Button>
        </div>
      </header>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {showDisputeForm ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Dispute this invoice</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <label htmlFor="participant-dispute-reason" className="block text-sm font-medium">
              Reason (minimum 10 characters)
            </label>
            <textarea
              id="participant-dispute-reason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Explain why you are disputing this invoice…"
            />
            <Button type="button" variant="destructive" size="lg" onClick={() => void submitDispute()} disabled={busy}>
              Submit dispute
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Summary</h2>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="font-medium text-muted-foreground">Funding</span>
            <p>{invoice.fundingSource?.label ?? "Not set"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Due</span>
            <p>
              {invoice.dueAt
                ? format(new Date(invoice.dueAt), "d MMM yyyy")
                : "—"}
            </p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Created</span>
            <p>{format(new Date(invoice.createdAt), "d MMM yyyy HH:mm")}</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="font-semibold">Line items</h2>
        <ul className="mt-3 space-y-2">
          {invoice.lineItems.map((line) => (
            <li key={line.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{line.description}</p>
              <p className="text-muted-foreground">
                {line.quantity} × {formatAud(line.unitAmountCents, invoice.currency)} ={" "}
                {formatAud(line.totalAmountCents, invoice.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {invoice.payments.length > 0 ? (
        <section>
          <h2 className="font-semibold">Payment attempts</h2>
          <ul className="mt-3 space-y-2">
            {invoice.payments.map((p, i) => (
              <li key={i} className="rounded-lg border border-border p-3 text-sm">
                {p.status.replace(/_/g, " ")} — {formatAud(p.amountCents, invoice.currency)}{" "}
                <span className="text-muted-foreground">
                  ({format(new Date(p.createdAt), "d MMM yyyy HH:mm")})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
