"use client";

import { useState } from "react";

export function AdminWalletAdjustForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      walletId: String(fd.get("walletId")),
      type: String(fd.get("type")),
      amountMicros: String(fd.get("amountMicros")),
      reason: String(fd.get("reason")),
      idempotencyKey: `manual:${Date.now()}:${String(fd.get("walletId"))}`,
    };
    const res = await fetch("/api/admin/ads/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Adjustment failed");
      return;
    }
    setMessage(`Balance after: ${data.data?.balanceAfterMicros ?? data.balanceAfterMicros}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="font-semibold">Manual adjustment</h2>
      <div>
        <label htmlFor="walletId" className="block text-sm">
          Wallet id
        </label>
        <input
          id="walletId"
          name="walletId"
          required
          className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
        />
      </div>
      <fieldset>
        <legend className="text-sm">Type</legend>
        <label className="mr-4 inline-flex min-h-11 items-center gap-2">
          <input type="radio" name="type" value="MANUAL_CREDIT" defaultChecked />
          Credit
        </label>
        <label className="inline-flex min-h-11 items-center gap-2">
          <input type="radio" name="type" value="MANUAL_DEBIT" />
          Debit
        </label>
      </fieldset>
      <div>
        <label htmlFor="amountMicros" className="block text-sm">
          Amount (micros)
        </label>
        <input
          id="amountMicros"
          name="amountMicros"
          required
          pattern="\d+"
          className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
        />
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm">
          Reason (required)
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          minLength={3}
          rows={2}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground"
      >
        Apply with audit
      </button>
    </form>
  );
}
