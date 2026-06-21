"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BillingStatus = {
  subscriptions: Array<{
    id: string;
    planCode: string;
    status: string;
    currentPeriodEnd: string | null;
  }>;
};

export function PlanManagerBillingClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [remainingExports, setRemainingExports] = useState<number | null>(null);

  useEffect(() => {
    const sub = searchParams.get("subscription");
    if (sub === "success") {
      setMessage("Plan Manager Pro subscription activated.");
    } else if (sub === "cancelled") {
      setMessage("Subscription checkout was cancelled.");
    }
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      const [billingRes, quotaRes] = await Promise.all([
        fetch("/api/billing/status?role=provider"),
        fetch("/api/abilitypay/entitlements"),
      ]);
      if (billingRes.ok) setStatus(await billingRes.json());
      if (quotaRes.ok) {
        const data = await quotaRes.json();
        setRemainingExports(data.remainingExports ?? null);
      }
    })();
  }, []);

  async function startSubscription() {
    setBusy(true);
    const res = await fetch("/api/billing/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode: "plan_manager_pro" }),
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
      body: JSON.stringify({
        role: "provider",
        returnPath: "/plan-manager/billing",
      }),
    });
    const data = await res.json();
    if (data.portalUrl) window.location.href = data.portalUrl;
    else setMessage(data.error ?? "Billing portal unavailable");
    setBusy(false);
  }

  const activeSub = status?.subscriptions.find(
    (s) => s.planCode === "plan_manager_pro" && ["active", "trialing"].includes(s.status)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Plan Manager billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your Plan Manager Office subscription and export quotas.
        </p>
      </div>

      {message && (
        <p className="rounded-md border bg-muted/50 px-4 py-3 text-sm" role="status">
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan Manager Pro</CardTitle>
          <CardDescription>
            AbilityPay workbench, claim pack exports, and audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSub ? (
            <p className="text-sm">
              Active until{" "}
              {activeSub.currentPeriodEnd
                ? new Date(activeSub.currentPeriodEnd).toLocaleDateString()
                : "renewal"}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => void startSubscription()}
              disabled={busy}
            >
              {activeSub ? "Change plan" : "Subscribe to Plan Manager Pro"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => void openPortal()}
              disabled={busy}
            >
              Manage billing
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export quota</CardTitle>
          <CardDescription>Claim pack and statement exports this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {remainingExports !== null ? (
            <p className="text-sm">
              <strong>{remainingExports}</strong> exports remaining this month.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Loading quota…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
