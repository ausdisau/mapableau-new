"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BillingStatus = {
  stripe: {
    configured: boolean;
    checkoutAvailable: boolean;
    webhookConfigured: boolean;
    message?: string;
    providerProPriceConfigured?: boolean;
    employerProPriceConfigured?: boolean;
  };
  projectsNote?: string;
};

export function StripeCheckoutStatusBanner({
  showSubscriptionHint = false,
}: {
  showSubscriptionHint?: boolean;
}) {
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status) return null;

  const { stripe } = status;
  if (stripe.configured && stripe.webhookConfigured) {
    if (
      showSubscriptionHint &&
      !stripe.providerProPriceConfigured &&
      !stripe.employerProPriceConfigured
    ) {
      return (
        <section
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">Subscription prices not configured</p>
          <p className="mt-1">
            Set <code className="text-xs">STRIPE_PROVIDER_PRO_PRICE_ID</code> or{" "}
            <code className="text-xs">STRIPE_EMPLOYER_PRO_PRICE_ID</code> in your
            environment to enable Pro checkout.
          </p>
        </section>
      );
    }
    return null;
  }

  return (
    <section
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 space-y-2"
      role="status"
    >
      {!stripe.configured && (
        <>
          <p className="font-medium">Stripe Checkout is not configured</p>
          <p>{stripe.message ?? "Set STRIPE_SECRET_KEY to enable card payments."}</p>
          <p className="text-xs text-amber-900/80">{status.projectsNote}</p>
        </>
      )}
      {stripe.configured && !stripe.webhookConfigured && (
        <>
          <p className="font-medium">Webhook secret missing</p>
          <p>
            Payments may not update invoice status until{" "}
            <code className="text-xs">STRIPE_WEBHOOK_SECRET</code> is set. For local
            dev, run{" "}
            <code className="text-xs">
              stripe listen --forward-to localhost:3000/api/webhooks/stripe
            </code>
            .
          </p>
        </>
      )}
      <p>
        Setup checklist:{" "}
        <Link
          href="https://github.com/ausdisau/mapableau-new/blob/main/docs/stripe-checkout.md"
          className="underline font-medium"
          prefetch={false}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs/stripe-checkout.md
        </Link>
      </p>
    </section>
  );
}
