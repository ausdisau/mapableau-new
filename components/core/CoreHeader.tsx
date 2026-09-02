"use client";

import type { ComponentProps, ReactNode } from "react";

import { MapAbleSiteHeader } from "@/components/brand/MapAbleSiteHeader";
import { PayPalDonateButton } from "@/components/paypal/PayPalDonateButton";

type MapAbleSiteHeaderProps = ComponentProps<typeof MapAbleSiteHeader>;

type CoreHeaderProps = Omit<MapAbleSiteHeaderProps, "externalCta"> & {
  /**
   * When true (default), show the PayPal Standard Checkout button in the header
   * actions instead of a Donate link / external CTA.
   */
  showPayPal?: boolean;
  /** Extra actions rendered after the PayPal button. */
  actions?: ReactNode;
};

/**
 * Core platform header — PayPal Standard Checkout replaces the Donate CTA.
 * Based on PayPal OSM HTML/JS sample (`standard/client/html`).
 */
export function CoreHeader({
  showPayPal = true,
  actions,
  ...props
}: CoreHeaderProps) {
  const headerActions =
    showPayPal || actions ? (
      <div className="flex items-center gap-2">
        {showPayPal ? <PayPalDonateButton compact /> : null}
        {actions}
      </div>
    ) : undefined;

  return <MapAbleSiteHeader {...props} actions={headerActions} />;
}
