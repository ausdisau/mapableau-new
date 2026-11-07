"use client";

import { ChevronDown } from "lucide-react";
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
import { getMarketingNavGroups } from "@/lib/marketing/site-navigation";

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

const primaryBandLinkClass = `inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-white/95 transition hover:bg-white/10 ${mapableCareFocusRing}`;

const navMegaPanelClass =
  "absolute left-0 top-[calc(100%+0.35rem)] z-[60] w-[min(92vw,22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40";

function MarketingAuthLinks({ compact = false }: { compact?: boolean }) {
  const className = compact ? "flex flex-col gap-2" : "flex items-center gap-2";
  const loginClassName = compact
    ? `min-h-11 rounded-full border-2 border-[#0C1833] px-4 py-2 text-center text-sm font-black transition hover:bg-[#F7F8FC] ${mapableCareFocusRing}`
    : `min-h-11 rounded-full border-2 border-[#0C1833] px-4 py-2.5 text-sm font-black transition hover:bg-[#F7F8FC] ${mapableCareFocusRing}`;
  const registerClassName = compact
    ? `min-h-11 rounded-full bg-[#F26A21] px-4 py-2 text-center text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#FF8140] ${mapableCareFocusRing}`
    : `min-h-11 rounded-full bg-[#F26A21] px-5 py-2.5 text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#FF8140] ${mapableCareFocusRing}`;

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
 * contact utility strip → brand/actions row → solid primary nav band with megamenus.
 */
export function MarketingPrimaryNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpenId, setMegaOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const navGroups = getMarketingNavGroups();

  const anyPanelOpen = mobileOpen || megaOpenId !== null;
  const dismissAll = () => {
    setMobileOpen(false);
    setMegaOpenId(null);
  };

  useDismissOnOutsideAndEscape(anyPanelOpen, dismissAll, navRef);

  const preRegisterHref = isHome ? "#pre-register" : "/#pre-register";
  const phoneHref = `tel:${MAPABLE_CARE_COMBINED_PHONE.replace(/\s+/g, "")}`;

  return (
    <div ref={navRef} className="relative w-full">
      {/* PWD/BCA-style contact utility strip */}
      <div className="hidden border-b border-white/10 bg-[#0C1833] text-white md:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs font-semibold sm:px-5 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={phoneHref}
              className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              {MAPABLE_CARE_COMBINED_PHONE}
            </a>
            <a
              href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
              className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              {MAPABLE_SUPPORT_EMAIL}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/contact"
              className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              Contact us
            </Link>
            <Link
              href="/accessibility-statement"
              className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
            >
              Accessibility statement
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
          ariaLabel="MapAble home — Empowering Independence"
          onClick={dismissAll}
        />

        <div className="flex items-center gap-2 md:gap-3">
          <PayPalDonateButton />
          <Link
            href="/contact"
            className={`${utilityOutlineClass} hidden sm:inline-flex`}
          >
            Contact
          </Link>
          <div className="hidden md:block">
            <AccessibilityPanelTrigger />
          </div>
          <div className="hidden md:flex">
            <MarketingAuthLinks />
          </div>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="marketing-primary-nav-mobile"
            onClick={() => {
              setMegaOpenId(null);
              setMobileOpen(!mobileOpen);
            }}
            className={`inline-flex min-h-11 items-center rounded-full border-2 border-[#0C1833] px-4 text-sm font-black min-[920px]:hidden ${mapableCareFocusRing}`}
          >
            Menu
          </button>
        </div>
      </div>

      {/* Solid primary nav band with grouped megamenus.
          Avoid overflow-x-auto here: it creates a scrollport that clips
          absolutely positioned megamenus below the short band. */}
      <nav
        aria-label="Primary"
        className="relative z-40 hidden overflow-visible border-t border-[#0C1833]/10 bg-[#0C1833] min-[920px]:block"
      >
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-1 overflow-visible px-4 py-1 sm:px-5 lg:px-8">
          <Link
            href={preRegisterHref}
            className={primaryBandLinkClass}
            onClick={dismissAll}
          >
            Pre-register
          </Link>
          {navGroups.map((group) => {
            const open = megaOpenId === group.id;
            return (
              <div key={group.id} className="relative overflow-visible">
                <button
                  type="button"
                  className={`${primaryBandLinkClass} ${open ? "bg-white/15" : ""}`}
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls={`marketing-mega-${group.id}`}
                  onClick={() => {
                    setMobileOpen(false);
                    setMegaOpenId(open ? null : group.id);
                  }}
                >
                  {group.label}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <div
                    id={`marketing-mega-${group.id}`}
                    role="region"
                    aria-label={group.label}
                    className={`${navMegaPanelClass} z-[70]`}
                  >
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3B5BDB]">
                      {group.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {group.description}
                    </p>
                    <ul className="mt-3 max-h-[min(70vh,24rem)] space-y-0.5 overflow-y-auto pr-1">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-label={item.label}
                            className={`block rounded-xl px-3 py-2.5 transition hover:bg-[#F7F8FC] ${mapableCareFocusRing}`}
                            onClick={dismissAll}
                          >
                            <span className="block text-sm font-black text-[#0C1833]">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium leading-snug text-slate-500">
                              {item.description}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>

      {mobileOpen ? (
        <div
          id="marketing-primary-nav-mobile"
          className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-50 max-h-[min(85vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl min-[920px]:hidden"
        >
          <nav aria-label="Primary mobile" className="grid gap-1">
            <Link
              href={preRegisterHref}
              className={`min-h-11 rounded-xl px-4 py-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
              onClick={dismissAll}
            >
              Pre-register
            </Link>
            {navGroups.map((group) => (
              <section
                key={group.id}
                className="mt-2 border-t border-slate-100 pt-3 first:mt-0 first:border-t-0 first:pt-0"
                aria-labelledby={`mobile-nav-${group.id}`}
              >
                <h3
                  id={`mobile-nav-${group.id}`}
                  className="px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#3B5BDB]"
                >
                  {group.label}
                </h3>
                <ul className="mt-1 grid gap-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-label={item.label}
                        className={`block min-h-11 rounded-xl px-4 py-2.5 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
                        onClick={dismissAll}
                      >
                        {item.label}
                        <span className="mt-0.5 block text-[11px] font-medium leading-snug text-slate-500">
                          {item.description}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <Link
              href="/contact"
              className={`min-h-11 rounded-xl px-4 py-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
              onClick={dismissAll}
            >
              Contact
            </Link>
            <Link
              href="/accessibility-statement"
              className={`min-h-11 rounded-xl px-4 py-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
              onClick={dismissAll}
            >
              Accessibility statement
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
