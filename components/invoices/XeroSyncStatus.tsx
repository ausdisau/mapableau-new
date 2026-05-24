"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function XeroSyncStatus({
  invoiceId,
  canRetry,
}: {
  invoiceId: string;
  canRetry?: boolean;
}) {
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/xero/invoices/status/${invoiceId}`);
    const data = await res.json();
    setStatus(data.status ?? "unknown");
    setError(data.record?.lastError ?? null);
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sync() {
    setBusy(true);
    setStatus("syncing");
    const res = await fetch(`/api/xero/invoices/sync/${invoiceId}`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.ok === false) {
      setStatus("failed");
      setError(data.error ?? "Sync failed");
    } else {
      setStatus(data.duplicate ? "synced" : "synced");
      setError(null);
    }
    setBusy(false);
    void load();
  }

  const label =
    status === "synced"
      ? "Synced to Xero accounting"
      : status === "failed"
        ? "Xero sync failed"
        : status === "syncing"
          ? "Syncing to Xero…"
          : `Accounting sync: ${status}`;

  return (
    <div className="rounded-md border p-4" aria-live="polite">
      <p className="text-sm font-medium">{label}</p>
      {error ? (
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{error}</p>
      ) : null}
      {canRetry && status !== "synced" ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          className="mt-3"
          disabled={busy}
          onClick={() => void sync()}
        >
          {status === "failed" ? "Retry Xero sync" : "Sync to Xero"}
        </Button>
      ) : null}
    </div>
  );
}
