"use client";

import { useId, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  DONATION_MAX_AMOUNT_CENTS,
  DONATION_MIN_AMOUNT_CENTS,
  DONATION_PRESET_CENTS,
} from "@/lib/donations/config";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

function formatAudFromCents(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type DonateFormProps = {
  stripeEnabled: boolean;
  paypalUrl: string;
  cancelled?: boolean;
};

export function DonateForm({
  stripeEnabled,
  paypalUrl,
  cancelled = false,
}: DonateFormProps) {
  const amountFieldId = useId();
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(
    DONATION_PRESET_CENTS[1],
  );
  const [customDollars, setCustomDollars] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amountCents =
    selectedPreset === "custom"
      ? Math.round(Number(customDollars) * 100)
      : selectedPreset;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!stripeEnabled) {
      setError(
        "Card donations are temporarily unavailable. Please use PayPal below.",
      );
      return;
    }

    if (
      !Number.isFinite(amountCents) ||
      amountCents < DONATION_MIN_AMOUNT_CENTS ||
      amountCents > DONATION_MAX_AMOUNT_CENTS
    ) {
      setError(
        `Enter an amount between ${formatAudFromCents(DONATION_MIN_AMOUNT_CENTS)} and ${formatAudFromCents(DONATION_MAX_AMOUNT_CENTS)}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(
          data.error ??
            "Could not start checkout. Please try again or use PayPal.",
        );
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Could not start checkout. Please try again or use PayPal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {cancelled ? (
        <p
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          Checkout was cancelled. You can choose an amount and try again, or give
          via PayPal.
        </p>
      ) : null}

      {!stripeEnabled ? (
        <p
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          role="status"
        >
          Card donations are temporarily unavailable. You can still support
          Australian Disability Ltd via PayPal below.
        </p>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <fieldset>
          <legend className="text-sm font-black text-[#0C1833]">
            Choose an amount (AUD)
          </legend>
          <div
            role="group"
            aria-label="Donation amount presets"
            className="mt-3 flex flex-wrap gap-2"
          >
            {DONATION_PRESET_CENTS.map((cents) => {
              const pressed = selectedPreset === cents;
              return (
                <button
                  key={cents}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={`Donate ${formatAudFromCents(cents)}`}
                  className={cn(
                    "min-h-11 rounded-xl border-2 px-4 text-sm font-black transition",
                    mapableCareFocusRing,
                    pressed
                      ? "border-[#005B7F] bg-[#005B7F] text-white"
                      : "border-slate-200 bg-white text-[#0C1833] hover:bg-slate-50",
                  )}
                  onClick={() => setSelectedPreset(cents)}
                >
                  {formatAudFromCents(cents)}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={selectedPreset === "custom"}
              aria-label="Enter a custom donation amount"
              className={cn(
                "min-h-11 rounded-xl border-2 px-4 text-sm font-black transition",
                mapableCareFocusRing,
                selectedPreset === "custom"
                  ? "border-[#005B7F] bg-[#005B7F] text-white"
                  : "border-slate-200 bg-white text-[#0C1833] hover:bg-slate-50",
              )}
              onClick={() => setSelectedPreset("custom")}
            >
              Custom
            </button>
          </div>
        </fieldset>

        {selectedPreset === "custom" ? (
          <div>
            <label
              htmlFor={amountFieldId}
              className="text-sm font-bold text-[#0C1833]"
            >
              Custom amount (AUD)
            </label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600" aria-hidden>
                $
              </span>
              <input
                id={amountFieldId}
                type="number"
                inputMode="decimal"
                min={DONATION_MIN_AMOUNT_CENTS / 100}
                max={DONATION_MAX_AMOUNT_CENTS / 100}
                step="1"
                value={customDollars}
                onChange={(e) => setCustomDollars(e.target.value)}
                className={cn(
                  "min-h-11 w-full max-w-xs rounded-xl border-2 border-slate-200 px-3 text-base font-semibold text-[#0C1833]",
                  mapableCareFocusRing,
                )}
                aria-describedby={`${amountFieldId}-hint`}
              />
            </div>
            <p
              id={`${amountFieldId}-hint`}
              className="mt-1 text-xs text-slate-600"
            >
              Minimum {formatAudFromCents(DONATION_MIN_AMOUNT_CENTS)}. Whole
              dollars only.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !stripeEnabled}
          className={cn(
            "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
            mapableCareFocusRing,
          )}
          aria-label={
            stripeEnabled
              ? `Donate ${Number.isFinite(amountCents) ? formatAudFromCents(amountCents) : "selected amount"} with card via Stripe`
              : "Card donations unavailable"
          }
        >
          {submitting ? "Starting checkout…" : "Donate with card"}
        </button>
      </form>

      <div className="border-t border-slate-200 pt-5">
        <p className="text-sm font-bold text-[#0C1833]">Prefer PayPal?</p>
        <p className="mt-1 text-sm text-slate-600">
          You can also donate via PayPal (opens in a new tab).
        </p>
        <a
          href={paypalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-3 inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-5 text-sm font-black text-[#0C1833] transition hover:bg-slate-50",
            mapableCareFocusRing,
          )}
        >
          Donate with PayPal
        </a>
      </div>
    </div>
  );
}
