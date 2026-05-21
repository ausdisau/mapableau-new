"use client";

import { Download, CreditCard, Send, Eye } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAudCents, formatInvoiceDate, formatInvoiceStatus } from "@/lib/billing/format";

export type BillingInvoiceSummary = {
  id: string;
  serviceType: string;
  status: string;
  totalCents: number;
  dueAt: string | null;
  fundingSource?: { type: string; label: string } | null;
  payments?: { status: string }[];
};

type Props = {
  invoice: BillingInvoiceSummary;
  onRefresh?: () => void;
};

export function BillingInvoiceCard({ invoice, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isPlanManaged =
    invoice.fundingSource?.type === "ndis_plan_managed";
  const canPay =
    !isPlanManaged &&
    ["draft", "issued", "pending_payment", "failed"].includes(invoice.status);

  async function handlePay() {
    setLoading("pay");
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();
      if (data.checkoutBlocked) {
        setMessage(data.message);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMessage(data.error ?? "Unable to start checkout");
    } finally {
      setLoading(null);
    }
  }

  async function handlePlanManagerExport() {
    setLoading("plan");
    setMessage(null);
    try {
      const res = await fetch("/api/billing/invoices/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, format: "plan_manager" }),
      });
      const data = await res.json();
      if (data.suggestedRecipient) {
        setMessage(
          `Plan manager export ready. Send to ${data.suggestedRecipient}.`
        );
      } else {
        setMessage("Plan manager export ready. Download JSON from console or email manually.");
        console.info("Plan manager payload", data.payload);
      }
      onRefresh?.();
    } finally {
      setLoading(null);
    }
  }

  async function handleDownload() {
    setLoading("download");
    try {
      const res = await fetch("/api/billing/invoices/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, format: "csv" }),
      });
      const data = await res.json();
      if (data.content) {
        const blob = new Blob([data.content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename ?? `invoice-${invoice.id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      onRefresh?.();
    } finally {
      setLoading(null);
    }
  }

  const paymentStatus = invoice.payments?.[0]?.status;

  return (
    <Card className="w-full" aria-labelledby={`invoice-title-${invoice.id}`}>
      <CardHeader>
        <CardTitle id={`invoice-title-${invoice.id}`} className="text-lg">
          {invoice.serviceType} invoice
        </CardTitle>
        <CardDescription>
          <span className="sr-only">Status: </span>
          {formatInvoiceStatus(invoice.status)}
          {invoice.fundingSource && (
            <>
              {" "}
              · <span className="sr-only">Funding: </span>
              {invoice.fundingSource.label}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold" aria-label={`Total ${formatAudCents(invoice.totalCents)}`}>
          {formatAudCents(invoice.totalCents)}
        </p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt>Due date</dt>
          <dd>{formatInvoiceDate(invoice.dueAt)}</dd>
          {paymentStatus && (
            <>
              <dt>Payment</dt>
              <dd>{formatInvoiceStatus(paymentStatus)}</dd>
            </>
          )}
        </dl>
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        {canPay && (
          <Button
            size="lg"
            variant="default"
            loading={loading === "pay"}
            onClick={handlePay}
            aria-label={`Pay now for ${invoice.serviceType} invoice, ${formatAudCents(invoice.totalCents)}`}
          >
            <CreditCard aria-hidden />
            Pay now
          </Button>
        )}
        {isPlanManaged && (
          <Button
            size="lg"
            variant="secondary"
            loading={loading === "plan"}
            onClick={handlePlanManagerExport}
            aria-label="Send invoice to plan manager"
          >
            <Send aria-hidden />
            Send to plan manager
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          loading={loading === "download"}
          onClick={handleDownload}
          aria-label="Download invoice as CSV"
        >
          <Download aria-hidden />
          Download invoice
        </Button>
        <Button
          size="lg"
          variant="outline"
          aria-label={`View payment status for invoice ${invoice.id}`}
          onClick={() =>
            setMessage(
              paymentStatus
                ? `Latest payment status: ${paymentStatus}`
                : "No payment recorded yet."
            )
          }
        >
          <Eye aria-hidden />
          View payment status
        </Button>
      </CardFooter>
    </Card>
  );
}
