import Link from "next/link";

import { CoreFooter } from "@/components/core/CoreFooter";
import { SkipToContent } from "@/components/core/SkipToContent";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { UserRole } from "@/types/mapable";

const PORTAL_NAV = [
  { href: "/accountability", label: "Overview" },
  { href: "/accountability/performance", label: "Performance" },
  { href: "/accountability/commitments", label: "Commitments" },
  { href: "/accountability/methodology", label: "Methodology" },
  { href: "/accountability/corrections", label: "Corrections" },
  { href: "/accountability/open-data", label: "Open data" },
  { href: "/accountability/submit", label: "Challenge" },
  { href: "/accountability/subscribe", label: "Subscribe" },
] as const;

export async function AccountabilityPublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="mapable-soft flex min-h-screen flex-col bg-[#F6FBFC] text-[#0C1833]">
      <SkipToContent />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/accountability"
              className="font-heading text-lg font-bold text-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
            >
              MapAble Accountability
            </Link>
            <p className="text-xs text-muted-foreground">
              Evidence-backed public transparency
            </p>
          </div>
          {user ? (
            <MapAbleUserBar
              userName={user.name}
              role={user.primaryRole as UserRole}
            />
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
            >
              Sign in
            </Link>
          )}
        </div>
        <nav
          aria-label="Accountability portal"
          className="border-t border-slate-100 bg-[#F6FBFC]"
        >
          <ul className="mx-auto flex w-full max-w-6xl flex-wrap gap-1 px-4 py-2">
            {PORTAL_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-[#0C1833] hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <CoreFooter />
    </div>
  );
}
