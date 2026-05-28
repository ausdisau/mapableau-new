"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ModuleCheckoutButton({
  endpoint,
  label = "Pay with Stripe",
}: {
  endpoint: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startCheckout() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setMessage(
        data.checkout?.instruction ??
          data.error ??
          "Checkout unavailable. Add a billing funding source and try again."
      );
    } catch {
      setMessage("Checkout failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="default" size="default" onClick={startCheckout} disabled={busy}>
        {label}
      </Button>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
