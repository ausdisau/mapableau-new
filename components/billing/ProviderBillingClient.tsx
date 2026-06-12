"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type BillingStatus = {
  connectOnboardingComplete: boolean;
  stripeConnectedAccountId: string | null;
  subscriptions: Array<{
    id: string;
    planCode: string;
    status: string;
    currentPeriodEnd: string | null;
  }>;
  payments: Array<{
    id: string;
    status: string;
    amountCents: number;
    paidAt: string | null;
    invoice: {
      id: string;
      serviceType: string;
      totalCents: number;
      status: string;
    };
  }>;
};

export function ProviderBillingClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    const sub = searchParams.get("subscription");
    if (sub === "success") {
      setMessage("Subscription activated. Thank you for subscribing to Provider Pro.");
    } else if (sub === "cancelled") {
      setMessage("Subscription checkout was cancelled.");
    }
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/billing/status?role=provider");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    })();
  }, []);

  async function finishOnboarding() {
    setBusy(true);
    const res = await fetch("/api/billing/connect/onboarding-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "provider" }),
    });
    const data = await res.json();
    if (data.onboardingUrl) {
      window.location.href = data.onboardingUrl;
    } else {
      setMessage(data.error ?? "Could not start onboarding");
    }
    setBusy(false);
  }

  async function startSubscription(planCode: "provider_pro" | "marketplace_featured") {
    setBusy(true);
    const res = await fetch("/api/billing/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode }),
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setMessage(data.error ?? "Subscription checkout unavailable");
    setBusy(false);
  }

  async function openPortal() {
    setBusy(true);
    const res = await fetch("/api/billing/customer-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "provider" }),
    });
    const data = await res.json();
    if (data.portalUrl) window.location.href = data.portalUrl;
    else setMessage(data.error ?? "Customer portal unavailable");
    setBusy(false);
  }

  const activeSub = status?.subscriptions.find((s) =>
    ["active", "trialing"].includes(s.status)
  );

  return (
    <div className="space-y-6">
      {message && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm" role="status" aria-live="polite">
            {message}
          </CardContent>
        </Card>
      )}

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Stripe Connect payouts</CardTitle>
          <CardDescription>
            Complete onboarding to receive destination charges from participant payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            {status?.connectOnboardingComplete
              ? "Connected and ready for payouts"
              : status?.stripeConnectedAccountId
                ? "Onboarding in progress"
                : "Not connected"}
          </p>
          <Button type="button" variant="default" onClick={() => void finishOnboarding()} disabled={busy} size="lg">
            {status?.stripeConnectedAccountId ? "Continue Stripe onboarding" : "Finish Stripe onboarding"}
          </Button>
        </CardContent>
      </Card>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Provider Pro <span className="text-secondary">subscription</span>
          </CardTitle>
          <CardDescription>Manage your MapAble provider subscription via Stripe Checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSub ? (
            <p className="text-sm text-muted-foreground">
              Active plan: {activeSub.planCode.replace(/_/g, " ")}
              {activeSub.currentPeriodEnd
                ? ` · renews ${new Date(activeSub.currentPeriodEnd).toLocaleDateString()}`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription.</p>
          )}
          <div className="flex flex-wrap gap-3">
            {!activeSub && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void startSubscription("provider_pro")}
                disabled={busy}
                size="lg"
              >
                Subscribe to Provider Pro
              </Button>
            )}
            {activeSub && (
              <Button type="button" variant="outline" onClick={() => void openPortal()} disabled={busy} size="lg">
                Manage subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Marketplace Featured</CardTitle>
          <CardDescription>
            Boost your marketplace listing placement with a monthly featured subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => void startSubscription("marketplace_featured")}
            disabled={busy}
            size="lg"
          >
            Subscribe to Marketplace Featured
          </Button>
        </CardContent>
      </Card>

      <div className={cn(mapableSectionCardClass, "p-5 sm:p-6")}>
        <h2 className="font-heading text-lg font-semibold">Transactions & transfers</h2>
        {status?.payments && status.payments.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {status.payments.map((p) => (
              <li key={p.id} className="flex justify-between border-b border-border/50 py-2">
                <span>
                  {p.invoice.serviceType} · ${(p.amountCents / 100).toFixed(2)}
                </span>
                <span className="text-muted-foreground">{p.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Payment history appears here after webhook-confirmed checkout payments.
          </p>
        )}
      </div>
    </div>
  );
}
