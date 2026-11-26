import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { MAPABLE_UNIFIED_APP_ORIGIN } from "@/lib/config/mapable-unified";

export const metadata = {
  title: "MapAble Unified",
  description:
    "Open MapAble Unified for care, transport, work and everyday support.",
  alternates: canonicalAlternate("/unified"),
};

const actionStyle =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
const textLinkStyle =
  "inline-flex min-h-11 items-center rounded-sm font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

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
          Find support workers, request transport and manage shifts in the
          MapAble Unified app.
        </p>
        <p className="text-sm text-slate-600">
          The app runs on Replit and offers its own sign-in and demo accounts.
          For bookings made on this website, open your website transport trips.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {/* A document navigation applies this page’s frame policy even when the visitor came through a Next.js client transition. */}
        <form
          action={embedded ? "/unified" : "/unified#unified-app"}
          method="get"
        >
          <button
            type="submit"
            name={embedded ? undefined : "open"}
            value={embedded ? undefined : "1"}
            className={`${actionStyle} bg-[#005B7F] text-white hover:bg-[#004766]`}
          >
            {embedded ? "Close embedded app" : "Open app here"}
          </button>
        </form>
        <a
          href={MAPABLE_UNIFIED_APP_ORIGIN}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className={`${actionStyle} border border-slate-400 text-[#005B7F] hover:bg-slate-50`}
        >
          Open directly on Replit (new tab)
        </a>
      </div>
      {embedded && (
        <section
          id="unified-app"
          aria-label="Embedded MapAble Unified app"
          className="space-y-2 scroll-mt-20"
        >
          <p className="text-sm text-slate-600">
            If your browser blocks sign-in here, use “Open directly on Replit”.
          </p>
          <a href="#website-services" className={textLinkStyle}>
            Skip the embedded app
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
      <nav
        id="website-services"
        aria-label="Website services"
        tabIndex={-1}
        className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-3"
      >
        <Link
          href="/dashboard/transport"
          prefetch={false}
          className={textLinkStyle}
        >
          My website transport trips
        </Link>
        <Link href="/care/bookings" prefetch={false} className={textLinkStyle}>
          My website care bookings
        </Link>
        <Link href="/transport/passenger" className={textLinkStyle}>
          Practise a passenger trip
        </Link>
      </nav>
    </div>
  );
}
