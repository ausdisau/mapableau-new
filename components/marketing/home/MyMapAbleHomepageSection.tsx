import Link from "next/link";

import {
  marketingOutlineCtaClass,
  marketingPrimaryCtaClass,
} from "@/lib/marketing/brand-palette";

/** Public homepage section — honest claims only. */
export function MyMapAbleHomepageSection() {
  return (
    <section
      aria-labelledby="your-mapable-heading"
      className="border-y border-slate-200 bg-[#F7F8FC]"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#3B5BDB]">
          In development
        </p>
        <h2
          id="your-mapable-heading"
          className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#0C1833] md:text-4xl"
        >
          Your MapAble
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Plan life around what matters to you. Bring accessibility, mobility,
          support, work and participation together while keeping control over
          your information and decisions.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-slate-500">
          My MapAble is being developed in controlled pilots. Care bookings,
          live transport matching, and jobs participation remain separately
          governed — not generally available as live services here.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className={marketingPrimaryCtaClass}>
            Create My MapAble
          </Link>
          <Link href="/personal-agency" className={marketingOutlineCtaClass}>
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}
