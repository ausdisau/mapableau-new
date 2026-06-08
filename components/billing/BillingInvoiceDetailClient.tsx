"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useState } from "react";

import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { AccessibleConfirmDialog } from "@/components/ui/AccessibleConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { fetchJson } from "@/lib/client/fetch-json";

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

type StatusPayload = {
  variant: "info" | "success" | "error";
  message: string;
};

function formatAud(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function BillingInvoiceDetailClient({ invoice }: { invoice: InvoiceDetail }) {
  const [payBusy, setPayBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusPayload | null>(null);

  const planManaged = invoice.fundingSource?.type === "ndis_plan_managed";
  const canPay =
    !planManaged &&
    ["draft", "issued", "pending_payment", "failed"].includes(invoice.status);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setMessage({
        variant: "success",
        message:
          "Payment submitted. Your invoice will show as paid once Stripe confirms the payment.",
      });
    } else if (checkout === "cancelled") {
      setMessage({
        variant: "info",
        message: "Checkout was cancelled. You can try again when ready.",
      });
    }
    if (checkout) {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  async function payNow() {
    setPayBusy(true);
    setMessage(null);
    const result = await fetchJson<{
      checkoutUrl?: string;
      checkout?: { instruction?: string };
    }>("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });
    if (result.ok && result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
      return;
    }
    setMessage({
      variant: result.ok ? "info" : "error",
      message:
        result.ok
          ? (result.data.checkout?.instruction ?? "Checkout unavailable.")
          : result.error,
    });
    setPayBusy(false);
  }

  async function planManagerExport() {
    setExportBusy(true);
    const result = await fetchJson<{ payload?: unknown }>(
      "/api/billing/invoices/export",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, format: "plan_manager" }),
      },
    );
    setMessage({
      variant: result.ok && result.data.payload ? "success" : "error",
      message:
        result.ok && result.data.payload
          ? "Export prepared for your plan manager."
          : result.ok
            ? "Export could not be prepared."
            : result.error,
    });
    setExportBusy(false);
  }

  async function submitDispute(reason: string) {
    setDisputeBusy(true);
    setDisputeError(null);
    const result = await fetchJson(
      `/api/billing/invoices/${invoice.id}/dispute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      },
    );
    setDisputeBusy(false);
    if (!result.ok) {
      setDisputeError(result.error);
      return;
    }
    setDisputeOpen(false);
    setMessage({
      variant: "success",
      message: "Dispute recorded. Our team will review.",
    });
  }

  async function downloadCsv() {
    setExportBusy(true);
    const result = await fetchJson<{ content?: string }>(
      "/api/billing/invoices/export",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, format: "csv" }),
      },
    );
    if (result.ok && result.data.content) {
      const blob = new Blob([result.data.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ variant: "success", message: "CSV downloaded." });
    } else {
      setMessage({
        variant: "error",
        message: result.ok ? "CSV export is unavailable." : result.error,
      });
    }
    setExportBusy(false);
  }

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/dashboard/billing/invoices"
          className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Invoice actions">
          {canPay ? (
            <Button
              type="button"
              variant="default"
              onClick={() => void payNow()}
              loading={payBusy}
              disabled={exportBusy}
              size="lg"
            >
              Pay now
            </Button>
          ) : null}
          {planManaged ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void planManagerExport()}
              loading={exportBusy}
              disabled={payBusy}
              size="lg"
            >
              Send to plan manager
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => void downloadCsv()}
            loading={exportBusy}
            disabled={payBusy}
            size="lg"
          >
            Download CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDisputeError(null);
              setDisputeOpen(true);
            }}
            disabled={payBusy || exportBusy || disputeBusy}
            size="lg"
          >
            Dispute invoice
          </Button>
        </div>
      </header>

      {message ? (
        <StatusMessage
          variant={message.variant}
          message={message.message}
          onDismiss={() => setMessage(null)}
        />
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

      <section aria-labelledby="line-items-heading">
        <h2 id="line-items-heading" className="font-semibold">
          Line items
        </h2>
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
        <section aria-labelledby="payments-heading">
          <h2 id="payments-heading" className="font-semibold">
            Payment attempts
          </h2>
          <ul className="mt-3 space-y-2">
            {invoice.payments.map((p) => (
              <li key={`${p.createdAt}-${p.status}`} className="rounded-lg border border-border p-3 text-sm">
                {p.status.replace(/_/g, " ")} — {formatAud(p.amountCents, invoice.currency)}{" "}
                <span className="text-muted-foreground">
                  ({format(new Date(p.createdAt), "d MMM yyyy HH:mm")})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AccessibleConfirmDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        title="Dispute this invoice"
        description="Tell us why you are disputing this invoice. Our team will review your request."
        confirmLabel="Submit dispute"
        loading={disputeBusy}
        error={disputeError}
        inputLabel="Reason for dispute"
        inputRequired
        inputMinLength={10}
        inputHint="Please provide at least 10 characters so we can investigate."
        onConfirm={submitDispute}
      />
    </div>
  );
}
