"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAudCents, formatInvoiceStatus } from "@/lib/billing/format";

type ProviderDashboardData = {
  billingAccount: {
    connectOnboardingComplete: boolean;
    stripeConnectedAccountId: string | null;
  } | null;
  subscriptions: {
    planCode: string;
    status: string;
    currentPeriodEnd: string | null;
  }[];
  payments: {
    id: string;
    status: string;
    amountCents: number;
    invoice: { serviceType: string; totalCents: number };
    splits: { recipientType: string; amountCents: number; status: string }[];
  }[];
};

export function ProviderBillingDashboard() {
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/billing/provider/dashboard");
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function finishOnboarding() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/billing/connect/onboarding-link", {
        method: "POST",
      });
      const json = await res.json();
      if (json.onboardingUrl) {
        window.location.href = json.onboardingUrl;
      } else if (!data?.billingAccount?.stripeConnectedAccountId) {
        const createRes = await fetch("/api/billing/connect/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "provider" }),
        });
        const created = await createRes.json();
        if (created.onboardingUrl) window.location.href = created.onboardingUrl;
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function startSubscription(planCode: "provider_pro" | "employer_pro") {
    setActionLoading(true);
    try {
      const res = await fetch("/api/billing/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setActionLoading(false);
    }
  }

  const onboardingComplete = data?.billingAccount?.connectOnboardingComplete;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8" id="main-content">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Provider billing</h1>
        <p className="mt-2 text-muted-foreground">
          Stripe Connect payouts, transfers, and subscriptions.
        </p>
      </header>

      {loading && <p role="status">Loading…</p>}

      <section aria-labelledby="connect-heading" className="mb-8">
        <h2 id="connect-heading" className="text-xl font-semibold mb-4">
          Payout account
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>
              {onboardingComplete
                ? "Stripe onboarding complete"
                : "Finish Stripe onboarding"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Status:{" "}
              <span aria-live="polite">
                {onboardingComplete ? "Ready for payouts" : "Action required"}
              </span>
            </p>
            {!onboardingComplete && (
              <Button
                size="lg"
                variant="default"
                loading={actionLoading}
                onClick={finishOnboarding}
                aria-label="Finish Stripe Connect onboarding"
              >
                Finish Stripe onboarding
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="subscription-heading" className="mb-8">
        <h2 id="subscription-heading" className="text-xl font-semibold mb-4">
          Subscription
        </h2>
        {data?.subscriptions.length ? (
          <ul className="space-y-2">
            {data.subscriptions.map((s, i) => (
              <li key={i} className="text-sm">
                {s.planCode}: {formatInvoiceStatus(s.status)}
              </li>
            ))}
          </ul>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            loading={actionLoading}
            onClick={() => startSubscription("provider_pro")}
          >
            Subscribe to Provider Pro
          </Button>
        )}
      </section>

      <section aria-labelledby="transactions-heading">
        <h2 id="transactions-heading" className="text-xl font-semibold mb-4">
          Recent transactions
        </h2>
        {data?.payments.length ? (
          <ul className="divide-y rounded-lg border">
            {data.payments.map((p) => (
              <li key={p.id} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {p.invoice.serviceType} · {formatInvoiceStatus(p.status)}
                </span>
                <span>{formatAudCents(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No transactions yet.</p>
        )}
      </section>

      <p className="mt-8">
        <Link href="/billing" className="underline focus-visible:ring-2">
          Participant billing
        </Link>
      </p>
    </main>
  );
}
