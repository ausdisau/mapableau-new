"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";
import { formatMarketplacePrice } from "@/lib/marketplace/format";

type ConnectStatusResponse = {
  configured: boolean;
  paymentsMode: "test" | "live";
  payoutsEnabled: boolean;
  connect: {
    billingAccountId: string;
    stripeConnectedAccountId: string | null;
    onboardingState: "not_started" | "incomplete" | "complete" | "unknown";
    onboardingComplete: boolean;
    requirementsAvailable: boolean;
    requirements: {
      currentlyDue: string[];
      eventuallyDue: string[];
      disabledReason: string | null;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
    } | null;
  };
  recipient: {
    id: string;
    displayName: string;
    stripeOnboardingStatus: string;
    stripeAccountId: string | null;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    payoutSchedule: string;
  } | null;
  earnings: {
    recentTransfers: Array<{
      id: string;
      amountCents: number;
      currency: string;
      status: string;
      createdAt: string;
      kind: "transfer_to_connected_account";
    }>;
    bankPayoutNote: string;
  };
};

function onboardingLabel(status: ConnectStatusResponse | null): string {
  if (!status) return "Loading…";
  switch (status.connect.onboardingState) {
    case "complete":
      return "Complete";
    case "incomplete":
      return "Incomplete — requirements outstanding";
    case "unknown":
      return "Status unavailable (could not refresh from Stripe)";
    default:
      return "Not started";
  }
}

export function ProviderBillingClient() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ConnectStatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/billing/connect/status");
      const data = await res.json();
      if (!res.ok) {
        setStatus(null);
        setStatusError(data.error ?? "Could not load Connect status");
        return;
      }
      setStatus(data as ConnectStatusResponse);
      setStatusError(null);
    } catch {
      setStatus(null);
      setStatusError("Could not load Connect status");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function finishOnboarding() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/connect/onboarding-link", {
        method: "POST",
      });
      const data = await res.json();
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
        return;
      }
      setMessage(data.error ?? "Could not start onboarding");
    } catch {
      setMessage("Could not start onboarding");
    } finally {
      setBusy(false);
    }
  }

  async function createAccount() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/connect/create-account", {
        method: "POST",
      });
      const data = await res.json();
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
        return;
      }
      setMessage(data.error ?? "Could not create Connect account");
    } catch {
      setMessage("Could not create Connect account");
    } finally {
      setBusy(false);
    }
  }

  async function startSubscription() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: "provider_pro" }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setMessage(data.error ?? "Subscription checkout unavailable");
    } catch {
      setMessage("Subscription checkout unavailable");
    } finally {
      setBusy(false);
    }
  }

  const requirements = status?.connect.requirements;
  const hasConnectedAccount = Boolean(status?.connect.stripeConnectedAccountId);

  return (
    <div className="space-y-6">
      {message && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm" role="alert" aria-live="assertive">
            {message}
          </CardContent>
        </Card>
      )}
      {statusError && (
        <p className="text-sm text-destructive" role="alert">
          {statusError}
        </p>
      )}

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Stripe Connect payouts</CardTitle>
          <CardDescription>
            Complete onboarding to receive transfers from participant payments. MapAble does
            not store bank account numbers. Bank payouts are scheduled by Stripe — this UI does
            not trigger unrestricted withdrawals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLoading && !status ? (
            <p className="text-sm text-muted-foreground" role="status">
              Loading Connect status…
            </p>
          ) : null}
          <dl className="grid gap-2 text-sm sm:grid-cols-2" aria-live="polite">
            <div>
              <dt className="text-muted-foreground">Stripe configured</dt>
              <dd className="font-medium">
                {status ? (status.configured ? "Yes" : "No") : "…"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payments mode</dt>
              <dd className="font-medium">{status?.paymentsMode ?? "…"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Live transfers gate</dt>
              <dd className="font-medium">
                {!status
                  ? "…"
                  : status.payoutsEnabled
                    ? "MAPABLE_PAYOUTS_ENABLED"
                    : "Off (sandbox-safe)"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Onboarding</dt>
              <dd className="font-medium">{onboardingLabel(status)}</dd>
            </div>
          </dl>

          {requirements ? (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">Account requirements</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Charges enabled: {requirements.chargesEnabled ? "yes" : "no"}</li>
                <li>Payouts enabled: {requirements.payoutsEnabled ? "yes" : "no"}</li>
                <li>Details submitted: {requirements.detailsSubmitted ? "yes" : "no"}</li>
                {requirements.disabledReason ? (
                  <li role="status">Disabled reason: {requirements.disabledReason}</li>
                ) : null}
                {requirements.currentlyDue.length > 0 ? (
                  <li>Currently due: {requirements.currentlyDue.join(", ")}</li>
                ) : (
                  <li>No fields currently due</li>
                )}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {status && !hasConnectedAccount ? (
              <Button
                type="button"
                variant="default"
                onClick={() => void createAccount()}
                disabled={busy || !status.configured}
                size="lg"
              >
                Start Stripe Connect onboarding
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={() => void finishOnboarding()}
                disabled={busy || !status?.configured}
                size="lg"
              >
                {status?.connect.onboardingComplete
                  ? "Refresh Stripe onboarding link"
                  : "Finish Stripe onboarding"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadStatus()}
              disabled={busy || statusLoading}
              size="lg"
            >
              Refresh status
            </Button>
          </div>
          {status && !status.configured ? (
            <p className="text-sm text-muted-foreground" role="status">
              Stripe is not configured in this environment. Set test-mode keys before onboarding.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Earnings &amp; transfer status
          </CardTitle>
          <CardDescription>
            Transfers move funds from the MapAble platform balance to your connected Stripe
            account. Separate from Stripe&apos;s scheduled bank payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!status ? (
            <p className="text-sm text-muted-foreground" role="status">
              {statusLoading ? "Loading earnings…" : "Earnings unavailable until status loads."}
            </p>
          ) : status.earnings.recentTransfers.length ? (
            <ul className="divide-y rounded-lg border">
              {status.earnings.recentTransfers.map((transfer) => (
                <li
                  key={transfer.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                >
                  <span>
                    {formatMarketplacePrice(transfer.amountCents)} · {transfer.status}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(transfer.createdAt).toLocaleString("en-AU")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transfers yet. Earnings appear after webhook-confirmed payments and approved
              payout release.
            </p>
          )}
          {status ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {status.earnings.bankPayoutNote}
            </p>
          ) : null}
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
        <h2 className="font-heading text-lg font-semibold">Transactions &amp; transfers</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment splits and transfer history appear after webhook-confirmed payments. Live
          transfers stay off until <code>MAPABLE_PAYOUTS_ENABLED=true</code> after review.
        </p>
      </div>
    </div>
  );
}
