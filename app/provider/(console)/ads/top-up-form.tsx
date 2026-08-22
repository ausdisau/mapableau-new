"use client";

import { useState } from "react";

type AdsTopUpFormProps = {
  advertiserId: string;
  presets: readonly number[];
  disabled?: boolean;
};

export function AdsTopUpForm({
  advertiserId,
  presets,
  disabled,
}: AdsTopUpFormProps) {
  const [amountCents, setAmountCents] = useState(presets[0] ?? 10_000);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ads/billing/top-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advertiserId, amountCents }),
      });
      const data = (await res.json()) as {
        error?: string;
        data?: { checkoutUrl?: string };
        checkoutUrl?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Top-up failed");
        return;
      }
      const url = data.checkoutUrl ?? data.data?.checkoutUrl;
      if (!url) {
        setError("No checkout URL returned");
        return;
      }
      window.location.href = url;
    } catch {
      setError("Network error creating top-up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-labelledby="topup-heading">
      <h3 id="topup-heading" className="font-semibold">
        Top up wallet
      </h3>
      <p className="text-sm text-muted-foreground">
        Prepaid funds only. Stripe handles funding; MapAble&apos;s ledger handles
        impression and click charges. Success redirect does not credit your
        wallet — wait for payment confirmation.
      </p>
      <fieldset disabled={disabled || loading}>
        <legend className="sr-only">Top-up amount</legend>
        <div className="flex flex-wrap gap-2">
          {presets.map((cents) => (
            <label
              key={cents}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3"
            >
              <input
                type="radio"
                name="amount"
                value={cents}
                checked={amountCents === cents}
                onChange={() => setAmountCents(cents)}
              />
              <span>A${(cents / 100).toLocaleString("en-AU")}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || loading}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Continue to Stripe Checkout"}
      </button>
    </form>
  );
}
