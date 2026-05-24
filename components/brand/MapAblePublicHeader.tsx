"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  MAPABLE_MARKETING_NAV,
  MAPABLE_MARKETING_UTILITY_LINKS,
  type MapAbleMarketingNavItem,
} from "@/lib/brand/marketing-nav";
import { MAPABLE_LOGO_ALT, MAPABLE_LOGO_SRC } from "@/lib/brand/constants";

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M5.5 7.5 10 12l4.5-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.6 9h16.8M3.6 15h16.8M12 3c2.3 2.4 3.4 5.4 3.4 9S14.3 18.6 12 21M12 3C9.7 5.4 8.6 8.4 8.6 12s1.1 6.6 3.4 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7">
      {open ? (
        <path
          d="M6 6l12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

const focusRing =
  "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/60";

export function MapAblePublicHeader({
  logoHref = "/",
  navItems = MAPABLE_MARKETING_NAV,
}: {
  logoHref?: string;
  navItems?: MapAbleMarketingNavItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur">
      <Link
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-[#005B7F] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </Link>

      <div className="mx-auto flex min-h-[92px] max-w-7xl items-center justify-between gap-8 px-5 sm:px-8 lg:px-10">
        <Link
          href={logoHref}
          aria-label="MapAble home"
          className={`flex min-w-fit items-center gap-3 rounded-2xl ${focusRing}`}
        >
          <Image
            src={MAPABLE_LOGO_SRC}
            alt={MAPABLE_LOGO_ALT}
            width={280}
            height={140}
            className="h-16 w-auto object-contain sm:h-20"
            priority
            unoptimized
          />
        </Link>

        <nav aria-label="Primary navigation" className="hidden flex-1 lg:block">
          <ul className="flex items-center justify-center gap-8 xl:gap-10">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`group inline-flex items-center gap-2 rounded-xl px-1 py-3 text-[15px] font-bold tracking-[-0.01em] text-[#0C1833] transition hover:text-[#005B7F] ${focusRing}`}
                  aria-haspopup={item.hasDropdown ? "true" : undefined}
                >
                  {item.label}
                  {item.hasDropdown ? (
                    <ChevronDownIcon className="h-4 w-4 transition group-hover:translate-y-0.5" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden min-w-fit items-end gap-4 lg:flex">
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
              {MAPABLE_MARKETING_UTILITY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg transition hover:text-[#005B7F] ${focusRing}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/core"
                aria-label="Language and region"
                className={`rounded-lg text-slate-700 transition hover:text-[#005B7F] ${focusRing}`}
              >
                <GlobeIcon className="h-5 w-5" />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={`inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[#0C1833] px-6 text-base font-bold text-[#0C1833] transition hover:bg-slate-50 ${focusRing}`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#005B7F] px-7 text-base font-extrabold text-white shadow-sm transition hover:bg-[#004766] ${focusRing}`}
              >
                Get started
                <ChevronDownIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-controls="mobile-menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
          className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border-2 border-[#0C1833] text-[#0C1833] transition hover:bg-slate-50 lg:hidden ${focusRing}`}
        >
          <span className="sr-only">
            {mobileOpen ? "Close main menu" : "Open main menu"}
          </span>
          <MenuIcon open={mobileOpen} />
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-slate-200 bg-white px-5 py-5 shadow-lg lg:hidden"
        >
          <nav aria-label="Mobile primary navigation">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex min-h-12 items-center justify-between rounded-xl px-3 text-base font-bold text-[#0C1833] transition hover:bg-slate-50 ${focusRing}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                    {item.hasDropdown ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center gap-4 px-1 text-sm font-semibold text-slate-600">
              {MAPABLE_MARKETING_UTILITY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg hover:text-[#005B7F] ${focusRing}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/core"
                aria-label="Language and region"
                className={`rounded-lg hover:text-[#005B7F] ${focusRing}`}
                onClick={() => setMobileOpen(false)}
              >
                <GlobeIcon className="h-5 w-5" />
              </Link>
            </div>
            <Link
              href="/login"
              className={`inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[#0C1833] px-6 text-base font-bold text-[#0C1833] transition hover:bg-slate-50 ${focusRing}`}
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#005B7F] px-7 text-base font-extrabold text-white transition hover:bg-[#004766] ${focusRing}`}
              onClick={() => setMobileOpen(false)}
            >
              Get started
              <ChevronDownIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
