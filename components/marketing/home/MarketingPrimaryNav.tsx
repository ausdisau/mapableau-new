"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useId, useRef, useState } from "react";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { MapAbleBrandLockup } from "@/components/brand/MapAbleBrandLockup";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { marketingFeatureRoutes } from "@/lib/marketing/mapable-care-routes";
import {
  mapableCareCtaClass,
  mapableCareFocusRing,
  mapableCareOutlineCtaClass,
} from "@/lib/marketing/mapable-care-tokens";

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

const navLinkClass = `inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-black text-mapable-text transition hover:bg-mapable-surface-blue ${mapableCareFocusRing}`;

const exploreItems = [
  {
    label: "Accessibility map",
    href: "/accessibility-map",
    description: "Evidence-based access notes for places.",
  },
  {
    label: "NDIS Guidance",
    href: marketingFeatureRoutes.ask,
    description: "Informational support — not NDIA claim submission.",
  },
] as const;

const primaryLinks = [
  { label: "Care", href: "/care" },
  { label: "Transport", href: "/transport" },
  { label: "Jobs", href: "/employment" },
  { label: "Providers", href: "/providers" },
] as const;

function MarketingAuthLinks({ compact = false }: { compact?: boolean }) {
  const className = compact ? "flex flex-col gap-2" : "flex items-center gap-3";
  const loginClassName = compact
    ? `${mapableCareOutlineCtaClass} min-h-12 w-full`
    : mapableCareOutlineCtaClass;
  const registerClassName = compact
    ? `${mapableCareCtaClass} w-full`
    : mapableCareCtaClass;

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

function ExploreMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useDismissOnOutsideAndEscape(open, () => setOpen(false), containerRef);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={navLinkClass}
      >
        Explore
      </button>
      {open ? (
        <div
          id={menuId}
          className="absolute left-0 top-[calc(100%+0.35rem)] z-50 w-72 rounded-2xl border border-mapable-border bg-white p-2 shadow-lg"
        >
          <ul>
            {exploreItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 ${mapableCareFocusRing}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="block text-sm font-black text-mapable-text">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-mapable-text-muted">
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
}

export function MarketingPrimaryNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, mobileOpen);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <MapAbleBrandLockup
        href={pathname === "/" ? "/" : marketingFeatureRoutes.home}
        size="header"
        className={`min-w-0 shrink overflow-visible hover:bg-mapable-surface-blue hover:opacity-100 ${mapableCareFocusRing}`}
        ariaLabel="MapAble home"
        onClick={() => setMobileOpen(false)}
      />

      <nav
        aria-label="Primary"
        className="hidden items-center justify-center gap-1 lg:flex"
      >
        <ExploreMenu />
        {primaryLinks.map((link) => (
          <Link key={link.label} href={link.href} className={navLinkClass}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center justify-end gap-2">
        <AccessibilityPanelTrigger />
        <div className="hidden lg:flex">
          <MarketingAuthLinks />
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="marketing-primary-nav-mobile"
          onClick={() => setMobileOpen((value) => !value)}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-mapable-primary px-4 text-sm font-black text-mapable-primary lg:hidden ${mapableCareFocusRing}`}
        >
          Menu
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-mapable-navy/40"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <div
            ref={dialogRef}
            id="marketing-primary-nav-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-mapable-border bg-white p-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-mapable-text">Menu</p>
              <button
                type="button"
                onClick={closeMobile}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-mapable-primary px-4 text-sm font-black text-mapable-primary ${mapableCareFocusRing}`}
              >
                Close
              </button>
            </div>
            <nav aria-label="Primary mobile" className="mt-4 grid gap-1">
              <p className="px-4 pt-2 text-xs font-black uppercase tracking-[0.14em] text-mapable-primary">
                Explore
              </p>
              {exploreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black text-mapable-text hover:bg-mapable-surface-blue ${mapableCareFocusRing}`}
                  onClick={closeMobile}
                >
                  {item.label}
                </Link>
              ))}
              {primaryLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black text-mapable-text hover:bg-mapable-surface-blue ${mapableCareFocusRing}`}
                  onClick={closeMobile}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={pathname === "/" ? "#pre-register" : "/#pre-register"}
                className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black text-mapable-text hover:bg-mapable-surface-blue ${mapableCareFocusRing}`}
                onClick={closeMobile}
              >
                Pre-register interest
              </Link>
            </nav>
            <div className="mt-4 border-t border-mapable-border pt-4">
              <MarketingAuthLinks compact />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
