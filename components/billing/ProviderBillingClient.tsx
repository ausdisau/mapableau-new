"use client";

import { useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { fetchJson } from "@/lib/client/fetch-json";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type StatusPayload = {
  variant: "info" | "success" | "error";
  message: string;
};

export function ProviderBillingClient() {
  const [message, setMessage] = useState<StatusPayload | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscription = params.get("subscription");
    const connect = params.get("connect");
    if (subscription === "success") {
      setMessage({
        variant: "success",
        message: "Subscription checkout completed. Status updates after Stripe confirms payment.",
      });
    } else if (subscription === "cancelled") {
      setMessage({
        variant: "info",
        message: "Subscription checkout was cancelled.",
      });
    } else if (connect === "return") {
      setMessage({
        variant: "info",
        message: "Stripe Connect onboarding updated. Refresh if payout status has not changed yet.",
      });
    }
    if (subscription || connect) {
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      url.searchParams.delete("connect");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  async function finishOnboarding() {
    setConnectBusy(true);
    setMessage(null);
    const result = await fetchJson<{ onboardingUrl?: string }>(
      "/api/billing/connect/onboarding-link",
      { method: "POST" },
    );
    if (result.ok && result.data.onboardingUrl) {
      window.location.href = result.data.onboardingUrl;
      return;
    }
    setMessage({
      variant: "error",
      message: result.ok ? "Could not start onboarding." : result.error,
    });
    setConnectBusy(false);
  }

  async function startSubscription(planCode: "provider_pro" | "marketplace_featured") {
    setSubscriptionBusy(true);
    setMessage(null);
    const result = await fetchJson<{ checkoutUrl?: string }>(
      "/api/billing/subscriptions/checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      },
    );
    if (result.ok && result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
      return;
    }
    setMessage({
      variant: "error",
      message: result.ok ? "Subscription checkout unavailable." : result.error,
    });
    setSubscriptionBusy(false);
  }

  return (
    <div className="space-y-6">
      {message ? (
        <StatusMessage
          variant={message.variant}
          message={message.message}
          onDismiss={() => setMessage(null)}
        />
      ) : null}

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Stripe Connect payouts</CardTitle>
          <CardDescription>
            Complete onboarding to receive destination charges from participant payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="default"
            onClick={() => void finishOnboarding()}
            loading={connectBusy}
            disabled={subscriptionBusy}
            size="lg"
          >
            Finish Stripe onboarding
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
            onClick={() => void startSubscription("provider_pro")}
            loading={subscriptionBusy}
            disabled={connectBusy}
            size="lg"
          >
            Subscribe to Provider Pro
          </Button>
        </CardContent>
      </Card>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Marketplace Featured</CardTitle>
          <CardDescription>
            Boost partner marketplace listings with featured placement sorting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => void startSubscription("marketplace_featured")}
            loading={subscriptionBusy}
            disabled={connectBusy}
            size="lg"
          >
            Subscribe to featured listings
          </Button>
        </CardContent>
      </Card>

      <div className={cn(mapableSectionCardClass, "p-5 sm:p-6")} role="status">
        <h2 className="font-heading text-lg font-semibold">Transactions & transfers</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment splits and transfer history appear here after webhook-confirmed payments.
        </p>
      </div>
    </div>
  );
}
