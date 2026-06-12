"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fundingModelLabel } from "@/lib/abilitypay/funding-model";
import type { AbilityPayFundingModel } from "@prisma/client";

import { formatCents } from "./utils";
import { ManagePaymentMethodsButton } from "./ManagePaymentMethodsButton";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  ready_to_pay: "Ready to pay",
  processing: "Processing",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  paid_mock: "Paid (legacy)",
  on_hold: "On hold",
};

type PaymentAttempt = {
  id: string;
  adapter: string;
  status: string;
  externalRef: string | null;
};

export function InvoicePaymentActions({
  invoiceId,
  invoiceStatus,
  paymentStatus,
  fundingModel,
  totalCents,
  canPay,
  canConfirmPayment,
  paymentAttempts,
}: {
  invoiceId: string;
  invoiceStatus: string;
  paymentStatus: string;
  fundingModel: AbilityPayFundingModel | null;
  totalCents: number;
  canPay: boolean;
  canConfirmPayment: boolean;
  paymentAttempts: PaymentAttempt[];
}) {
  const [loading, setLoading] = useState<"pay" | "export" | "confirm" | null>(
    null
  );
  const [portalError, setPortalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const model = fundingModel ?? "plan_managed";
  const modelLabel = fundingModelLabel(model);
  const showPayActions =
    invoiceStatus === "approved" || invoiceStatus === "exported";

  if (!showPayActions) return null;

  async function startCheckout() {
    setLoading("pay");
    setError(null);
    try {
      const res = await fetch(`/api/abilitypay/invoices/${invoiceId}/pay`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not start payment");
        return;
      }
      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Could not start payment. Try again.");
    } finally {
      setLoading(null);
    }
  }

  async function exportClaimPack() {
    setLoading("export");
    setError(null);
    try {
      const res = await fetch("/api/abilitypay/exports/claim-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds: [invoiceId] }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `abilitypay-claim-pack-${invoiceId.slice(0, 8)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Try again.");
    } finally {
      setLoading(null);
    }
  }

  async function confirmPlanManagerPayment() {
    setLoading("confirm");
    setError(null);
    try {
      const res = await fetch(
        `/api/abilitypay/invoices/${invoiceId}/confirm-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not confirm payment");
        return;
      }
      window.location.reload();
    } catch {
      setError("Could not confirm payment. Try again.");
    } finally {
      setLoading(null);
    }
  }

  const nextStep =
    model === "plan_managed"
      ? "export"
      : model === "agency_managed"
        ? "ndia_handoff"
        : "pay";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment</CardTitle>
        <CardDescription>
          {modelLabel} · {formatCents(totalCents)} ·{" "}
          {PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentAttempts.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {paymentAttempts.map((attempt) => (
              <li key={attempt.id}>
                {attempt.adapter} · {attempt.status}
                {attempt.externalRef
                  ? ` · ref ${attempt.externalRef.slice(0, 8)}…`
                  : ""}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {portalError ? (
          <p className="text-sm text-destructive">{portalError}</p>
        ) : null}

        {nextStep === "pay" && canPay ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => void startCheckout()}
              disabled={
                loading !== null ||
                paymentStatus === "paid" ||
                paymentStatus === "processing"
              }
            >
              {loading === "pay" ? "Starting checkout…" : "Pay with card"}
            </Button>
            <ManagePaymentMethodsButton
              returnPath={`/abilitypay/invoices/${invoiceId}`}
              variant="outline"
              size="default"
              onError={setPortalError}
            />
          </div>
        ) : null}

        {nextStep === "export" && canPay ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void exportClaimPack()}
            disabled={loading !== null || paymentStatus === "paid"}
          >
            {loading === "export" ? "Preparing export…" : "Download claim pack"}
          </Button>
        ) : null}

        {nextStep === "export" && canConfirmPayment ? (
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => void confirmPlanManagerPayment()}
            disabled={loading !== null || paymentStatus === "paid"}
          >
            {loading === "confirm"
              ? "Confirming…"
              : "Mark as paid (plan manager)"}
          </Button>
        ) : null}

        {nextStep === "ndia_handoff" ? (
          <p className="text-sm text-muted-foreground">
            This invoice is agency-managed. An NDIA claim draft is created for
            your provider after approval.
          </p>
        ) : null}

        {checkoutUrl ? (
          <p className="text-sm">
            <a href={checkoutUrl} className="underline">
              Open checkout again
            </a>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
