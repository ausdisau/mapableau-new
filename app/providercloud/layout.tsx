import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MapAbleBrandMark } from "@/components/brand/MapAbleBrandLockup";
import { SkipToContent } from "@/components/core/SkipToContent";
import { MAPABLE_MARKETING_URL } from "@/lib/brand/constants";

export const metadata: Metadata = {
  title: {
    default: "ProviderCloud",
    template: "%s | ProviderCloud",
  },
  description:
    "MapAble ProviderCloud — hosted provider operations surface. Read-only attention, no premium listings, supplier operations disabled.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProviderCloudLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#071727] text-white">
      <SkipToContent />
      <header className="border-b border-white/10 bg-[#071727]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/providercloud"
            className="inline-flex items-center gap-3 rounded-xl bg-white px-3 py-2 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            <MapAbleBrandMark size="header" />
            <span className="sr-only">ProviderCloud home</span>
          </Link>
          <nav aria-label="ProviderCloud">
            <ul className="flex items-center gap-2 text-sm font-bold sm:gap-4">
              <li>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-white/85 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href={MAPABLE_MARKETING_URL}
                  className="rounded-lg border border-white/20 px-3 py-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                >
                  Main MapAble
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-white/10 px-4 py-8 text-sm text-white/65 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            ProviderCloud is a hosted operations surface. It is not a premium
            listing product. Supplier operations stay disabled.
          </p>
          <Link
            href={MAPABLE_MARKETING_URL}
            className="font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Return to MapAble
          </Link>
        </div>
      </footer>
    </div>
  );
}
