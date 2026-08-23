"use client";

import { useState } from "react";

import {
  downloadCsvContent,
  exportBillingInvoice,
  startInvoiceCheckout,
} from "@/components/billing/portal/portal-client";
import { Button } from "@/components/ui/button";

export function PayNowButton({
  invoiceId,
  planManaged,
}: {
  invoiceId: string;
  planManaged: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setMessage(null);
    const result = await startInvoiceCheckout(invoiceId);
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    setMessage(result.instruction ?? result.error ?? "Checkout unavailable.");
    setBusy(false);
  }

  async function planManager() {
    setBusy(true);
    setMessage(null);
    const result = await exportBillingInvoice(invoiceId, "plan_manager");
    setMessage(
      result.payload
        ? "Ready for your plan manager."
        : result.error ?? "Export failed."
    );
    setBusy(false);
  }

  async function csv() {
    setBusy(true);
    setMessage(null);
    const result = await exportBillingInvoice(invoiceId, "csv");
    if (result.content) {
      downloadCsvContent(result.content, `invoice-${invoiceId}.csv`);
    } else {
      setMessage(result.error ?? "Download failed.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {planManaged ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void planManager()}
          >
            Send to plan manager
          </Button>
        ) : (
          <Button
            type="button"
            disabled={busy}
            onClick={() => void pay()}
          >
            Pay now
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void csv()}
        >
          Download CSV
        </Button>
      </div>
      {message ? (
        <p role="status" className="text-sm text-slate-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
