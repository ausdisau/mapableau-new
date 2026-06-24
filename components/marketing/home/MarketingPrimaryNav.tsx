"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/marketing/mapable-care-shared";
import { MAPABLE_DONATION_URL } from "@/lib/brand/constants";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { marketingFeatureRoutes } from "@/lib/marketing/mapable-care-routes";

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
  const [pending, setPending] = useState(false);
  const className = compact
    ? `inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F8C51C] px-4 py-2 text-center text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#e6b019] disabled:cursor-wait disabled:opacity-80 ${mapableCareFocusRing}`
    : `inline-flex min-h-11 items-center rounded-xl bg-[#F8C51C] px-4 py-3 text-sm font-black text-[#0C1833] shadow-sm transition hover:bg-[#e6b019] disabled:cursor-wait disabled:opacity-80 md:px-5 ${mapableCareFocusRing}`;

  async function handleDonate() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        checkoutUrl?: string;
        fallbackUrl?: string;
      };
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      const fallback = data.fallbackUrl ?? MAPABLE_DONATION_URL;
      window.open(fallback, "_blank", "noopener,noreferrer");
    } catch {
      window.open(MAPABLE_DONATION_URL, "_blank", "noopener,noreferrer");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDonate}
      disabled={pending}
      aria-busy={pending}
      className={className}
    >
      {pending ? "Donate…" : "Donate"}
    </button>
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
  useDismissOnOutsideAndEscape(mobileOpen, () => setMobileOpen(false), navRef);

  const searchHref = isHome ? "#guided-search-panel" : marketingFeatureRoutes.providerFinder;

  const primaryLinks = [
    { label: "Search", href: searchHref },
    { label: "Explore", href: isHome ? "#explore" : `${marketingFeatureRoutes.home}#explore` },
    { label: "Providers", href: marketingFeatureRoutes.providerFinder },
    { label: "NDIS Guidance", href: marketingFeatureRoutes.ask },
  ];

  return (
    <div ref={navRef} className="relative flex w-full items-center justify-between gap-4">
      <Link
        href={marketingFeatureRoutes.home}
        className={`shrink-0 overflow-visible rounded-2xl p-1 transition hover:bg-slate-50 ${mapableCareFocusRing}`}
        onClick={() => setMobileOpen(false)}
      >
        <span className="sr-only">MapAble home</span>
        <LogoMark />
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {primaryLinks.map((link) => (
          <Link key={link.label} href={link.href} className={navLinkClass}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 md:gap-3">
        <DonateHeaderLink />
        <div className="hidden md:flex">
          <MarketingAuthLinks />
        </div>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="marketing-primary-nav-mobile"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black md:hidden ${mapableCareFocusRing}`}
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div
          id="marketing-primary-nav-mobile"
          className="absolute left-5 right-5 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden"
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
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <MarketingAuthLinks compact />
          </div>
        </div>
      )}
    </div>
  );
}
