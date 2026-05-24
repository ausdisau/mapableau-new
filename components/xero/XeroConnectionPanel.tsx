"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function XeroConnectionPanel({
  organisationId,
  connected,
  tenantName,
}: {
  organisationId: string;
  connected: boolean;
  tenantName?: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function connect() {
    window.location.href = `/api/xero/connect?organisationId=${encodeURIComponent(organisationId)}`;
  }

  async function disconnect() {
    setBusy(true);
    const res = await fetch("/api/xero/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organisationId, mfaConfirmed: false }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Disconnected from Xero." : data.error);
    setBusy(false);
    if (res.ok) window.location.reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Xero accounting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect Xero to sync MapAble invoices to your accounting ledger. Tokens
          are encrypted and never shown in the browser.
        </p>
        {connected ? (
          <p className="text-sm font-medium" role="status">
            Connected{tenantName ? ` to ${tenantName}` : ""}.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Not connected.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <Button type="button" variant="default" size="default" onClick={connect}>
              Connect Xero
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={busy}
              onClick={() => void disconnect()}
            >
              Disconnect (MFA in production)
            </Button>
          )}
        </div>
        {message ? (
          <p className="text-sm" aria-live="polite">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
