"use client";

import { useCallback, useEffect, useState } from "react";

type BillingAccountSummary = {
  connectOnboardingComplete: boolean;
  stripeConnectedAccountId: string | null;
};

export function ProviderBillingClient() {
  const [account, setAccount] = useState<BillingAccountSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/billing/invoices");
    const data = await res.json();
    void data;
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function finishOnboarding() {
    setBusy(true);
    const res = await fetch("/api/billing/connect/onboarding-link", {
      method: "POST",
    });
    const data = await res.json();
    if (data.onboardingUrl) {
      window.location.href = data.onboardingUrl;
    } else {
      setMessage(data.error ?? "Could not start onboarding");
    }
    setBusy(false);
  }

  async function startSubscription() {
    setBusy(true);
    const res = await fetch("/api/billing/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode: "provider_pro" }),
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setMessage(data.error ?? "Subscription checkout unavailable");
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      {message && (
        <p role="status" aria-live="polite" className="rounded-lg bg-muted/50 p-4 text-sm">
          {message}
        </p>
      )}

      <section aria-labelledby="connect-heading">
        <h2 id="connect-heading" className="text-lg font-semibold">
          Stripe Connect payouts
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {account?.connectOnboardingComplete
            ? "Onboarding complete — payouts enabled."
            : "Complete onboarding to receive destination charges from participant payments."}
        </p>
        <button
          type="button"
          onClick={() => void finishOnboarding()}
          disabled={busy}
          className="mt-4 min-h-11 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Finish Stripe onboarding
        </button>
      </section>

      <section aria-labelledby="subscription-heading">
        <h2 id="subscription-heading" className="text-lg font-semibold">
          Provider Pro subscription
        </h2>
        <button
          type="button"
          onClick={() => void startSubscription()}
          disabled={busy}
          className="mt-4 min-h-11 rounded-lg border border-border px-6 py-3 text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Subscribe to Provider Pro
        </button>
      </section>

      <section aria-labelledby="transactions-heading">
        <h2 id="transactions-heading" className="text-lg font-semibold">
          Transactions & transfers
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment splits and transfer history appear here after webhook-confirmed payments.
        </p>
      </section>
    </div>
  );
}
