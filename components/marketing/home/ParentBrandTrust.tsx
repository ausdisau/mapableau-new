import Link from "next/link";
import React from "react";

import { parentBrandTrustCopy } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function ParentBrandTrust() {
  return (
    <section
      aria-labelledby="parent-brand-heading"
      className="bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-mapable-primary">
            {parentBrandTrustCopy.eyebrow}
          </p>
          <h2
            id="parent-brand-heading"
            className="mt-3 font-heading text-3xl font-black tracking-[-0.04em] text-mapable-text md:text-5xl"
          >
            {parentBrandTrustCopy.headline}
          </h2>
          <p className="mt-4 text-lg leading-[1.65] text-mapable-text-muted">
            {parentBrandTrustCopy.body}
          </p>
          <p className="mt-6">
            <Link
              href="/about"
              className={`text-sm font-black text-mapable-primary underline-offset-4 hover:underline ${mapableCareFocusRing}`}
            >
              Learn about MapAble
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
