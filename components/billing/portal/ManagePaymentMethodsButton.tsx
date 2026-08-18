"use client";

import { useState } from "react";

import { openCustomerPortal } from "@/components/billing/portal/portal-client";
import { Button } from "@/components/ui/button";

export function ManagePaymentMethodsButton({
  label = "Manage payment methods",
  flow,
  subscriptionId,
}: {
  label?: string;
  flow?: "payment_method_update" | "subscription_cancel" | "subscription_update";
  subscriptionId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    const result = await openCustomerPortal({ flow, subscriptionId });
    if (result.portalUrl) {
      window.location.href = result.portalUrl;
      return;
    }
    setError(result.error ?? "Billing portal is not available for your account.");
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => void open()}
      >
        {label}
      </Button>
      {error ? (
        <p role="status" className="text-sm text-slate-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
