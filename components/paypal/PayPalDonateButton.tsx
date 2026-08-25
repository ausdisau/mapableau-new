"use client";

import { useEffect, useId, useRef, useState } from "react";

import { MAPABLE_DONATION_URL } from "@/lib/brand/constants";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (selector: string | HTMLElement) => Promise<void>;
        close?: () => Promise<void>;
      };
    };
  }
}

type PayPalDonateButtonProps = {
  /** Compact styling for dense header layouts. */
  compact?: boolean;
  className?: string;
};

const FALLBACK_CLASS =
  `inline-flex min-h-11 items-center rounded-xl bg-[#F8C51C] px-4 py-2 text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#e6b019] ${mapableCareFocusRing}`;

function getClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || undefined;
}

function getCurrency(): string {
  return (process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? "USD").toUpperCase();
}

function getMessageAmount(): string {
  return process.env.NEXT_PUBLIC_PAYPAL_DONATION_AMOUNT ?? "100";
}

function loadPayPalSdk(clientId: string, currency: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-paypal-sdk="standard"]',
  );
  if (existing) {
    if (window.paypal) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("PayPal SDK failed to load")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&components=buttons&enable-funding=venmo,paylater,card`;
    script.async = true;
    script.dataset.paypalSdk = "standard";
    script.dataset.sdkIntegrationSource = "developer-studio";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.body.appendChild(script);
  });
}

/**
 * PayPal Standard Checkout buttons (from OSM HTML/JS sample).
 * Falls back to paypal.me when the public client ID is not configured.
 */
export function PayPalDonateButton({
  compact = false,
  className,
}: PayPalDonateButtonProps) {
  const reactId = useId();
  const containerId = `paypal-button-${reactId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const clientId = getClientId();

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    let buttons: {
      render: (selector: string | HTMLElement) => Promise<void>;
      close?: () => Promise<void>;
    } | null = null;

    async function mount() {
      try {
        await loadPayPalSdk(clientId!, getCurrency());
        if (cancelled || !window.paypal || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        const amount = getMessageAmount();

        buttons = window.paypal.Buttons({
          style: {
            shape: "rect",
            layout: "horizontal",
            color: "gold",
            label: "paypal",
            height: compact ? 38 : 42,
            tagline: false,
          },
          message: {
            amount: Number(amount) || 100,
          },
          async createOrder() {
            const response = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cart: [{ id: "donation", quantity: "1" }],
              }),
            });
            const orderData = (await response.json()) as {
              id?: string;
              details?: Array<{
                issue?: string;
                description?: string;
              }>;
              debug_id?: string;
              error?: string;
            };

            if (orderData.id) {
              return orderData.id;
            }

            const errorDetail = orderData.details?.[0];
            const errorMessage = errorDetail
              ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
              : orderData.error || JSON.stringify(orderData);
            throw new Error(errorMessage);
          },
          async onApprove(data: { orderID: string }, actions: {
            restart: () => Promise<void>;
          }) {
            const response = await fetch(
              `/api/orders/${data.orderID}/capture`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              },
            );
            const orderData = (await response.json()) as {
              details?: Array<{
                issue?: string;
                description?: string;
              }>;
              debug_id?: string;
              purchase_units?: Array<{
                payments?: {
                  captures?: Array<{ status?: string; id?: string }>;
                  authorizations?: Array<{ status?: string; id?: string }>;
                };
              }>;
            };

            const errorDetail = orderData.details?.[0];
            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
              return actions.restart();
            }
            if (errorDetail) {
              throw new Error(
                `${errorDetail.description} (${orderData.debug_id})`,
              );
            }
            if (!orderData.purchase_units) {
              throw new Error(JSON.stringify(orderData));
            }

            const transaction =
              orderData.purchase_units?.[0]?.payments?.captures?.[0] ||
              orderData.purchase_units?.[0]?.payments?.authorizations?.[0];
            setStatusMessage(
              `Thank you — payment ${transaction?.status ?? "completed"}.`,
            );
          },
          onError(error: unknown) {
            console.error(error);
            setStatusMessage(
              "Sorry, your transaction could not be processed. Please try again.",
            );
          },
        });

        await buttons.render(containerRef.current);
        if (!cancelled) setSdkReady(true);
      } catch (error) {
        console.error(error);
        if (!cancelled) setFailed(true);
      }
    }

    void mount();

    return () => {
      cancelled = true;
      void buttons?.close?.();
    };
  }, [clientId, compact]);

  if (!clientId || failed) {
    return (
      <a
        href={MAPABLE_DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={className ?? FALLBACK_CLASS}
        aria-label="Donate with PayPal"
      >
        PayPal
      </a>
    );
  }

  return (
    <div className={className ?? "min-w-[9.5rem] max-w-[11rem]"}>
      <div
        id={containerId}
        ref={containerRef}
        aria-label="PayPal donate"
        className={sdkReady ? undefined : "min-h-[42px]"}
      />
      {statusMessage ? (
        <p className="mt-1 text-xs text-slate-600" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
