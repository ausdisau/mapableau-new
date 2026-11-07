"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { MapAbleBrandLockup } from "@/components/brand/MapAbleBrandLockup";
import { PayPalDonateButton } from "@/components/paypal/PayPalDonateButton";
import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import { MAPABLE_CARE_COMBINED_PHONE } from "@/lib/marketing/mapable-care-combined-data";
import { marketingFeatureRoutes } from "@/lib/marketing/mapable-care-routes";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

function useDismissOnOutsideAndEscape(
  open: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, onClose, open]);
}

const utilityOutlineClass = `inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#0C1833] px-4 text-sm font-black text-[#0C1833] transition hover:bg-[#F7F8FC] ${mapableCareFocusRing}`;

function MarketingAuthLinks({ compact = false }: { compact?: boolean }) {
  const className = compact ? "flex flex-col gap-2" : "flex items-center gap-2";
  const loginClassName = compact
    ? `min-h-11 rounded-full border-2 border-[#0C1833] px-4 py-2 text-center text-sm font-black transition hover:bg-[#F7F8FC] ${mapableCareFocusRing}`
    : `min-h-11 rounded-full border-2 border-[#0C1833] px-4 py-2.5 text-sm font-black transition hover:bg-[#F7F8FC] ${mapableCareFocusRing}`;
  const registerClassName = compact
    ? `min-h-11 rounded-full bg-[#F26A21] px-4 py-2 text-center text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#D45512] ${mapableCareFocusRing}`
    : `min-h-11 rounded-full bg-[#F26A21] px-5 py-2.5 text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#D45512] ${mapableCareFocusRing}`;

  return (
    <div className={className}>
      <Link href={marketingFeatureRoutes.login} className={loginClassName}>
        Log in
      </Link>
      <Link
        href={marketingFeatureRoutes.register}
        className={registerClassName}
      >
        Get started
      </Link>
    </div>
  );
}

/**
 * DPO-inspired chrome (PWD / BCA / PDA / AFDO):
 * contact utility strip → brand/actions row → solid primary nav band.
 */
export function MarketingPrimaryNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideAndEscape(mobileOpen, () => setMobileOpen(false), navRef);

  const primaryLinks = [
    {
      label: "Pre-register",
      href: isHome ? "#pre-register" : "/#pre-register",
    },
    { label: "Places", href: "/accessibility-map" },
    ...(process.env.NEXT_PUBLIC_MAPABLE_PLACES_PROTOTYPE_ENABLED === "true"
      ? [{ label: "Places Lab", href: "/places" }]
      : []),
    { label: "Guides", href: "/guides" },
    { label: "Transport", href: "/transport" },
    { label: "Providers", href: "/providers" },
    { label: "NDIS Guidance", href: marketingFeatureRoutes.ask },
  ];

  const navLinkClass = `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-white/95 transition hover:bg-white/10 ${mapableCareFocusRing}`;
  const phoneHref = `tel:${MAPABLE_CARE_COMBINED_PHONE.replace(/\s+/g, "")}`;

  return (
    <div ref={navRef} className="relative w-full">
      {/* PWD/BCA-style contact utility strip */}
      <div className="hidden border-b border-white/10 bg-[#0C1833] text-white md:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs font-semibold sm:px-5 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={phoneHref}
              className={`rounded-md text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              {MAPABLE_CARE_COMBINED_PHONE}
            </a>
            <a
              href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
              className={`rounded-md text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              {MAPABLE_SUPPORT_EMAIL}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/contact"
              className={`rounded-md text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              Contact us
            </Link>
            <Link
              href="/accessibility-statement"
              className={`rounded-md text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>

      {/* Brand + actions */}
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
        <MapAbleBrandLockup
          href={marketingFeatureRoutes.home}
          size="header"
          className={`min-w-0 shrink overflow-visible hover:bg-slate-50 hover:opacity-100 ${mapableCareFocusRing}`}
          ariaLabel="MapAble home"
          onClick={() => setMobileOpen(false)}
        />

        <div className="flex items-center gap-2 md:gap-3">
          <PayPalDonateButton />
          <Link
            href="/contact"
            className={`${utilityOutlineClass} hidden sm:inline-flex`}
          >
            Contact
          </Link>
          <div className="hidden lg:block">
            <AccessibilityPanelTrigger />
          </div>
          <div className="hidden md:flex">
            <MarketingAuthLinks />
          </div>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="marketing-primary-nav-mobile"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`inline-flex min-h-11 items-center rounded-full border-2 border-[#0C1833] px-4 text-sm font-black md:hidden ${mapableCareFocusRing}`}
          >
            Menu
          </button>
        </div>
      </div>

      {/* Solid primary nav band */}
      <nav
        aria-label="Primary"
        className="hidden border-t border-[#0C1833]/10 bg-[#0C1833] md:block"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1 sm:px-5 lg:px-8">
          {primaryLinks.map((link) => (
            <Link key={link.label} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {mobileOpen ? (
        <div
          id="marketing-primary-nav-mobile"
          className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden"
        >
          <nav aria-label="Primary mobile" className="grid gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`min-h-11 rounded-xl px-4 py-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={`min-h-11 rounded-xl px-4 py-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
            <a
              href={phoneHref}
              className={`min-h-11 rounded-xl px-4 py-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              {MAPABLE_CARE_COMBINED_PHONE}
            </a>
            <div className="px-1 py-1">
              <AccessibilityPanelTrigger className="w-full justify-start" />
            </div>
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <MarketingAuthLinks compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
