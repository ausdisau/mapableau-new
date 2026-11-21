import Link from "next/link";

import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import { ACCESS_SIGNALS_DEMO_DATE_LABEL } from "@/lib/access-signals/demo-data";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

const NAV = [
  { href: "/access-signals", label: "Explore", match: "exact" as const },
  { href: "/access-signals/challenges", label: "Challenges", match: "prefix" as const },
  { href: "/access-signals/field-notes", label: "Field audit", match: "prefix" as const },
  { href: "/access-signals/remediation", label: "Remediation", match: "prefix" as const },
  { href: "/access-signals/evidence", label: "Evidence", match: "prefix" as const },
  { href: "/access-signals/change-ledger", label: "Change ledger", match: "prefix" as const },
  { href: "/access-signals/requirements", label: "Route requirements", match: "prefix" as const },
  { href: "/access-signals/settings", label: "Settings", match: "prefix" as const },
] as const;

export function AccessSignalsShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0C1833]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3"
      >
        Skip to content
      </a>
      <header className="bg-[#0C1833] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <MapAbleLogo
              href="/access-signals"
              variant="mark"
              ariaLabel="MapAble Access Signals home"
              className="rounded-md bg-white/10 p-1"
            />
            <p className="font-heading text-lg font-bold tracking-tight">
              MapAble <span className="font-semibold text-white/80">|</span> Access Signals
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex min-h-9 items-center rounded-full bg-[#F97316] px-3 py-1 font-bold text-[#0C1833]">
              Synthetic demo
            </span>
            <span className="text-white/80">{ACCESS_SIGNALS_DEMO_DATE_LABEL}</span>
          </div>
        </div>
        <nav
          aria-label="Access Signals"
          className="border-t border-white/15 bg-[#0C1833]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-2 py-1">
            {NAV.map((item) => {
              const active =
                item.match === "exact"
                  ? activePath === item.href
                  : activePath === item.href ||
                    activePath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-bold ${mapableInteractiveFocusRing} ${
                    active
                      ? "bg-white text-[#0C1833]"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-sm text-slate-600">
          <p role="note">
            Synthetic demo only. Status is scoped to one route requirement and is
            not an urgent-hazard claim. No real-place rating will be published
            from this demo.
          </p>
          <p>
            Map features are illustrative — not directions for travel. Use the
            text list as the accessible alternative to the map.
          </p>
        </div>
      </footer>
    </div>
  );
}
