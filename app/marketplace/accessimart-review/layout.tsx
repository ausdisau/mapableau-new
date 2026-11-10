import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import {
  accessiMartReviewGateFromEnvironment,
  canAccessAccessiMartReview,
} from "@/lib/marketplace/accessimart-review-access";

/**
 * AccessiMart-by-MapAble review storefront.
 * Independent of MAPABLE_MARKETPLACE_ENABLED and MapAble PR #10 alpha flags.
 */
export default async function AccessiMartReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const gate = accessiMartReviewGateFromEnvironment();
  if (
    !canAccessAccessiMartReview(
      { id: user.id, primaryRole: user.primaryRole },
      gate,
    )
  ) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[#0C1833]">
      <a
        href="#accessimart-review-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:ring-4 focus:ring-amber-300"
      >
        Skip to main content
      </a>
      <header className="border-b border-slate-200 bg-[#F6FBFC]">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4"
          aria-label="AccessiMart review navigation"
        >
          <Link
            href="/marketplace/accessimart-review"
            className="font-black text-[#005B7F] underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-amber-300"
          >
            AccessiMart by MapAble (review)
          </Link>
          <Link
            href="/marketplace"
            className="text-sm font-semibold underline underline-offset-4 focus:outline-none focus:ring-4 focus:ring-amber-300"
          >
            Marketplace programme
          </Link>
          <Link
            href="/ecosystem"
            className="ml-auto text-sm font-semibold underline underline-offset-4 focus:outline-none focus:ring-4 focus:ring-amber-300"
          >
            MapAble ecosystem
          </Link>
        </nav>
      </header>
      <main
        id="accessimart-review-main"
        className="mx-auto max-w-6xl px-4 py-8"
      >
        {children}
      </main>
    </div>
  );
}
