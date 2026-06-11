"use client";

import { useMemo, useState } from "react";

import { MAPABLE_TAGLINE } from "@/lib/brand/constants";
import {
  DONATION_PRESET_AMOUNTS_CENTS,
  getDonationsMaxCents,
  getDonationsMinCents,
} from "@/lib/donations/constants";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

function formatAud(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type DonateClientProps = {
  cancelled?: boolean;
};

export function DonateClient({ cancelled = false }: DonateClientProps) {
  const minCents = getDonationsMinCents();
  const maxCents = getDonationsMaxCents();
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(
    DONATION_PRESET_AMOUNTS_CENTS[1],
  );
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const amountCents = useMemo(() => {
    if (selectedPreset === "custom") {
      const dollars = Number.parseFloat(customAmount);
      if (!Number.isFinite(dollars)) return null;
      return Math.round(dollars * 100);
    }
    return selectedPreset;
  }, [customAmount, selectedPreset]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (amountCents === null || amountCents < minCents || amountCents > maxCents) {
      setError(
        `Enter an amount between ${formatAud(minCents)} and ${formatAud(maxCents)}.`,
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          donorName: donorName.trim() || undefined,
          donorEmail: donorEmail.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${mapablePublicCardClass} space-y-6`}>
      {cancelled && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Checkout was cancelled. You can choose another amount and try again.
        </p>
      )}

      <div>
        <p className="text-sm leading-7 text-slate-700">{MAPABLE_TAGLINE}</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          One-time donations support MapAble&apos;s work connecting people with
          disability to care, transport, and employment services. Payments are
          processed securely by Stripe.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-black text-mapable-navy">Choose an amount</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {DONATION_PRESET_AMOUNTS_CENTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setSelectedPreset(amount)}
              aria-pressed={selectedPreset === amount}
              className={
                selectedPreset === amount
                  ? "min-h-11 rounded-2xl bg-mapable-brand px-4 text-sm font-black text-white"
                  : mapablePublicSecondaryButtonClass
              }
            >
              {formatAud(amount)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedPreset("custom")}
            aria-pressed={selectedPreset === "custom"}
            className={
              selectedPreset === "custom"
                ? "min-h-11 rounded-2xl bg-mapable-brand px-4 text-sm font-black text-white"
                : mapablePublicSecondaryButtonClass
            }
          >
            Custom
          </button>
        </div>
      </fieldset>

      {selectedPreset === "custom" && (
        <div>
          <label htmlFor="donation-custom-amount" className="text-sm font-black text-mapable-navy">
            Custom amount (AUD)
          </label>
          <input
            id="donation-custom-amount"
            name="customAmount"
            type="number"
            min={minCents / 100}
            max={maxCents / 100}
            step="1"
            inputMode="decimal"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            required
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="donation-name" className="text-sm font-black text-mapable-navy">
            Name (optional)
          </label>
          <input
            id="donation-name"
            name="donorName"
            type="text"
            autoComplete="name"
            maxLength={120}
            value={donorName}
            onChange={(event) => setDonorName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="donation-email" className="text-sm font-black text-mapable-navy">
            Email (optional)
          </label>
          <input
            id="donation-email"
            name="donorEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={donorEmail}
            onChange={(event) => setDonorEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="donation-message" className="text-sm font-black text-mapable-navy">
          Message (optional)
        </label>
        <textarea
          id="donation-message"
          name="message"
          rows={3}
          maxLength={500}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`${mapablePublicPrimaryButtonClass} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading ? "Redirecting to Stripe…" : `Donate ${amountCents ? formatAud(amountCents) : ""}`}
      </button>
    </form>
  );
}
