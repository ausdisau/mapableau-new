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

export function EmployerBillingClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    const sub = searchParams.get("subscription");
    if (sub === "success") {
      setMessage("Employer Pro subscription activated.");
    } else if (sub === "cancelled") {
      setMessage("Subscription checkout was cancelled.");
    }
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/billing/status?role=employer");
      if (res.ok) setStatus(await res.json());
    })();
  }, []);

  async function startSubscription() {
    setBusy(true);
    const res = await fetch("/api/billing/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode: "employer_pro" }),
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
      body: JSON.stringify({ role: "employer" }),
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
          <CardTitle className="font-heading text-xl">Employer Pro</CardTitle>
          <CardDescription>
            Extended job posting, applications management, and hiring tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSub ? (
            <p className="text-sm text-muted-foreground">
              Active plan: {activeSub.planCode.replace(/_/g, " ")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription.</p>
          )}
          <div className="flex flex-wrap gap-3">
            {!activeSub && (
              <Button type="button" variant="default" onClick={() => void startSubscription()} disabled={busy} size="lg">
                Subscribe to Employer Pro
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
    </div>
  );
}
