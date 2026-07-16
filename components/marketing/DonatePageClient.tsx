"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { MAPABLE_DONATION_URL } from "@/lib/brand/constants";
import {
  DONATION_PRESET_AMOUNTS_AUD,
  donationConfig,
} from "@/lib/donations/donation-config";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function DonatePageClient() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [selectedAud, setSelectedAud] = useState<number>(50);
  const [customAud, setCustomAud] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountAud =
    customAud.trim().length > 0 ? Number.parseFloat(customAud) : selectedAud;

  async function startStripeCheckout() {
    setBusy(true);
    setError(null);
    try {
      const amountCents = Math.round(amountAud * 100);
      const res = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        configured?: boolean;
        paypalUrl?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.configured === false && data.paypalUrl) {
        window.open(data.paypalUrl, "_blank", "noopener,noreferrer");
        setError(data.error ?? "Card checkout is unavailable. Opened PayPal instead.");
        return;
      }

      setError("Checkout could not be started. Try PayPal instead.");
    } catch {
      setError("Something went wrong. Try PayPal instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <div className="max-w-2xl">
            <p className={mapablePublicEyebrowClass}>Support MapAble</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>Donate to Australian Disability Ltd</h1>
            <p className={mapablePublicLeadClass}>
              Donations help MapAble build accessible, consent-driven disability support
              infrastructure. Choose a card donation below, or use PayPal if you prefer.
            </p>
            {status === "success" ? (
              <p
                role="status"
                className="mt-6 rounded-2xl border border-[#00A979]/30 bg-[#00A979]/10 px-4 py-3 text-sm font-semibold text-[#0C1833]"
              >
                Thank you — your donation was received. A receipt will be emailed if you provided
                one at checkout.
              </p>
            ) : null}
            {status === "cancelled" ? (
              <p role="status" className="mt-6 text-sm text-slate-600">
                Checkout was cancelled. You can try again or donate via PayPal.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <div className="max-w-xl space-y-8">
          <div>
            <h2 className="text-lg font-black text-[#0C1833]">Choose an amount (AUD)</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {DONATION_PRESET_AMOUNTS_AUD.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setSelectedAud(amount);
                    setCustomAud("");
                  }}
                  className={`min-h-11 rounded-full border px-5 py-3 text-sm font-black transition ${
                    selectedAud === amount && !customAud
                      ? "border-[#005B7F] bg-[#005B7F] text-white"
                      : "border-slate-200 bg-white text-[#005B7F] hover:bg-[#F6FBFC]"
                  } ${mapableCareFocusRing}`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <label htmlFor="donation-custom-amount" className="mt-4 block text-sm font-bold">
              Or enter another amount
            </label>
            <input
              id="donation-custom-amount"
              type="number"
              min={donationConfig.minAmountAud}
              max={donationConfig.maxAmountAud}
              step="1"
              value={customAud}
              onChange={(event) => setCustomAud(event.target.value)}
              placeholder={`${donationConfig.minAmountAud} – ${donationConfig.maxAmountAud}`}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#005B7F] focus:ring-4 focus:ring-[#F8C51C]/30"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy || !Number.isFinite(amountAud) || amountAud <= 0}
              onClick={() => void startStripeCheckout()}
              className={mapablePublicPrimaryButtonClass}
            >
              {busy ? "Starting checkout…" : `Donate $${amountAud} with card`}
            </button>
            <a
              href={MAPABLE_DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={mapablePublicSecondaryButtonClass}
            >
              Donate with PayPal
            </a>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            Card donations use Stripe Checkout when configured in this environment. PayPal remains
            available at all times via the header Donate link or the button above.
          </p>

          <Link href="/" className="text-sm font-bold text-[#005B7F] hover:underline">
            ← Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}
