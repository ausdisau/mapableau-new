import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/** Trust pillar — ADL social enterprise + community mapping. */
export function HomepageTrustCommunitySection() {
  return (
    <section
      aria-labelledby="trust-community-heading"
      className="bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          Trust &amp; community
        </p>
        <h2
          id="trust-community-heading"
          className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
        >
          By the community, for the community.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          MapAble is a social enterprise under Australian Disability Ltd. We
          close the accessibility information gap with evidence, lived
          experience, and volunteer mapping — not pay-to-rank listings.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/about"
            className={`inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-5 py-2 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
          >
            About MapAble
          </Link>
          <Link
            href="/mapping-days"
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 py-2 text-sm font-black text-white transition hover:bg-[#004766] ${mapableCareFocusRing}`}
          >
            Join a mapping day
          </Link>
          <Link
            href="/accessibility-statement"
            className={`inline-flex min-h-11 items-center rounded-xl px-5 py-2 text-sm font-black text-[#005B7F] underline-offset-4 hover:underline ${mapableCareFocusRing}`}
          >
            Accessibility statement
          </Link>
        </div>
      </div>
    </section>
  );
}
