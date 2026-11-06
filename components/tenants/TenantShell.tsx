import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { SkipToContent } from "@/components/core/SkipToContent";
import { BrandWaveMark } from "@/components/coverage-care/BrandWaveMark";
import {
  COVERAGE_CARE_BRAND,
  COVERAGE_CARE_CSS_VARS,
} from "@/lib/tenancy/coverage-care-brand";
import { getTenantPreviewGate } from "@/lib/tenancy/tenant-preview-policy";

const brandStyle = COVERAGE_CARE_CSS_VARS as CSSProperties;

export function TenantShell({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const base = `/t/${slug}`;
  const gate = getTenantPreviewGate();
  const nav = [
    { href: base, label: "Home" },
    { href: `${base}/about`, label: "About" },
    { href: `${base}/services`, label: "Services" },
    { href: `${base}/enquire`, label: "Enquire" },
    { href: `${base}/portal`, label: "My enquiries" },
    { href: `${base}/admin`, label: "Admin" },
    { href: `${base}/contact`, label: "Contact" },
    { href: `${base}/privacy`, label: "Privacy" },
  ] as const;

  return (
    <div
      className="min-h-screen bg-[color:var(--cc-cream)] text-[color:var(--cc-ink)]"
      style={brandStyle}
    >
      <SkipToContent />
      <aside
        className="border-b border-[color:var(--cc-olive)]/20 bg-[color:var(--cc-olive)] text-[color:var(--cc-cream)]"
        aria-label="Pilot notice"
      >
        <p className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
          {gate.syntheticBanner}. No live bookings, NDIA submissions, payments,
          or verified NDIS registration claims. ABN {COVERAGE_CARE_BRAND.abn}{" "}
          (supplied; registration not verified in this preview).
        </p>
      </aside>
      <header className="border-b border-[color:var(--cc-olive)]/15 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href={base}
            className="inline-flex items-center gap-3 rounded-md text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          >
            <BrandWaveMark className="h-10 w-40 text-[color:var(--cc-sage)]" />
            <span>
              <span className="block text-2xl font-semibold tracking-tight">
                <span style={{ color: COVERAGE_CARE_BRAND.colors.sage }}>
                  Coverage
                </span>{" "}
                <span style={{ color: COVERAGE_CARE_BRAND.colors.olive }}>
                  Care
                </span>
              </span>
              <span className="block text-sm text-[color:var(--cc-ink)]/70">
                {COVERAGE_CARE_BRAND.tagline}
              </span>
            </span>
          </Link>
          <nav aria-label="Coverage Care">
            <ul className="flex flex-wrap gap-1 text-sm font-medium">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-md px-3 py-2 hover:bg-[color:var(--cc-sage)]/15 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="mt-12 border-t border-[color:var(--cc-olive)]/15 px-4 py-8 text-sm text-[color:var(--cc-ink)]/70 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {COVERAGE_CARE_BRAND.poweredBy} Domain Services. Coverage Care is a
            proposed white-label tenant for controlled pilot review.
          </p>
          <Link
            href="https://mapable.com.au"
            className="font-semibold text-[color:var(--cc-olive)] underline underline-offset-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          >
            MapAble home
          </Link>
        </div>
      </footer>
    </div>
  );
}
