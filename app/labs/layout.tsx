import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { SkipToContent } from "@/components/core/SkipToContent";
import { LogoMark } from "@/components/marketing/mapable-care-shared";

export const metadata: Metadata = {
  title: {
    default: "MapAble Labs",
    template: "%s | MapAble Labs",
  },
  description:
    "Public experiments, simulations and co-design prototypes exploring the future of accessibility, mobility and personal agency.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#071727] text-white">
      <SkipToContent />
      <header className="border-b border-white/10 bg-[#071727]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/labs"
            className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            <span className="rounded-xl bg-white p-2">
              <LogoMark compact />
            </span>
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-[#F8C51C]">
                MapAble
              </span>
              <span className="block text-xl font-black tracking-tight">Labs</span>
            </span>
          </Link>
          <nav aria-label="MapAble Labs">
            <ul className="flex items-center gap-2 text-sm font-bold sm:gap-4">
              <li>
                <Link
                  href="/labs"
                  className="rounded-lg px-3 py-2 text-white/85 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                >
                  Experiments
                </Link>
              </li>
              <li>
                <Link
                  href="https://mapable.com.au"
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
          <p>MapAble Labs experiments are prototypes and simulations, not live assistive systems.</p>
          <Link
            href="https://mapable.com.au"
            className="font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Return to MapAble
          </Link>
        </div>
      </footer>
    </div>
  );
}
