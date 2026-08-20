"use client";

import { useEffect, useRef } from "react";

import { SponsoredDisclosure } from "@/components/ads/mapable/SponsoredDisclosure";
import type { ExternalAdContext } from "@/lib/ads/types";

type ExternalAdSlotProps = {
  provider: "google_ad_manager" | "ethicalads";
  slotKey: string;
  externalContext: ExternalAdContext;
  /** Called when the slot should be considered no-fill (timeout / script fail). */
  onNoFill?: () => void;
  timeoutMs?: number;
};

/**
 * Controlled DOM slot for external networks.
 * Does not block map/finder rendering; times out to no-fill.
 */
export function ExternalAdSlot({
  provider,
  slotKey,
  externalContext,
  onNoFill,
  timeoutMs = 1500,
}: ExternalAdSlotProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const filledRef = useRef(false);

  useEffect(() => {
    filledRef.current = false;
    const timer = window.setTimeout(() => {
      if (!filledRef.current) {
        onNoFill?.();
      }
    }, timeoutMs);

    // Foundation: do not load third-party scripts unless flags are on at build/runtime
    // Callers only mount this when an external fill was returned (flags already gated).
    if (provider === "ethicalads" && elRef.current) {
      elRef.current.setAttribute("data-ea-publisher", slotKey.split(":")[1] ?? "");
      elRef.current.setAttribute("data-ea-type", "image");
      elRef.current.setAttribute("data-ea-manual", "true");
      const keywords = [
        externalContext.surface,
        externalContext.category,
        externalContext.regionCode,
      ]
        .filter(Boolean)
        .join(",");
      if (keywords) {
        elRef.current.setAttribute("data-ea-keywords", keywords);
      }
    }

    if (provider === "google_ad_manager" && elRef.current) {
      elRef.current.id = `gam-slot-${slotKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      elRef.current.setAttribute("data-gam-unit", slotKey);
      // Targeting keys must already be sanitised ExternalAdContext only
      elRef.current.setAttribute(
        "data-gam-context",
        JSON.stringify(externalContext),
      );
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, [provider, slotKey, externalContext, onNoFill, timeoutMs]);

  return (
    <div
      className="border-t border-border p-3"
      data-ads-kind="external-slot"
      data-ads-provider={provider}
    >
      <SponsoredDisclosure />
      <div ref={elRef} className="min-h-[50px]" aria-live="polite" />
    </div>
  );
}
