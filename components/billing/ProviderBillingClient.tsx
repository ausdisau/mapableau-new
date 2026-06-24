"use client";

import { useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type ConnectStatus = {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  stripeAccountId?: string;
};

export function ProviderBillingClient() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);

  useEffect(() => {
    void fetch("/api/billing/connect/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected !== undefined) setConnectStatus(data);
      })
      .catch(() => undefined);
  }, []);

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
        <CardContent className="space-y-4">
          {connectStatus ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-muted-foreground">Connect account</dt>
                <dd>{connectStatus.connected ? "Linked" : "Not linked"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Charges enabled</dt>
                <dd>{connectStatus.chargesEnabled ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Payouts enabled</dt>
                <dd>{connectStatus.payoutsEnabled ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Onboarding</dt>
                <dd>{connectStatus.onboardingComplete ? "Complete" : "Incomplete"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Loading Connect status…</p>
          )}
          <Button type="button" variant="default" onClick={() => void finishOnboarding()} disabled={busy} size="lg">
            {connectStatus?.onboardingComplete
              ? "Update Stripe account"
              : "Finish Stripe onboarding"}
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
        <CardContent>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void startSubscription()}
            disabled={busy}
            size="lg"
          >
            Subscribe to Provider Pro
          </Button>
        </CardContent>
      </Card>

      <div className={cn(mapableSectionCardClass, "p-5 sm:p-6")}>
        <h2 className="font-heading text-lg font-semibold">Transactions & transfers</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment splits and transfer history appear here after webhook-confirmed payments.
          Connect must have charges and payouts enabled before you can receive participant payments.
        </p>
      </div>
    </div>
  );
}
