"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PAYMENT_DISCLAIMER } from "@/types/billing";

export function StripePaymentButton({
  invoiceId,
  amountCents,
  disabled,
}: {
  invoiceId: string;
  amountCents: number;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    setStatus("Opening secure payment…");
    const res = await fetch("/api/stripe/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, amountCents }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setStatus(data.error ?? "Could not start payment. Try again or contact support.");
      setBusy(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="default"
        size="lg"
        className="min-h-12 w-full sm:w-auto"
        disabled={disabled || busy || amountCents <= 0}
        onClick={() => void pay()}
        aria-describedby="payment-disclaimer"
      >
        Pay ${(amountCents / 100).toFixed(2)} securely
      </Button>
      <p id="payment-disclaimer" className="text-xs text-muted-foreground">
        {PAYMENT_DISCLAIMER}
      </p>
      <p className="text-sm" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
