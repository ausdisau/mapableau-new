import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { SkipToContent } from "@/components/core/SkipToContent";
import { BrandWaveMark } from "@/components/coverage-care/BrandWaveMark";
import { PilotBanner } from "@/components/coverage-care/PilotBanner";
import { coverageCareConfig } from "@/lib/config/coverage-care";
import {
  COVERAGE_CARE_BRAND,
  COVERAGE_CARE_CSS_VARS,
} from "@/lib/coverage-care/brand";
import {
  COVERAGE_CARE_REQUEST_HEADER,
  isCoverageCareHost,
} from "@/lib/coverage-care/host-routing";

const brandStyle = COVERAGE_CARE_CSS_VARS as CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const onHost =
    h.get(COVERAGE_CARE_REQUEST_HEADER) === "1" ||
    isCoverageCareHost(
      h.get("x-forwarded-host"),
      h.get("host"),
      coverageCareConfig.host,
    );

  const metadataBase = onHost
    ? new URL(`https://${coverageCareConfig.host}`)
    : undefined;

  return {
    title: {
      default: COVERAGE_CARE_BRAND.name,
      template: `%s | ${COVERAGE_CARE_BRAND.name}`,
    },
    description: COVERAGE_CARE_BRAND.tagline,
    metadataBase,
    robots: { index: false, follow: false },
  };
}

const nav = [
  { href: "/coverage-care", label: "Home" },
  { href: "/coverage-care/services", label: "Services" },
  { href: "/coverage-care/enquiries", label: "My enquiries" },
  { href: "/coverage-care/provider/inbox", label: "Provider inbox" },
  { href: "/coverage-care/provider/admin", label: "Admin" },
] as const;

export default function CoverageCareLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-[color:var(--cc-cream)] text-[color:var(--cc-ink)]"
      style={brandStyle}
    >
      <SkipToContent />
      <PilotBanner />
      <header className="border-b border-[color:var(--cc-olive)]/15 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/coverage-care"
            className="inline-flex items-center gap-3 rounded-md text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          >
            <BrandWaveMark className="h-10 w-40 text-[color:var(--cc-sage)]" />
            <span>
              <span className="block text-2xl font-semibold tracking-tight">
                {COVERAGE_CARE_BRAND.name}
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
            Powered by MapAble Domain Services. Coverage Care is a proposed
            white-label tenant for controlled pilot review.
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
