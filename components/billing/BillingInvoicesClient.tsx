"use client";

import Link from "next/link";
import type { BillingFundingSource, BillingInvoice } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { BillingInvoiceCard } from "@/components/billing/BillingInvoiceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { fetchJson } from "@/lib/client/fetch-json";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type InvoiceRow = BillingInvoice & { fundingSource: BillingFundingSource | null };

type StatusPayload = {
  variant: "info" | "success" | "error";
  message: string;
};

export function BillingInvoicesClient() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [message, setMessage] = useState<StatusPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await fetchJson<{ invoices?: InvoiceRow[] }>(
      "/api/billing/invoices",
    );
    setLoading(false);
    if (!result.ok) {
      setLoadError(result.error);
      setInvoices([]);
      return;
    }
    setInvoices(result.data.invoices ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function payNow(invoiceId: string) {
    setBusyInvoiceId(invoiceId);
    setMessage(null);
    const result = await fetchJson<{
      checkoutUrl?: string;
      checkout?: { instruction?: string };
    }>("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    if (result.ok && result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
      return;
    }
    if (result.ok && result.data.checkout?.instruction) {
      setMessage({ variant: "info", message: result.data.checkout.instruction });
    } else {
      setMessage({
        variant: "error",
        message: result.ok ? "Checkout unavailable." : result.error,
      });
    }
    setBusyInvoiceId(null);
  }

  async function planManagerExport(invoiceId: string) {
    setBusyInvoiceId(invoiceId);
    const result = await fetchJson<{
      payload?: { planManager?: { email?: string } };
    }>("/api/billing/invoices/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, format: "plan_manager" }),
    });
    if (result.ok && result.data.payload) {
      setMessage({
        variant: "success",
        message: `Ready for plan manager (${result.data.payload.planManager?.email ?? "add email in funding source"}).`,
      });
    } else {
      setMessage({
        variant: "error",
        message: result.ok ? "Export could not be prepared." : result.error,
      });
    }
    setBusyInvoiceId(null);
    void load();
  }

  async function downloadCsv(invoiceId: string) {
    setBusyInvoiceId(invoiceId);
    const result = await fetchJson<{ content?: string }>(
      "/api/billing/invoices/export",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, format: "csv" }),
      },
    );
    if (result.ok && result.data.content) {
      const blob = new Blob([result.data.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ variant: "success", message: "CSV downloaded." });
    } else {
      setMessage({
        variant: "error",
        message: result.ok ? "CSV export is unavailable." : result.error,
      });
    }
    setBusyInvoiceId(null);
    void load();
  }

  function viewStatus(invoice: InvoiceRow) {
    setMessage({
      variant: "info",
      message: `Payment status: ${invoice.status.replace(/_/g, " ")}. Paid only when confirmed by Stripe webhook.`,
    });
  }

  async function openCustomerPortal() {
    setPortalBusy(true);
    setMessage(null);
    const result = await fetchJson<{ portalUrl?: string }>(
      "/api/billing/customer-portal",
      { method: "POST" },
    );
    if (result.ok && result.data.portalUrl) {
      window.location.href = result.data.portalUrl;
      return;
    }
    setMessage({
      variant: "error",
      message: result.ok
        ? "Billing portal is not available for your account."
        : result.error,
    });
    setPortalBusy(false);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Invoices & payments</h1>
          <p className="text-sm text-muted-foreground">
            Stripe Checkout for self-managed and private pay. Plan-managed exports
            for your plan manager.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="default"
          loading={portalBusy}
          onClick={() => void openCustomerPortal()}
        >
          Manage payment methods
        </Button>
      </header>

      <div
        className={cn(mapableSectionCardClass, "p-5 sm:p-6")}
        role="note"
        aria-label="NDIS billing guidance"
      >
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Plan-managed NDIS</span>{" "}
          invoices are exported to your plan manager — not charged on card.{" "}
          <span className="font-semibold text-secondary">Self-managed</span> and
          private pay use secure Stripe Checkout.
        </p>
      </div>

      {loadError ? (
        <StatusMessage variant="error" message={loadError} />
      ) : null}

      {message ? (
        <StatusMessage
          variant={message.variant}
          message={message.message}
          onDismiss={() => setMessage(null)}
        />
      ) : null}

      {loading ? (
        <p aria-busy="true" className="text-muted-foreground">
          Loading invoices…
        </p>
      ) : invoices.length === 0 ? (
        <Card variant="gradient">
          <CardContent className="p-8 text-center text-muted-foreground" role="status">
            No invoices yet. Book a service or ask your provider to issue an
            invoice.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-6" aria-label="Your invoices">
          {invoices.map((inv) => (
            <li key={inv.id} className="space-y-2">
              <BillingInvoiceCard
                invoice={inv}
                busy={busyInvoiceId === inv.id}
                onPay={() => void payNow(inv.id)}
                onPlanManager={() => void planManagerExport(inv.id)}
                onDownload={() => void downloadCsv(inv.id)}
                onStatus={() => viewStatus(inv)}
              />
              <Link
                href={`/dashboard/billing/invoices/${inv.id}`}
                className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                View full invoice details →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
