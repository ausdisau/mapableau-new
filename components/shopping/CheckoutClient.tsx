"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatShopMoney } from "@/lib/shopping/format";
import type { ShopCartView } from "@/types/shopping";

import { ShoppingSafetyNotice } from "./ShoppingSafetyNotice";

type FundingSource = {
  id: string;
  type: string;
  label: string;
  isDefault: boolean;
};

export function CheckoutClient() {
  const router = useRouter();
  const [cart, setCart] = useState<ShopCartView | null>(null);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [planManagedMessage, setPlanManagedMessage] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [cartRes, fundingRes] = await Promise.all([
          fetch("/api/shopping/cart"),
          fetch("/api/billing/funding-sources"),
        ]);

        if (cartRes.status === 401 || fundingRes.status === 401) {
          setError("Sign in to checkout.");
          return;
        }

        const cartData = await cartRes.json();
        const fundingData = await fundingRes.json();

        if (!cartRes.ok) {
          setError(cartData.error ?? "Could not load cart");
          return;
        }

        setCart(cartData.cart);
        const sources = (fundingData.fundingSources ?? []) as FundingSource[];
        setFundingSources(sources);
        const defaultSource = sources.find((s) => s.isDefault) ?? sources[0];
        if (defaultSource) setFundingSourceId(defaultSource.id);
      } catch {
        setError("Could not load checkout");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function handleCheckout() {
    if (!fundingSourceId) {
      setError("Select a funding source");
      return;
    }

    setSubmitting(true);
    setError(null);
    setPlanManagedMessage(null);

    try {
      const res = await fetch("/api/shopping/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundingSourceId }),
      });
      const data = await res.json();

      if (data.checkout && data.checkout.allowed === false) {
        setPlanManagedMessage(data.checkout.instruction);
        return;
      }

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Checkout could not start");
        return;
      }

      window.location.href = data.checkoutUrl as string;
    } catch {
      setError("Checkout failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading checkout…</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p>{error}</p>
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    router.replace("/shopping/cart");
    return null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section aria-labelledby="funding-heading">
          <h2 id="funding-heading" className="text-lg font-semibold">
            Funding source
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan-managed NDIS funding cannot pay by card here. Use invoice export
            via billing instead.
          </p>
          {fundingSources.length === 0 ? (
            <p className="mt-3 text-sm">
              Add a funding source in{" "}
              <Link href="/dashboard/billing/funding/new" className="underline">
                billing settings
              </Link>{" "}
              before checkout.
            </p>
          ) : (
            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Select funding source</legend>
              {fundingSources.map((source) => (
                <label
                  key={source.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2"
                >
                  <input
                    type="radio"
                    name="fundingSource"
                    value={source.id}
                    checked={fundingSourceId === source.id}
                    onChange={() => setFundingSourceId(source.id)}
                  />
                  <span>
                    {source.label}{" "}
                    <span className="text-muted-foreground">({source.type})</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
        </section>

        <ShoppingSafetyNotice />

        {planManagedMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {planManagedMessage}
          </p>
        ) : null}
      </div>

      <aside className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">Total due</h2>
        <p className="text-2xl font-semibold">
          {formatShopMoney(cart.totals.totalCents, cart.totals.currency)}
        </p>
        <button
          type="button"
          onClick={() => void handleCheckout()}
          disabled={submitting || fundingSources.length === 0}
          className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Redirecting…" : "Pay with Stripe"}
        </button>
        <p className="text-xs text-muted-foreground">
          You will be redirected to Stripe for secure payment. MapAble does not
          store card details.
        </p>
      </aside>
    </div>
  );
}
