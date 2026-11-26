import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { MAPABLE_UNIFIED_APP_ORIGIN } from "@/lib/config/mapable-unified";

export const metadata = {
  title: "MapAble Unified",
  description:
    "Find care, book transport, manage shifts and open the original MapAble Unified app.",
  alternates: canonicalAlternate("/unified"),
};

const actionStyle =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
const textLinkStyle =
  "inline-flex min-h-11 items-center rounded-sm font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const websiteSections = [
  {
    heading: "Care and transport",
    links: [
      ["Find care providers", "/care/find"],
      ["My website care bookings", "/care/bookings"],
      ["Request accessible transport", "/transport/request"],
      ["My website transport trips", "/dashboard/transport"],
      ["Practise a passenger trip", "/transport/passenger"],
    ],
  },
  {
    heading: "Work and community",
    links: [
      ["My worker shifts and offers", "/worker/today"],
      ["My worker profile", "/worker/profile"],
      ["Explore employment", "/employment"],
      ["Explore the accessibility map", "/accessibility-map"],
    ],
  },
];

export default async function UnifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string | string[] }>;
}) {
  const embedded = (await searchParams).open === "1";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 text-[#0C1833] sm:px-8">
      <header className="max-w-3xl space-y-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          MapAble Unified
        </h1>
        <p className="text-lg text-slate-700">
          Find care, request transport and manage shifts with your MapAble
          website account.
        </p>
      </header>
      <nav
        aria-label="MapAble website services"
        className="grid gap-4 sm:grid-cols-2"
      >
        {websiteSections.map(({ heading, links }) => (
          <div key={heading} className="rounded-xl border border-slate-200 p-5">
            <h2 className="font-heading text-xl font-bold">{heading}</h2>
            <ul className="mt-2">
              {links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} prefetch={false} className={textLinkStyle}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <section
        aria-labelledby="replit-heading"
        className="space-y-3 border-t border-slate-200 pt-5"
      >
        <h2 id="replit-heading" className="font-heading text-2xl font-bold">
          Original Replit app
        </h2>
        <p className="max-w-3xl text-slate-700">
          The original app has its own accounts, bookings and shifts. Open it in
          a new tab to sign in, or preview its welcome screen here.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={MAPABLE_UNIFIED_APP_ORIGIN}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className={`${actionStyle} bg-[#005B7F] text-white hover:bg-[#004766]`}
          >
            Open full Replit app (new tab)
          </a>
          {/* A document navigation applies this page’s frame policy even when the visitor came through a Next.js client transition. */}
          <form
            action={
              embedded ? "/unified#replit-heading" : "/unified#unified-app"
            }
            method="get"
          >
            <button
              type="submit"
              name={embedded ? undefined : "open"}
              value={embedded ? undefined : "1"}
              className={`${actionStyle} border border-slate-400 text-[#005B7F] hover:bg-slate-50`}
            >
              {embedded ? "Close app preview" : "Preview app here"}
            </button>
          </form>
        </div>
        {embedded && (
          <section
            id="unified-app"
            aria-label="Embedded MapAble Unified app"
            className="space-y-2 scroll-mt-20"
          >
            <a href="#website-dashboard" className={textLinkStyle}>
              Skip the app preview
            </a>
            <iframe
              title="MapAble Unified on Replit"
              src={MAPABLE_UNIFIED_APP_ORIGIN}
              sandbox="allow-forms allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              className="block h-[75vh] min-h-80 w-full rounded-xl border border-slate-300 bg-white"
            />
          </section>
        )}
      </section>
      <Link
        id="website-dashboard"
        href="/dashboard"
        prefetch={false}
        className={textLinkStyle}
      >
        My website dashboard
      </Link>
    </div>
  );
}
