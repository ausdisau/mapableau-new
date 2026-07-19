"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { LogoMark } from "@/components/marketing/mapable-care-shared";
import { MAPABLE_DONATION_URL } from "@/lib/brand/constants";
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

const navLinkClass =
  `inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`;

function DonateHeaderLink({ compact = false }: { compact?: boolean }) {
  const className = compact
    ? `inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F8C51C] px-4 py-2 text-center text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#e6b019] ${mapableCareFocusRing}`
    : `inline-flex min-h-11 items-center rounded-xl bg-[#F8C51C] px-4 py-3 text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#e6b019] md:px-5 ${mapableCareFocusRing}`;

  return (
    <a
      href={MAPABLE_DONATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      Donate
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

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
      <Link href={marketingFeatureRoutes.register} className={registerClassName}>
        Get started
      </Link>
    </div>
  );
}

export function MarketingPrimaryNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const menuId = useId();
  const wasOpenRef = useRef(false);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useDismissOnOutsideAndEscape(mobileOpen, closeMobile, navRef);

  useEffect(() => {
    if (mobileOpen && !wasOpenRef.current) {
      firstMobileLinkRef.current?.focus();
    }
    if (!mobileOpen && wasOpenRef.current) {
      menuButtonRef.current?.focus();
    }
    wasOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  const searchHref = isHome ? "#guided-search-panel" : marketingFeatureRoutes.providerFinder;

  const primaryLinks = [
    { label: "Search", href: searchHref },
    { label: "Places", href: isHome ? "#map-preview" : "/accessibility-map" },
    { label: "Providers", href: "/providers" },
    { label: "NDIS Guidance", href: marketingFeatureRoutes.ask },
  ];

  return (
    <div ref={navRef} className="relative flex w-full items-center justify-between gap-4">
      <Link
        href={marketingFeatureRoutes.home}
        aria-label="MapAble home"
        className={`shrink-0 overflow-visible rounded-2xl p-1 transition hover:bg-slate-50 ${mapableCareFocusRing}`}
        onClick={() => setMobileOpen(false)}
      >
        <LogoMark decorative />
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {primaryLinks.map((link) => (
          <Link key={link.label} href={link.href} className={navLinkClass}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:block">
          <AccessibilityPanelTrigger />
        </div>
        <DonateHeaderLink />
        <div className="hidden md:flex">
          <MarketingAuthLinks />
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={menuId}
          onClick={() => setMobileOpen((open) => !open)}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black md:hidden ${mapableCareFocusRing}`}
        >
          Menu
        </button>
      </div>

      {mobileOpen ? (
        <div
          id={menuId}
          className="absolute left-5 right-5 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden"
        >
          <nav aria-label="Primary mobile" className="grid gap-1">
            {primaryLinks.map((link, index) => (
              <Link
                key={link.label}
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={link.href}
                className={`flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
                onClick={closeMobile}
              >
                {link.label}
              </Link>
            ))}
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
