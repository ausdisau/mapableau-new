"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { MapAbleBrandLockup } from "@/components/brand/MapAbleBrandLockup";
import { PayPalDonateButton } from "@/components/paypal/PayPalDonateButton";
import { MapAbleHeaderSearchBox } from "@/components/search/MapAbleHeaderSearchBox";
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
      if (event.key !== "Escape") return;
      // Omnibox Escape-to-clear runs first; do not dismiss while draft remains.
      const target = event.target;
      if (
        target instanceof HTMLInputElement &&
        target.id === "mapable-header-search-input" &&
        target.value.trim().length > 0
      ) {
        return;
      }
      onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, onClose, open]);
}

const navLinkClass = `inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`;

const navMegaPanelClass =
  "absolute left-0 top-[calc(100%+0.35rem)] z-[60] w-[min(92vw,22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40";

function MarketingAuthLinks({ compact = false }: { compact?: boolean }) {
  const className = compact ? "flex flex-col gap-2" : "flex items-center gap-3";
  const loginClassName = compact
    ? `min-h-11 rounded-xl border-2 border-[#0C1833] px-4 py-2 text-center text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`
    : `min-h-11 rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`;
  const registerClassName = compact
    ? `min-h-11 rounded-xl bg-[#005B7F] px-4 py-2 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`
    : `min-h-11 rounded-xl bg-[#005B7F] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`;

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

export function MarketingPrimaryNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [megaOpenId, setMegaOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const navGroups = getMarketingNavGroups();

  const anyPanelOpen = mobileOpen || megaOpenId !== null || mobileSearchOpen;
  const dismissAll = () => {
    setMobileOpen(false);
    setMobileSearchOpen(false);
    setMegaOpenId(null);
  };

  useDismissOnOutsideAndEscape(anyPanelOpen, dismissAll, navRef);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const input = document.getElementById(
      "mapable-header-search-input",
    ) as HTMLInputElement | null;
    input?.focus();
  }, [mobileSearchOpen]);

  const preRegisterHref = isHome ? "#pre-register" : "/#pre-register";

  return (
    <div
      ref={navRef}
      className="relative flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 min-[1100px]:flex-nowrap"
    >
      <MapAbleBrandLockup
        href={marketingFeatureRoutes.home}
        size="header"
        className={`min-w-0 shrink overflow-visible hover:bg-slate-50 hover:opacity-100 ${mapableCareFocusRing}`}
        ariaLabel="MapAble home — Empowering Independence"
        onClick={dismissAll}
      />

      <div
        className={cn(
          "min-w-0 min-[1100px]:min-w-[12rem] min-[1100px]:max-w-md min-[1100px]:flex-1 lg:max-w-xl",
          mobileSearchOpen
            ? "order-last w-full basis-full"
            : "hidden min-[1100px]:block",
        )}
      >
        <MapAbleHeaderSearchBox
          id="mapable-header-search"
          compact={mobileSearchOpen}
          onNavigated={dismissAll}
        />
      </div>

      <nav
        aria-label="Primary"
        className="relative hidden items-center justify-center gap-0.5 min-[1100px]:flex"
      >
        <Link
          href={preRegisterHref}
          className={navLinkClass}
          onClick={dismissAll}
        >
          Pre-register
        </Link>
        {navGroups.map((group) => {
          const open = megaOpenId === group.id;
          return (
            <div key={group.id} className="relative">
              <button
                type="button"
                className={`${navLinkClass} ${open ? "bg-slate-50" : ""}`}
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
                  className={navMegaPanelClass}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#005B7F]">
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
                          className={`block rounded-xl px-3 py-2.5 transition hover:bg-[#F6FBFC] ${mapableCareFocusRing}`}
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
      </nav>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:block">
          <AccessibilityPanelTrigger />
        </div>
        <PayPalDonateButton />
        <div className="hidden md:flex">
          <MarketingAuthLinks />
        </div>
        <button
          type="button"
          aria-expanded={mobileSearchOpen}
          aria-controls="mapable-header-search"
          aria-label={mobileSearchOpen ? "Hide search" : "Open search"}
          onClick={() => {
            setMegaOpenId(null);
            setMobileOpen(false);
            setMobileSearchOpen((open) => !open);
          }}
          className={`inline-flex min-h-11 items-center rounded-xl border-2 border-[#005B7F] px-4 text-sm font-black text-[#005B7F] min-[1100px]:hidden ${mapableCareFocusRing}`}
        >
          Search
        </button>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="marketing-primary-nav-mobile"
          onClick={() => {
            setMegaOpenId(null);
            setMobileSearchOpen(false);
            setMobileOpen(!mobileOpen);
          }}
          className={`inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black min-[1100px]:hidden ${mapableCareFocusRing}`}
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div
          id="marketing-primary-nav-mobile"
          className="absolute left-5 right-5 top-[calc(100%+0.5rem)] z-50 max-h-[min(85vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl min-[1100px]:hidden"
        >
          <nav aria-label="Primary mobile" className="grid gap-1">
            <button
              type="button"
              className={`min-h-11 rounded-xl px-4 py-3 text-left text-sm font-black text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
              onClick={() => {
                setMobileOpen(false);
                setMobileSearchOpen(true);
                window.requestAnimationFrame(() => {
                  document
                    .getElementById("mapable-header-search-input")
                    ?.focus();
                });
              }}
            >
              Search MapAble
            </button>
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
                  className="px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#005B7F]"
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
            <div className="px-1 py-1">
              <AccessibilityPanelTrigger className="w-full justify-start" />
            </div>
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <MarketingAuthLinks compact />
          </div>
        </div>
      )}
    </div>
  );
}
