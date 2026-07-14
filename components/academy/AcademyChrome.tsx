import Link from "next/link";

import {
  CAPABILITY_LEVEL_DISCLAIMER,
  COMPLIANCE_SUPPORT_DISCLAIMER,
} from "@/lib/academy/config";

const NAV = [
  { href: "/academy", label: "Home" },
  { href: "/academy/catalogue", label: "Catalogue" },
  { href: "/academy/about", label: "About" },
  { href: "/academy/accessibility", label: "Accessibility" },
  { href: "/academy/learn", label: "Learn" },
  { href: "/academy/provider", label: "Provider" },
  { href: "/academy/studio/courses", label: "Studio" },
] as const;

export function AcademyChrome({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="academy-root min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 text-slate-900">
      <a
        href="#academy-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-2xl font-bold tracking-tight text-teal-900">
              MapAble Academy
            </p>
            {title ? (
              <p className="text-sm text-slate-600">{title}</p>
            ) : (
              <p className="text-sm text-slate-600">
                Disability-led learning for support workers
              </p>
            )}
          </div>
          <nav aria-label="Academy" className="flex flex-wrap gap-3 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-2 py-1 text-teal-800 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="academy-main" className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-xs text-slate-600">
          <p>{COMPLIANCE_SUPPORT_DISCLAIMER}</p>
          <p>{CAPABILITY_LEVEL_DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  );
}
