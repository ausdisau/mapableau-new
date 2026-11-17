"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { calculateInvoiceTotals } from "@/lib/billing/core/calculations";
import { formatMarketplacePrice } from "@/lib/marketplace/format";
import type {
  MarketplaceCartItem,
  MarketplaceProduct,
} from "@/lib/marketplace/types";

const CART_KEY = "mapable-marketplace-cart";

type CheckoutPathway =
  | "ordinary_purchase"
  | "ndis_self_managed"
  | "ndis_plan_managed";

export function readMarketplaceCart(): MarketplaceCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MarketplaceCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMarketplaceCart(items: MarketplaceCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("mapable-marketplace-cart"));
}

export function addToMarketplaceCart(productId: string, quantity = 1) {
  const cart = readMarketplaceCart();
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  writeMarketplaceCart(cart);
}

export function updateMarketplaceCartQuantity(productId: string, quantity: number) {
  const cart = readMarketplaceCart().filter((i) => i.productId !== productId);
  if (quantity > 0) cart.push({ productId, quantity });
  writeMarketplaceCart(cart);
}

export function clearMarketplaceCart() {
  writeMarketplaceCart([]);
}

export function useMarketplaceCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      const total = readMarketplaceCart().reduce((sum, i) => sum + i.quantity, 0);
      setCount(total);
    }
    sync();
    window.addEventListener("mapable-marketplace-cart", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mapable-marketplace-cart", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return count;
}

export function MarketplaceAddToCartButton({
  product,
  className,
}: {
  product: MarketplaceProduct;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return (
      <span className="text-sm text-muted-foreground" role="status">
        Out of stock
      </span>
    );
  }

  return (
    <button
      type="button"
      className={
        className ??
        "inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
      }
      onClick={() => {
        addToMarketplaceCart(product.id);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
    >
      {added ? "Added to cart" : "Add to cart"}
    </button>
  );
}

export function MarketplaceProductCard({ product }: { product: MarketplaceProduct }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
      <div
        className="mb-3 flex h-28 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground"
        aria-hidden
      >
        {product.category.replace("-", " ")}
      </div>
      <h3 className="font-semibold">
        <Link
          prefetch={false}
          href={`/marketplace/products/${product.slug}`}
          className="hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {product.name}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      <p className="mt-3 text-sm text-muted-foreground">Sold by {product.sellerName}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="font-semibold">{formatMarketplacePrice(product.priceCents)}</span>
        <MarketplaceAddToCartButton
          product={product}
          className="inline-flex min-h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </article>
  );
}

export function MarketplaceCartClient({
  products,
}: {
  products: MarketplaceProduct[];
}) {
  const [cart, setCart] = useState<MarketplaceCartItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pathway, setPathway] = useState<CheckoutPathway>("ordinary_purchase");

  useEffect(() => {
    setCart(readMarketplaceCart());
    function sync() {
      setCart(readMarketplaceCart());
    }
    window.addEventListener("mapable-marketplace-cart", sync);
    return () => window.removeEventListener("mapable-marketplace-cart", sync);
  }, []);

  const lines = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { item, product };
    })
    .filter(Boolean) as { item: MarketplaceCartItem; product: MarketplaceProduct }[];

  const totals = useMemo(
    () =>
      calculateInvoiceTotals(
        lines.map(({ item, product }) => ({
          quantity: item.quantity,
          unitAmountCents: product.priceCents,
          gstApplicable: product.gstApplicable,
        })),
      ),
    [lines],
  );

  async function checkout() {
    if (lines.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathway,
          items: lines.map(({ item, product }) => ({
            productId: product.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not start checkout.");
        setBusy(false);
        return;
      }

      if (data.mode === "stripe_checkout" && data.checkoutUrl) {
        clearMarketplaceCart();
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.mode === "export_only" && data.invoicePath) {
        clearMarketplaceCart();
        window.location.href = data.invoicePath;
        return;
      }

      setMessage("Checkout response was incomplete. Try again.");
      setBusy(false);
    } catch {
      setMessage("Checkout failed. Try again.");
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link prefetch={false} href="/marketplace/browse" className="mt-3 inline-block text-primary underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y rounded-xl border">
        {lines.map(({ item, product }) => (
          <li key={product.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.sellerName}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor={`qty-${product.id}`}>
                Quantity for {product.name}
              </label>
              <input
                id={`qty-${product.id}`}
                type="number"
                min={1}
                max={99}
                value={item.quantity}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  updateMarketplaceCartQuantity(product.id, qty);
                  setCart(readMarketplaceCart());
                }}
                className="w-16 rounded border px-2 py-1 text-sm"
              />
              <span className="font-medium">
                {formatMarketplacePrice(item.quantity * product.priceCents)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <fieldset className="space-y-3 rounded-xl border p-4">
        <legend className="px-1 text-sm font-semibold">Payment pathway</legend>
        <p className="text-sm text-muted-foreground">
          Choose how you intend to pay. A successful payment does not imply NDIS eligibility
          or plan approval. Assessment pathways are separate from marketplace checkout.
        </p>
        {(
          [
            {
              value: "ordinary_purchase" as const,
              label: "Ordinary private purchase",
              hint: "Pay by card via Stripe Checkout.",
            },
            {
              value: "ndis_self_managed" as const,
              label: "NDIS self-managed",
              hint: "Card checkout for self-managed participants. Does not confirm plan eligibility.",
            },
            {
              value: "ndis_plan_managed" as const,
              label: "NDIS plan-managed",
              hint: "Creates an invoice for plan-manager export — no card charge.",
            },
          ] as const
        ).map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer gap-3 rounded-lg border border-transparent p-2 hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring"
          >
            <input
              type="radio"
              name="marketplace-pathway"
              value={option.value}
              checked={pathway === option.value}
              onChange={() => setPathway(option.value)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">{option.label}</span>
              <span className="block text-sm text-muted-foreground">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div
        className="space-y-2 rounded-xl border bg-muted/20 p-4"
        aria-live="polite"
      >
        <h2 className="font-semibold">Payable total</h2>
        <dl className="grid gap-1 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 sm:contents">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-right font-medium">
              {formatMarketplacePrice(totals.subtotalCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:contents">
            <dt className="text-muted-foreground">GST</dt>
            <dd className="text-right font-medium">
              {formatMarketplacePrice(totals.gstCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:contents">
            <dt className="text-muted-foreground">
              MapAble platform fee (commission)
            </dt>
            <dd className="text-right font-medium">
              {formatMarketplacePrice(totals.platformFeeCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-2 text-base sm:col-span-2 sm:contents">
            <dt className="font-semibold sm:col-start-1">Total payable</dt>
            <dd className="text-right text-lg font-semibold">
              {formatMarketplacePrice(totals.totalCents)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Final charge is calculated on the server from catalogue prices. Optional extras are
          never pre-selected.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {pathway === "ndis_plan_managed"
            ? "Continues to billing invoice for plan-manager export."
            : "Continues to Stripe Checkout (test/sandbox when configured)."}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void checkout()}
          aria-busy={busy}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {busy
            ? "Starting checkout…"
            : pathway === "ndis_plan_managed"
              ? "Create invoice for export"
              : `Pay ${formatMarketplacePrice(totals.totalCents)}`}
        </button>
      </div>
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
